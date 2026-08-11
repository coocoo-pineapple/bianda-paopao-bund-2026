#!/bin/bash
# 纸雕生物 16 型：一型一只动物，2x2 网格生成 + 本地切图。用法: bash tools/gen_mbti_spec.sh
GEN="C:\\Users\\admin\\Documents\\New project\\generate_image_openai.ps1"
MODEL="gpt-image-2-count"
RAW="D:\\bianda-paopao\\public\\assets\\mbti\\spec"
RAWU="/d/bianda-paopao/public/assets/mbti/spec"

HEAD="A 2x2 grid of four separate square panels divided by clean thin white gutters. Handmade layered papercraft paper sculpture animal figurines, cut kraft paper and deep navy paper with gold foil accents, visible torn paper edges, soft drop shadows, stop-motion diorama craft, each animal standing upright on two legs on a plain white panel, each wearing a tiny cream paper office shirt collar and a navy paper lanyard with a gold foil badge."
TAILS="No text, no watermark, high detail"

P="a paper speech bubble beside the head and beak open talking"
PM="a paper speech bubble beside the head and mouth open talking"
Y="a paper tape strip sealing the mouth shut"
J="holding a steaming paper coffee cup"
T="two big paper letter Z shapes floating above the head"
B="a big black paper frying pan strapped on the back"
S="a black paper frying pan flying away behind with paper motion streaks"
H="a large glowing gold foil pie disc floating above the head like a halo"
C="a small gold foil pie dangling on a paper string in front of the face"

declare -a GRIDS=(
  "G1|PJBH,PJBC,PJSH,PJSC|$HEAD All four have $J. Top left: a rooster with chest puffed out, $P, $B, $H. Top right: a golden retriever wagging its tail, $PM, $B, $C. Bottom left: a peacock with tail fanned open, $P, $S, $H. Bottom right: a fox with narrowed clever eyes, $PM, $S, $C. $TAILS"
  "G2|PTBH,PTBC,PTSH,PTSC|$HEAD All four have $T. Top left: a parrot flapping excitedly, $P, $B, $H. Top right: a corgi grinning with tongue out, $PM, $B, $C. Bottom left: a monkey smirking with one eyebrow raised, $PM, $S, $H. Bottom right: a raccoon giving a thumbs up, $PM, $S, $C. $TAILS"
  "G3|YJBH,YJBC,YJSH,YJSC|$HEAD All four have $Y and $J. Top left: an owl with half closed thoughtful eyes, $B, $H. Top right: a weary ox with slumped shoulders and heavy eye bags, $B, $C. Bottom left: a raven with tiny round gold glasses staring sidelong, $S, $H. Bottom right: an ant standing blank and expressionless, $S, $C. $TAILS"
  "G4|YTBH,YTBC,YTSH,YTSC|$HEAD All four have $Y and $T. Top left: a jellyfish drifting dreamily, $B, $H. Top right: a hedgehog curling back timidly, $B, $C. Bottom left: a sloth hanging lazily with half lidded eyes, $S, $H. Bottom right: a dried salted fish lying flat and completely checked out, $S, $C. $TAILS"
)

for round in $(seq 1 12); do
  pending=0
  for g in "${GRIDS[@]}"; do
    IFS='|' read -r gid names prompt <<< "$g"
    grid="$RAW\\grid-$gid.png"
    [ -f "$RAWU/grid-$gid.png" ] && continue
    pending=1
    echo "[round $round] spec $gid ..."
    if powershell -File "$GEN" -Model "$MODEL" -Prompt "$prompt" -Size 1024x1024 -Quality high -OutFile "$grid" -Retries 2 2>&1 | grep -q "^Saved:"; then
      echo "[ok] spec $gid"
      powershell -File "D:\\bianda-paopao\\tools\\slice_grid.ps1" -In "$grid" -Out "$RAW" -Names "$names"
    else
      echo "[fail] spec $gid — sleep 90s"; sleep 90; break
    fi
  done
  [ "$pending" = 0 ] && { echo "ALL MBTI SPEC DONE"; exit 0; }
done
echo "GAVE UP"
exit 1
