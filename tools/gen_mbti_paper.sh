#!/bin/bash
# MBTI 16 型纸雕人像：每型男女各一张，单张生成，断点续跑。用法: bash tools/gen_mbti_paper.sh
# 规格对齐 paper/YJSH-m.png：全身站姿 + 透明底 + 纸雕材质 + 四道具 + 两只手
GEN="C:\\Users\\admin\\Documents\\New project\\generate_image_openai.ps1"
MODEL="gpt-image-2-count"
OUT="D:\\bianda-paopao\\public\\assets\\mbti\\paper"

MAT="Handmade layered papercraft paper sculpture figurine, cut kraft paper and deep navy paper with gold foil accents, visible torn paper edges, soft drop shadows, stop-motion diorama craft, full body standing figure. Subject:"
TAIL="anatomically correct with only two arms and two hands. Isolated on transparent background, no text, high detail"

# 八件道具固定写法
P="a big paper speech bubble popping out beside the head, mouth open talking"
Y="mouth sealed with a paper tape strip"
J="the right hand holds a steaming paper coffee cup"
T="two big paper letter Z shapes floating above the head"
B="a big black paper cast iron frying pan strapped on the back, visible over the shoulder"
S="a black paper frying pan flying away behind with paper motion streaks"
H="a large glowing gold foil pie disc floating above the head like a halo"
C="a small gold foil pie dangling on a paper string in front of the face, just out of reach"

M="wearing a cream paper shirt with navy paper lanyard and gold foil badge, navy paper trousers and paper shoes"
W="wearing a cream paper blouse with navy paper lanyard and gold foil badge, navy paper skirt and paper flat shoes"

declare -a TASKS=(
  "PJBH-f|$MAT an ecstatic female leader with a high ponytail and glowing wide eyes leaning forward, $W, $P, $J, left arm raised in a fist, $B, $H, $TAIL"
  "PJBC-m|$MAT an overly eager male people-pleaser with neat side-parted hair smiling far too hard, $M, $P, $J, left arm hugging a stack of paper documents, $B, $C, $TAIL"
  "PJSH-f|$MAT a triumphant female speaker with short sharp bob hair and chin raised high, $W, $P, $J, left arm pointing forward, $S, $H, $TAIL"
  "PJSC-f|$MAT a shrewd female middle manager with hair in a tight bun and a standard template smile, $W, $P, $J, left hand in the skirt pocket, $S, $C, $TAIL"
  "PTBH-f|$MAT an animated female daydreamer with curly hair and eyebrows flying up, $W, $P, the right hand open gesturing wildly, left hand on the hip, $T, $B, $H, $TAIL"
  "PTBC-m|$MAT a goofy grinning male extrovert with round cheeks laughing with a wide open mouth, $M, $P, the right hand waving hello, left arm hanging down, $T, $B, $C, $TAIL"
  "PTSH-f|$MAT a smug female arguer with one eyebrow raised and a crooked smirk, $W, $P, the right hand holding a small paper laser pointer, left arm hanging down, $T, $S, $H, $TAIL"
  "PTSC-m|$MAT a slick male meeting animal with slicked back hair and narrowed smiling eyes, $M, $P, the right hand giving a thumbs up, left hand in the trouser pocket, $T, $S, $C, $TAIL"
  "YJBH-m|$MAT a quiet male strategist with long bangs over downcast eyes, $M, $Y, $J, left arm hugging a paper notebook, $B, $H, $TAIL"
  "YJBC-m|$MAT an exhausted honest male worker with slumped shoulders and heavy eye bags, $M, $Y, $J, the left hand pressing his lower back, $B, $C, $TAIL"
  "YJSH-f|$MAT a cold female mastermind with round gold rimmed glasses and a sidelong smirk, $W, $Y, $J, left arm hanging down at the side, $S, $H, $TAIL"
  "YJSC-f|$MAT an expressionless female worker staring blankly straight ahead, $W, $Y, $J, left arm holding a paper clipboard, $S, $C, $TAIL"
  "YTBH-m|$MAT a dreamy male creative with messy hair gazing off to the side, $M, $Y, the right hand propping up his chin, left arm hanging down, $T, $B, $H, $TAIL"
  "YTBC-m|$MAT a timid male worker with hair covering one eye shrinking back with avoiding eyes, $M, $Y, both arms folded across the chest, $T, $B, $C, $TAIL"
  "YTSH-f|$MAT a lazy female philosopher with half lidded knowing eyes seeing through everything, $W, $Y, the right hand propping up her chin, left arm hanging down, $T, $S, $H, $TAIL"
  "YTSC-m|$MAT a completely checked out male worker leaning far back with legs crossed and face tilted up, $M, $Y, both hands behind the head, $T, $S, $C, $TAIL"
)

winpath_to_unix() { echo "$1" | sed 's|\\|/|g; s|^D:|/d|; s|^C:|/c|'; }

for round in $(seq 1 20); do
  pending=0
  for task in "${TASKS[@]}"; do
    IFS='|' read -r name prompt <<< "$task"
    f="$OUT\\$name.png"
    [ -f "$(winpath_to_unix "$f")" ] && continue
    pending=1
    echo "[round $round] $name ..."
    if powershell -File "$GEN" -Model "$MODEL" -Prompt "$prompt" -Size 1024x1024 -Quality high -Background transparent -OutFile "$f" -Retries 2 2>&1 | grep -q "^Saved:"; then
      echo "[ok] $name"
    else
      echo "[fail] $name — sleep 90s"; sleep 90; break
    fi
  done
  [ "$pending" = 0 ] && { echo "ALL MBTI PAPER DONE"; exit 0; }
done
echo "GAVE UP"
exit 1
