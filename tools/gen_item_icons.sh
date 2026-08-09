#!/bin/bash
# 文件夹条目小图标 ×15：与桌面图标同一套 Win11 Fluent 立体风，透明底
# mkFolder 已有探测逻辑，文件落地即自动换装。用法: bash tools/gen_item_icons.sh
GEN="C:\\Users\\admin\\Documents\\New project\\generate_image_openai.ps1"
MODEL="gpt-image-2-count"
OUT="D:\\bianda-paopao\\public\\assets\\icons"
STYLE="Windows 11 Fluent Design style 3D app icon, soft gradients, subtle depth, front-facing, centered composition, isolated on transparent background, no text, no watermark, clean, high detail"

declare -a TASKS=(
  "it-draw.png|pixel art bead grid forming a small blue fish on a green spreadsheet tile, playful mosaic beads, $STYLE"
  "it-dream.png|deep red theater masks pair with a small blue butterfly resting on top, mystery game feel, $STYLE"
  "it-word.png|purple open book with sparkling star and a small golden crown floating above, $STYLE"
  "it-phone.png|dark smartphone with a warm glowing cracked screen showing a tiny heart, story-telling feel, $STYLE"
  "it-gomoku.png|wooden go board tile with black and white stones forming a row of five, teal accent, $STYLE"
  "it-hide.png|office cubicle partition with a pair of cute eyes peeking over the top, playful hide and seek, $STYLE"
  "it-skin.png|paint palette with three swatch cards fanned out in ocean blue amber and violet, $STYLE"
  "it-skillmart.png|golden market stall stand with a price tag and a small glowing gem on the counter, $STYLE"
  "it-mail.png|blue envelope with a golden coin peeking out of the opened flap, consulting service feel, $STYLE"
  "it-hall.png|teal light bulb standing on a small wooden market crate, ideas for sale, $STYLE"
  "it-ops.png|dark purple analytics dashboard tile with golden funnel chart and rising bars, $STYLE"
  "it-salary.png|green spreadsheet tile with golden coin stacks of increasing height on it, $STYLE"
  "it-jobs.png|green briefcase with a small magnifying glass hovering over it, job hunting, $STYLE"
  "it-daily.png|blue newspaper roll with a small cartoon fish leaping out of it, $STYLE"
  "it-pitch.png|red presentation slide board on a small easel with a golden rocket doodle, $STYLE"
)

winpath_to_unix() { echo "$1" | sed 's|\\|/|g; s|^D:|/d|; s|^C:|/c|'; }

for round in $(seq 1 16); do
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
  [ "$pending" = 0 ] && { echo "ALL ITEM ICONS DONE"; exit 0; }
done
echo "GAVE UP"
exit 1
