#!/bin/bash
# 熊猫头 16 型：2x2 网格生成 + 本地切图。用法: bash tools/gen_mbti_panda.sh
GEN="C:\\Users\\admin\\Documents\\New project\\generate_image_openai.ps1"
MODEL="gpt-image-2-count"
RAW="D:\\bianda-paopao\\public\\assets\\mbti\\panda"
RAWU="/d/bianda-paopao/public/assets/mbti/panda"

HEAD="A 2x2 grid of four separate square panels divided by clean thin white gutters, each panel contains one crude Chinese doutu meme sticker on a plain white background. All four are the same grainy black and white photocopy-look cartoon panda head on a simple hand-drawn human body wearing a white office shirt with a blue lanyard ID badge, thick rough black marker outlines, low quality internet meme aesthetic, only the lanyard is blue."
TAILP="No text, no watermark"

P="a big speech bubble beside the head and mouth open talking"
Y="a strip of tape sealing the mouth shut"
J="holding a steaming coffee cup"
T="two big letter Z shapes floating above the head"
B="a big black frying pan strapped on the back"
S="a black frying pan flying away behind with motion streaks"
H="a large glowing golden pie disc floating above the head like a halo"
C="a small golden pie dangling on a string in front of the face"

declare -a GRIDS=(
  "G1|PJBH,PJBC,PJSH,PJSC|$HEAD All four have $P and $J. Top left: $B, $H, manic wide grin with bulging eyes. Top right: $B, $C, smiling far too hard with squinted eyes. Bottom left: $S, $H, chin raised smug. Bottom right: $S, $C, flat template smile. $TAILP"
  "G2|PTBH,PTBC,PTSH,PTSC|$HEAD All four have $P and $T. Top left: $B, $H, eyebrows flying up excited. Top right: $B, $C, goofy wide open mouth laughing. Bottom left: $S, $H, one eyebrow raised crooked smirk. Bottom right: $S, $C, narrowed smiling eyes thumbs up. $TAILP"
  "G3|YJBH,YJBC,YJSH,YJSC|$HEAD All four have $Y and $J. Top left: $B, $H, quiet downcast eyes. Top right: $B, $C, exhausted heavy eye bags slumped shoulders. Bottom left: $S, $H, tiny round glasses staring sidelong. Bottom right: $S, $C, blank dead expressionless stare. $TAILP"
  "G4|YTBH,YTBC,YTSH,YTSC|$HEAD All four have $Y and $T. Top left: $B, $H, dreamy gazing off to the side. Top right: $B, $C, timid shrinking back avoiding eyes. Bottom left: $S, $H, half lidded knowing eyes. Bottom right: $S, $C, completely checked out face tilted up. $TAILP"
)

for round in $(seq 1 12); do
  pending=0
  for g in "${GRIDS[@]}"; do
    IFS='|' read -r gid names prompt <<< "$g"
    grid="$RAW\\grid-$gid.png"
    [ -f "$RAWU/grid-$gid.png" ] && continue
    pending=1
    echo "[round $round] panda $gid ..."
    if powershell -File "$GEN" -Model "$MODEL" -Prompt "$prompt" -Size 1024x1024 -Quality high -OutFile "$grid" -Retries 2 2>&1 | grep -q "^Saved:"; then
      echo "[ok] panda $gid"
      powershell -File "D:\\bianda-paopao\\tools\\slice_grid.ps1" -In "$grid" -Out "$RAW" -Names "$names"
    else
      echo "[fail] panda $gid — sleep 90s"; sleep 90; break
    fi
  done
  [ "$pending" = 0 ] && { echo "ALL MBTI PANDA DONE"; exit 0; }
done
echo "GAVE UP"
exit 1
