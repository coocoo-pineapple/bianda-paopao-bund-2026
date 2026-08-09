#!/bin/bash
# 变大泡泡 · 自动粗剪：14 镜 x5s + 配音 + 字幕烧录
set -e
cd /d/bianda-paopao/docs
mkdir -p rough
ORDER="D0 E1 P1-desktop P2-bosskey E2 B2 B3 P4 C1 A3 A4 P3 E3 D9"
declare -A F
F[D0]="shots/video/D0.mp4"; F[E1]="shots/video/E1.mp4"
F[P1-desktop]="shots/video/P1-desktop.mp4"; F[P2-bosskey]="shots/video/P2-bosskey.mp4"
F[E2]="shots/video/E2 梦门.mp4"; F[B2]="shots/video/B2梦蝶.mp4"
F[B3]="shots/video/B3.mp4"; F[P3]="shots/video/P3 真真假假 .mp4"
F[P4]="shots/video/P4 技能集市.mp4"; F[C1]="shots/video/C1 三家作保.mp4"
F[A3]="shots/A3-video.mp4"; F[A4]="shots/video/A4 漏斗.mp4"
F[E3]="shots/video/E3 惊醒.mp4"; F[D9]="shots/video/D9.mp4"
# B3/D9 可能是外部渠道命名，兜底找
[ -f "${F[B3]}" ] || F[B3]=$(ls shots/video/*B3* 2>/dev/null | head -1)
[ -f "${F[D9]}" ] || F[D9]=$(ls shots/video/*D9* 2>/dev/null | head -1)
i=0; rm -f rough/list.txt
for k in $ORDER; do
  i=$((i+1)); src="${F[$k]}"
  if [ ! -f "$src" ]; then echo "缺 $k ($src)"; continue; fi
  if [ "$k" = "D9" ]; then SS="-sseof -5"; else SS="-t 5"; fi
  if [ "$k" = "D9" ]; then
    ffmpeg -y -v error -sseof -3.4 -i "$src" -vf "scale=1920:1080,fps=30,format=yuv420p" -an -c:v libx264 -preset fast "rough/c$i.mp4"
  else
    ffmpeg -y -v error -i "$src" -t 3.2 -vf "scale=1920:1080,fps=30,format=yuv420p" -an -c:v libx264 -preset fast "rough/c$i.mp4"
  fi
  echo "file 'c$i.mp4'" >> rough/list.txt
done
ffmpeg -y -v error -f concat -safe 0 -i rough/list.txt -c copy rough/video.mp4
# 配音：14 段按 5s 偏移混音
AIN=""; FIL=""; AMIX=""
for n in $(seq 1 14); do
  nn=$(printf "%02d" $n)
  AIN="$AIN -i vo/$nn.wav"
  d=$(( (n-1)*3200 + 200 ))
  FIL="$FIL[$((n-1)):a]adelay=$d|$d[a$n];"
  AMIX="$AMIX[a$n]"
done
ffmpeg -y -v error $AIN -filter_complex "${FIL}${AMIX}amix=inputs=14:normalize=0[out]" -map "[out]" -c:a aac rough/vo.m4a
# 合成 + 烧字幕
cp SUBTITLES-45s.srt rough/subs.srt
cd rough
ffmpeg -y -v error -i video.mp4 -i vo.m4a -vf "subtitles=subs.srt:force_style='FontName=Microsoft YaHei,FontSize=16,PrimaryColour=&HFFFFFF,OutlineColour=&H803A2B1E,Outline=2,MarginV=36'" -map 0:v -map 1:a -c:v libx264 -preset fast -crf 20 -c:a copy -shortest "../变大泡泡-45s.mp4"
echo "=== 粗剪完成: docs/变大泡泡-45s.mp4 ==="
