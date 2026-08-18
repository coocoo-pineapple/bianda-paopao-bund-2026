# 生图出来的白底方图 → 桌面图标：抠白底、去投影、缩到 256x256 透明 PNG
# 用法：powershell -File tools\icon-cut.ps1 -In icon-mbti-b.png -Out public\assets\icons\it-mbti.png
param(
  [Parameter(Mandatory = $true)][string]$In,
  [Parameter(Mandatory = $true)][string]$Out,
  [int]$Size = 256,
  [int]$Thr = 224   # 亮度高于这个值、且与四边连通的像素判为背景
)

Add-Type -AssemblyName System.Drawing
Add-Type @'
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;

public static class IconCut {
  public static void Run(string src, string dst, int size, int thr) {
    Bitmap big = new Bitmap(src);
    Bitmap b = new Bitmap(size, size, PixelFormat.Format32bppArgb);
    using (Graphics g = Graphics.FromImage(b)) {
      g.InterpolationMode = System.Drawing.Drawing2D.InterpolationMode.HighQualityBicubic;
      g.DrawImage(big, 0, 0, size, size);
    }
    big.Dispose();

    int n = size * size;
    int[] px = new int[n];
    BitmapData d = b.LockBits(new Rectangle(0, 0, size, size), ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
    System.Runtime.InteropServices.Marshal.Copy(d.Scan0, px, 0, n);

    // 四边泛洪：只有连通到画面外沿的亮像素才算背景，夹板上那张白纸不会被打穿
    bool[] outside = new bool[n];
    Queue<int> q = new Queue<int>();
    for (int i = 0; i < size; i++) {
      int[] seeds = { i, (size - 1) * size + i, i * size, i * size + size - 1 };
      foreach (int s in seeds) if (!outside[s] && Lum(px[s]) >= thr) { outside[s] = true; q.Enqueue(s); }
    }
    while (q.Count > 0) {
      int p = q.Dequeue(); int x = p % size, y = p / size;
      int[] nb = { x > 0 ? p - 1 : -1, x < size - 1 ? p + 1 : -1, y > 0 ? p - size : -1, y < size - 1 ? p + size : -1 };
      foreach (int m in nb) if (m >= 0 && !outside[m] && Lum(px[m]) >= thr) { outside[m] = true; q.Enqueue(m); }
    }

    // 背景直接透明；紧邻背景的边缘像素按亮度给半透明，压掉白边
    for (int p = 0; p < n; p++) {
      if (outside[p]) { px[p] = 0; continue; }
      int x = p % size, y = p / size;
      bool edge = (x > 0 && outside[p - 1]) || (x < size - 1 && outside[p + 1])
               || (y > 0 && outside[p - size]) || (y < size - 1 && outside[p + size]);
      if (!edge) continue;
      int l = Lum(px[p]);
      if (l <= thr) continue;
      int a = (int)(255.0 * (255 - l) / (255 - thr));
      if (a < 0) a = 0; if (a > 255) a = 255;
      px[p] = (a << 24) | (px[p] & 0x00FFFFFF);
    }

    System.Runtime.InteropServices.Marshal.Copy(px, 0, d.Scan0, n);
    b.UnlockBits(d);
    b.Save(dst, ImageFormat.Png);
    b.Dispose();
  }

  static int Lum(int argb) {
    if (((argb >> 24) & 0xFF) < 8) return 255;
    int r = (argb >> 16) & 0xFF, g = (argb >> 8) & 0xFF, bb = argb & 0xFF;
    return (r * 30 + g * 59 + bb * 11) / 100;
  }
}
'@ -ReferencedAssemblies System.Drawing

$inPath = (Resolve-Path $In).Path
$outPath = [System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Out))
[IconCut]::Run($inPath, $outPath, $Size, $Thr)
Write-Output "icon -> $outPath ($Size x $Size)"
