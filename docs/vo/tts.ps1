Add-Type -AssemblyName System.Speech
$syn = New-Object System.Speech.Synthesis.SpeechSynthesizer
$v = $syn.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -eq 'zh-CN' } | Select-Object -First 1
if ($v) { $syn.SelectVoice($v.VoiceInfo.Name); Write-Output ("voice: " + $v.VoiceInfo.Name) } else { Write-Output "no zh-CN voice" }
$syn.Rate = 1
Get-Content -Encoding UTF8 "D:\bianda-paopao\docs\vo\lines.txt" | ForEach-Object {
  $p = $_.Split('|')
  if ($p.Count -ge 2) {
    $out = "D:\bianda-paopao\docs\vo\" + $p[0] + ".wav"
    $syn.SetOutputToWaveFile($out)
    $syn.Speak($p[1])
    Write-Output ("ok " + $p[0])
  }
}
$syn.Dispose()
