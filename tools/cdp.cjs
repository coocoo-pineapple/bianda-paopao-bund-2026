// 零依赖浏览器驱动：系统自带 Edge + CDP + Node 内置 WebSocket
// playwright 没装也能跑验收。用法见 probe-kit.cjs
const { spawn } = require('child_process');
const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const EDGE = [
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Microsoft/Edge/Application/msedge.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe'
].find(p => fs.existsSync(p));

function getJSON(url) {
  return new Promise((res, rej) => {
    http.get(url, r => { let d = ''; r.on('data', c => d += c); r.on('end', () => { try { res(JSON.parse(d)); } catch (e) { rej(e); } }); }).on('error', rej);
  });
}
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function launch(opt = {}) {
  if (!EDGE) throw new Error('没找到 Edge/Chrome');
  const port = 9222 + Math.floor(Math.random() * 700);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'bpcdp-'));
  const w = opt.width || 1440, h = opt.height || 900;
  const proc = spawn(EDGE, [
    '--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`,
    `--window-size=${w},${h}`, '--mute-audio', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-gpu',
    ...(opt.reduced ? ['--force-prefers-reduced-motion'] : []),
    'about:blank'
  ], { stdio: 'ignore' });

  let target = null;
  for (let i = 0; i < 60 && !target; i++) {
    await sleep(250);
    try { target = (await getJSON(`http://127.0.0.1:${port}/json/list`)).find(t => t.type === 'page'); } catch (e) {}
  }
  if (!target) { proc.kill(); throw new Error('CDP 没起来'); }

  const ws = new WebSocket(target.webSocketDebuggerUrl);
  await new Promise((res, rej) => { ws.onopen = res; ws.onerror = rej; });

  let id = 0;
  const waiting = new Map();
  const listeners = [];
  ws.onmessage = ev => {
    const m = JSON.parse(ev.data);
    if (m.id && waiting.has(m.id)) { const { res, rej } = waiting.get(m.id); waiting.delete(m.id);
      m.error ? rej(new Error(m.error.message)) : res(m.result); }
    else if (m.method) listeners.forEach(fn => fn(m));
  };
  const send = (method, params) => new Promise((res, rej) => {
    const i = ++id; waiting.set(i, { res, rej });
    ws.send(JSON.stringify({ id: i, method, params: params || {} }));
    setTimeout(() => { if (waiting.has(i)) { waiting.delete(i); rej(new Error('CDP 超时: ' + method)); } }, 30000);
  });

  await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');

  const errs = [];
  listeners.push(m => {
    if (m.method === 'Runtime.exceptionThrown') {
      const d = m.params.exceptionDetails;
      errs.push('PAGEERROR: ' + (d.exception && d.exception.description || d.text));
    }
    if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') {
      errs.push('CONSOLE: ' + m.params.entry.text);
    }
    if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') {
      errs.push('CONSOLE: ' + m.params.args.map(a => a.value || a.description || '').join(' '));
    }
  });

  const page = {
    errs,
    async goto(url) {
      await send('Page.navigate', { url });
      await new Promise(res => {
        const fn = m => { if (m.method === 'Page.loadEventFired') { listeners.splice(listeners.indexOf(fn), 1); res(); } };
        listeners.push(fn);
        setTimeout(res, 20000);
      });
    },
    async evaluate(fn, arg) {
      const expr = `(${fn.toString()})(${arg === undefined ? '' : JSON.stringify(arg)})`;
      const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || r.exceptionDetails.text);
      return r.result.value;
    },
    async key(key, mods) {
      // mods: 2=Ctrl, 8=Alt, 4=Shift
      const base = { modifiers: mods || 0, windowsVirtualKeyCode: key.code, key: key.key, code: key.name };
      await send('Input.dispatchKeyEvent', { type: 'keyDown', ...base });
      await send('Input.dispatchKeyEvent', { type: 'keyUp', ...base });
    },
    async click(sel) {
      const box = await page.evaluate(s => {
        const e = document.querySelector(s); if (!e) return null;
        const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
      }, sel);
      if (!box) return false;
      for (const type of ['mousePressed', 'mouseReleased'])
        await send('Input.dispatchMouseEvent', { type, x: box.x, y: box.y, button: 'left', clickCount: 1 });
      return true;
    },
    async shot(file) {
      const r = await send('Page.captureScreenshot', { format: 'png' });
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, Buffer.from(r.data, 'base64'));
    },
    sleep,
    clean() { return errs.filter(e => !/ERR_FILE_NOT_FOUND|404|favicon|ERR_NAME_NOT_RESOLVED|net::/i.test(e)); },
    async close() { try { ws.close(); } catch (e) {} proc.kill(); await sleep(300); try { fs.rmSync(dir, { recursive: true, force: true }); } catch (e) {} }
  };
  return page;
}

const KEY = {
  space: { code: 32, key: ' ', name: 'Space' },
  esc: { code: 27, key: 'Escape', name: 'Escape' },
  enter: { code: 13, key: 'Enter', name: 'Enter' }
};

module.exports = { launch, KEY, sleep };
