try { $app = New-Object -ComObject KWPP.Application } catch { try { $app = New-Object -ComObject WPP.Application } catch { Write-Output "NO_WPS"; exit 1 } }
$pres = $app.Presentations.Open("D:\bianda-paopao\docs\变大泡泡-产品介绍.pptx", $true, $false, $false)
$pres.SaveAs("D:\bianda-paopao\docs\变大泡泡-产品介绍.pdf", 32)
$pres.Close()
$app.Quit()
Write-Output "PDF done"
