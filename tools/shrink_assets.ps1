param()
Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

function Resize-Png {
    param([string]$Path, [int]$MaxDim)
    $img = [System.Drawing.Image]::FromFile($Path)
    try {
        if ($img.Width -le $MaxDim -and $img.Height -le $MaxDim) { return $false }
        $ratio = [Math]::Min($MaxDim / $img.Width, $MaxDim / $img.Height)
        $w = [int]($img.Width * $ratio); $h = [int]($img.Height * $ratio)
        $bmp = New-Object System.Drawing.Bitmap($w, $h)
        $g = [System.Drawing.Graphics]::FromImage($bmp)
        $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
        $g.DrawImage($img, 0, 0, $w, $h)
        $g.Dispose()
        $tmp = "$Path.tmp.png"
        $bmp.Save($tmp, [System.Drawing.Imaging.ImageFormat]::Png)
        $bmp.Dispose()
        $img.Dispose()
        Move-Item -Force $tmp $Path
        return $true
    } finally { if ($img) { $img.Dispose() } }
}

$root = "D:\bianda-paopao\public\assets"
$did = 0

# 图标：显示 <=58px，256 足够
Get-ChildItem "$root\icons\*.png" | ForEach-Object {
    if (Resize-Png $_.FullName 256) { $script:did++; Write-Output ("icon 256  " + $_.Name) }
}
# 角色立绘：显示 <=240px，512 足够
foreach ($n in @('bot-carry','bot-farmer','bot-perch','bot-scraper','fish-carry','fish-farmer','fish-perch','bi-fish')) {
    $p = "$root\$n.png"
    if (Test-Path $p) { if (Resize-Png $p 512) { $did++; Write-Output ("char 512  $n.png") } }
}
# 游戏场景背景：窗口 ~400-480px 宽，900 足够
foreach ($n in @('gomoku-wood','hide-office','wordgame-bg','phone-wall')) {
    $p = "$root\$n.png"
    if (Test-Path $p) { if (Resize-Png $p 900) { $did++; Write-Output ("scene 900 $n.png") } }
}
# MBTI 人格画像：结算页显示 <=260px，512 足够
foreach ($d in @('paper','cat','spec','panda')) {
    Get-ChildItem "$root\mbti\$d\*.png" -ErrorAction SilentlyContinue | ForEach-Object {
        if (Resize-Png $_.FullName 512) { $script:did++; Write-Output ("mbti 512  $d/" + $_.Name) }
    }
}
Write-Output "RESIZED $did files"
