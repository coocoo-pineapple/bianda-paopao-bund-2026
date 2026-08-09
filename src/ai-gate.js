/* ============================================================
   变大泡泡 · AI 熔断器（Durable Object）
   为什么不能照搬 server/ai.js 的 Map：Worker 在多个边缘节点上各跑各的
   isolate，进程内计数各数各的，公开链接照样能烧钱。计数必须有唯一归属地，
   所以全局每日总量和单 IP 每小时都放进同一个 DO 实例里串行结算。
   存储用 SQLite 后端（免费版唯一可用的 DO 存储）。
   ============================================================ */
import { DurableObject } from 'cloudflare:workers';

const HOUR_MS = 3600 * 1000;

/** 单例 DO 的固定名字，Worker 侧用 idFromName 取同一个实例 */
export const GATE_SINGLETON = 'global';

export class AiGate extends DurableObject {
  constructor(ctx, env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sql.exec('CREATE TABLE IF NOT EXISTS day_usage (day TEXT PRIMARY KEY, n INTEGER NOT NULL)');
    this.sql.exec('CREATE TABLE IF NOT EXISTS ip_usage (ip TEXT PRIMARY KEY, n INTEGER NOT NULL, since INTEGER NOT NULL)');
  }

  /**
   * 放行判定。语义与 server/ai.js 的 gate() 一致：
   * 返回 null = 放行（并已计数）；返回字符串 = 拒绝原因，前端拿它降级。
   * @param {string} ip
   * @param {number} dailyLimit
   * @param {number} hourlyLimit
   * @returns {string | null}
   */
  check(ip, dailyLimit, hourlyLimit) {
    const now = Date.now();
    const today = utcDay(now);
    this.#sweep(today, now);

    if (this.#dayCount(today) >= dailyLimit) return '今日 AI 额度已熔断';

    const row = this.sql.exec('SELECT n, since FROM ip_usage WHERE ip = ?', ip).toArray()[0];
    const expired = !row || now - Number(row.since) > HOUR_MS;
    const used = expired ? 0 : Number(row.n);
    if (used >= hourlyLimit) return '这个马甲这小时问得太勤了';

    this.sql.exec(
      `INSERT INTO ip_usage (ip, n, since) VALUES (?, ?, ?)
       ON CONFLICT(ip) DO UPDATE SET n = excluded.n, since = excluded.since`,
      ip, used + 1, expired ? now : Number(row.since)
    );
    this.sql.exec(
      `INSERT INTO day_usage (day, n) VALUES (?, 1)
       ON CONFLICT(day) DO UPDATE SET n = n + 1`,
      today
    );
    return null;
  }

  /** 给 /api/health 看的用量快照，不计数 */
  stats() {
    const today = utcDay(Date.now());
    return { day: today, used: this.#dayCount(today) };
  }

  #dayCount(today) {
    const row = this.sql.exec('SELECT n FROM day_usage WHERE day = ?', today).toArray()[0];
    return row ? Number(row.n) : 0;
  }

  /** 过期行直接删，表就一直是小表，不需要额外的定时任务 */
  #sweep(today, now) {
    this.sql.exec('DELETE FROM day_usage WHERE day <> ?', today);
    this.sql.exec('DELETE FROM ip_usage WHERE ? - since > ?', now, HOUR_MS);
  }
}

const utcDay = (ms) => new Date(ms).toISOString().slice(0, 10);
