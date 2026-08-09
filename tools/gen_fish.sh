#!/bin/bash
# 机器人形象改成庄周的鱼：纸雕机械锦鲤，三个姿势（农夫/趴窗/驮文件）
GEN="C:\\Users\\admin\\Documents\\New project\\generate_image_openai.ps1"
MODEL="gpt-image-2-count"
OUT="D:\\bianda-paopao\\public\\assets"
STYLE="cute papercraft craft style robotic koi fish character, round chubby body, deep indigo blue layered paper scales with golden swirl patterns, small mechanical paper fins with amber joints, big friendly glowing warm amber eyes, dreamy Zhuangzi taoist ink-painting spirit, handmade paper sculpture aesthetic, soft studio light, isolated on transparent background, no text, high detail"

declare -a TASKS=(
  "fish-farmer.png|$STYLE, wearing a tiny straw farmer hat, a small wooden watering can hanging from one fin, hovering beside a paper cabbage"
  "fish-perch.png|$STYLE, draped over an invisible horizontal edge as if lying on a window sill, head and front fins dangling down toward the viewer, one fin loosely holding a small magnifying glass, relaxed happy, tail up behind, no ledge or ground visible"
  "fish-carry.png|$STYLE, swimming forward carrying a neat stack of paper spreadsheet documents balanced on its back, one sheet flying off behind"
)

winpath_to_unix() { echo "$1" | sed 's|\\|/|g; s|^D:|/d|; s|^C:|/c|'; }

for round in $(seq 1 12); do
  pending=0
  for task in "${TASKS[@]}"; do
    IFS='|' read -r name prompt <<< "$task"
    f="$OUT\\$name"
    [ -f "$(winpath_to_unix "$f")" ] && continue
    pending=1
    echo "[round $round] $name ..."
    if powershell -File "$GEN" -Model "$MODEL" -Prompt "$prompt" -Size 1024x1024 -Quality high -Background transparent -OutFile "$f" -Retries 2 2>&1 | grep -q "^Saved:"; then
      echo "[ok] $name"
    else
      echo "[fail] $name — sleep 120s"; sleep 120; break
    fi
  done
  [ "$pending" = 0 ] && { echo "ALL FISH DONE"; exit 0; }
done
exit 1
