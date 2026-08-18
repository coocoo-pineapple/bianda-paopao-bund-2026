#!/bin/bash
# 变大泡泡 · 宣传片 v2 重剪：14 拍 x3.2s + 新旁白 + 新字幕
# 只换叙事顺序，不重新生成任何视频素材
set -e
cd /d/bianda-paopao/docs
mkdir -p rough-v2

# 14 拍 → 现有素材（每条只用一次）
SRC=(
  "shots/video/D0.mp4"            # 1  一句真话，说出来没人听见
  "shots/video/P1-desktop.mp4"    # 2  所以我们造了台假Windows
  "shots/video/E2 梦门.mp4"       # 3  壳是假的，里面全是活人
  "shots/video/A4 漏斗.mp4"       # 4  说句真话，别人吹口气就变大
  "shots/video/E1.mp4"            # 5  没人理会就沉底，沉底还能捞
  "shots/video/B3 毒菜2.mp4"      # 6  说真话要签名，吹牛的绕道
  "shots/video/C1 三家作保.mp4"   # 7  工资别猜，三个同行帮你对
  "shots/video/B3 毒菜.mp4"       # 8  职场的坑，先在梦蝶局摔一遍
  "shots/video/B2梦蝶.mp4"        # 9  四个AI互相试探，看不见底牌
  "shots/video/P3 真真假假 .mp4"  # 10 摔过的坑存成卷宗，留给后人
  "shots/A3-video.mp4"            # 11 你睡你的，分身在局里攒简历
  "shots/video/P4 技能集市.mp4"   # 12 那点本事有人买，接不住转真人
  "shots/video/P2-bosskey.mp4"    # 13 老板来了？按一下。毕竟在上班
  "shots/video/E3 惊醒.mp4"       # 14 子非鱼，安知鱼之乐。变大泡泡
)

# 第 4 拍的 A4 漏斗原素材带「312/312/14」数字牌——那是旧漏斗口径，
# 放进片子会被读成用户数。裁掉左侧数字牌区域，只留水层与传送带。
declare -A VF
VF[4]="crop=w=780:h=439:x=500:y=140,scale=1920:1080"

for i in $(seq 0 13); do
  n=$((i+1)); src="${SRC[$i]}"
  [ -f "$src" ] || { echo "缺素材：$src"; exit 1; }
  vf="${VF[$n]:-scale=1920:1080}"
  ffmpeg -y -v error -i "$src" -t 3.6 -vf "$vf,fps=30,format=yuv420p" -an \
    -c:v libx264 -preset fast -crf 18 "rough-v2/c$n.mp4"
done

# 旁白：去掉 TTS 首尾静音后按 3.2s 节拍铺开
AIN=""; FIL=""; AMIX=""
for n in $(seq 1 14); do
  nn=$(printf "%02d" $n)
  ffmpeg -y -v error -i "vo/v2-$nn.wav" \
    -af "silenceremove=start_periods=1:start_silence=0.05:start_threshold=-50dB:stop_periods=-1:stop_silence=0.12:stop_threshold=-50dB" \
    "rough-v2/v$nn.wav"
  AIN="$AIN -i rough-v2/v$nn.wav"
  d=$(( (n-1)*3200 + 250 ))
  FIL="$FIL[$((n-1)):a]adelay=$d|$d[a$n];"
  AMIX="$AMIX[a$n]"
done
ffmpeg -y -v error $AIN -filter_complex "${FIL}${AMIX}amix=inputs=14:normalize=0[out]" \
  -map "[out]" -c:a aac rough-v2/vo.m4a

# 交叉溶解链：0.4s fade，节拍 3.2s
cd rough-v2
INS=""; FILT=""
for n in $(seq 1 14); do INS="$INS -i c$n.mp4"; done
prev="[0:v]"
for n in $(seq 1 13); do
  off=$(awk "BEGIN{printf \"%.2f\", $n*3.2}")
  out="[v$n]"; [ $n -eq 13 ] && out="[vout]"
  FILT="$FILT$prev[$n:v]xfade=transition=fade:duration=0.4:offset=$off$out;"
  prev="$out"
done
FILT="${FILT%;}"
ffmpeg -y -v error $INS -filter_complex "$FILT" -map "[vout]" \
  -c:v libx264 -preset fast -crf 18 -pix_fmt yuv420p video.mp4

# 合成 + 烧字幕
cp ../SUBTITLES-45s-v2.srt subs.srt
ffmpeg -y -v error -i video.mp4 -i vo.m4a \
  -vf "subtitles=subs.srt:force_style='FontName=Microsoft YaHei,FontSize=16,PrimaryColour=&HFFFFFF,OutlineColour=&H803A2B1E,Outline=2,MarginV=36'" \
  -map 0:v -map 1:a -c:v libx264 -preset fast -crf 20 -c:a copy -shortest \
  "../变大泡泡-45s-v2.mp4"
echo "=== v2 完成: docs/变大泡泡-45s-v2.mp4 ==="
