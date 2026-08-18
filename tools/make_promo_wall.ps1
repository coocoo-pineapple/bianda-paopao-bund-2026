# Compose a 4x4 promo wall from 16 finished MBTI portraits.
# Usage: powershell -File tools\make_promo_wall.ps1 -Dir public\assets\mbti\paper -Out output\promo-wall.png
param(
    [Parameter(Mandatory = $true)][string]$Dir,
    [Parameter(Mandatory = $true)][string]$Out,
    [string]$Suffix = "",
    [int]$Cell = 420,
    [string]$Bg = "#0E1B2E"
)

Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = "Stop"

$codes = @(
    'PJBH', 'PJBC', 'PJSH', 'PJSC',
    'PTBH', 'PTBC', 'PTSH', 'PTSC',
    'YJBH', 'YJBC', 'YJSH', 'YJSC',
    'YTBH', 'YTBC', 'YTSH', 'YTSC'
)
$names = @(
    '卷王发动机', '靠谱接盘侠', '甩锅演说家', '向上管理专家',
    '嘴强王者', '热心老实人', 'PPT 艺术家', '会议室常驻民',
    '沉默造饼人', '老黄牛', '暗线操盘手', '闷头执行者',
    '隐形设计师', '工位隐身人', '摸鱼哲学家', '带薪呼吸大师'
)

$pad = [int]($Cell * 0.04)
$label = [int]($Cell * 0.22)
$wallW = $Cell * 4
$wallH = ($Cell + $label) * 4

$bmp = New-Object System.Drawing.Bitmap $wallW, $wallH
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.TextRenderingHint = [System.Drawing.Text.TextRenderingHint]::ClearTypeGridFit
$g.Clear([System.Drawing.ColorTranslator]::FromHtml($Bg))

$gold = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#D4A94A"))
$cream = New-Object System.Drawing.SolidBrush ([System.Drawing.ColorTranslator]::FromHtml("#EDE6D8"))
$fCode = New-Object System.Drawing.Font "Consolas", ($Cell * 0.062), ([System.Drawing.FontStyle]::Bold)
$fName = New-Object System.Drawing.Font "Microsoft YaHei", ($Cell * 0.05)
$fmt = New-Object System.Drawing.StringFormat
$fmt.Alignment = [System.Drawing.StringAlignment]::Center

for ($i = 0; $i -lt 16; $i++) {
    # [int](3/4) rounds to 1 in PowerShell — must floor explicitly.
    $col = $i % 4; $row = [int][Math]::Floor($i / 4)
    $x = $col * $Cell
    $y = $row * ($Cell + $label)

    $p = Join-Path $Dir ($codes[$i] + $Suffix + ".png")
    if (Test-Path $p) {
        $img = [System.Drawing.Image]::FromFile($p)
        $box = $Cell - $pad * 2
        $ratio = [Math]::Min($box / $img.Width, $box / $img.Height)
        $imgW = [int]($img.Width * $ratio); $imgH = [int]($img.Height * $ratio)
        $g.DrawImage($img, ($x + ($Cell - $imgW) / 2), ($y + $Cell - $pad - $imgH), $imgW, $imgH)
        $img.Dispose()
    }

    $ty = $y + $Cell + $pad * 0.4
    $g.DrawString($codes[$i], $fCode, $gold, ($x + $Cell / 2), $ty, $fmt)
    $g.DrawString($names[$i], $fName, $cream, ($x + $Cell / 2), ($ty + $Cell * 0.078), $fmt)
}

$g.Dispose()
$dir = Split-Path $Out -Parent
if ($dir -and -not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }
$bmp.Save($Out, [System.Drawing.Imaging.ImageFormat]::Png)
$bmp.Dispose()
Write-Output "Wall: $Out  ($wallW x $wallH)"
