# Slice a 2x2 grid image into 4 square images.
# Usage: powershell -File tools\slice_grid.ps1 -In grid.png -Out dir -Names "a,b,c,d"
# Order: top-left, top-right, bottom-left, bottom-right.
param(
    [Parameter(Mandatory = $true)][string]$In,
    [Parameter(Mandatory = $true)][string]$Out,
    [Parameter(Mandatory = $true)][string]$Names,
    [double]$Inset = 0.02
)

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"

$src = [System.Drawing.Image]::FromFile((Resolve-Path $In))
if (-not (Test-Path $Out)) { New-Item -ItemType Directory -Path $Out | Out-Null }

$half = [int]($src.Width / 2)
$halfH = [int]($src.Height / 2)
$pad = [int]($half * $Inset)
$parts = $Names.Split(',')
$cells = @(@(0, 0), @(1, 0), @(0, 1), @(1, 1))

for ($i = 0; $i -lt 4; $i++) {
    $cx = $cells[$i][0]; $cy = $cells[$i][1]
    $x = $cx * $half + $pad
    $y = $cy * $halfH + $pad
    $w = $half - $pad * 2
    $h = $halfH - $pad * 2
    $rect = New-Object System.Drawing.Rectangle $x, $y, $w, $h
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.DrawImage($src, (New-Object System.Drawing.Rectangle 0, 0, $w, $h), $rect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()
    $f = Join-Path $Out ($parts[$i].Trim() + ".png")
    $bmp.Save($f, [System.Drawing.Imaging.ImageFormat]::Png)
    $bmp.Dispose()
    Write-Output "Sliced: $f  ($w x $h)"
}
$src.Dispose()
