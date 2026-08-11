#!/bin/bash
# 小应用精美化背景 ×4：断点续跑。用法: bash tools/gen_polish.sh
GEN="C:\\Users\\admin\\Documents\\New project\\generate_image_openai.ps1"
MODEL="gpt-image-2-count"
OUT="D:\\bianda-paopao\\public\\assets"

declare -a TASKS=(
  "wordgame-bg.png|1536x1024|epic chinese fantasy novel scene, ancient golden scroll unrolling across a dark mystical sky, golden light rays and floating glowing characters sparks, dark vignette edges, empty calm center area for UI text overlay, cinematic, rich amber and deep navy palette, no text, high detail"
  "gomoku-wood.png|1024x1024|top-down warm honey wood board texture, subtle fine wood grain, soft even lighting, gentle vignette, clean surface without lines or objects, suitable as game board background, no text"
  "hide-office.png|1536x1024|top-down view of a cozy paper-craft style office floor with cubicle partitions desks and plants, warm evening lighting, muted dark tones, handmade paper diorama aesthetic, empty walkways, soft shadows, no people, no text"
  "phone-wall.png|1024x1536|minimal dark phone wallpaper, deep navy water ripples with a small golden koi fish silhouette near the bottom, subtle moonlight glow from top, elegant, lots of empty dark space, no text"
)

winpath_to_unix() { echo "$1" | sed 's|\\|/|g; s|^D:|/d|; s|^C:|/c|'; }

for round in $(seq 1 12); do
  pending=0
  for task in "${TASKS[@]}"; do
    IFS='|' read -r name size prompt <<< "$task"
    f="$OUT\\$name"
    [ -f "$(winpath_to_unix "$f")" ] && continue
    pending=1
    echo "[round $round] $name ..."
    if powershell -File "$GEN" -Model "$MODEL" -Prompt "$prompt" -Size "$size" -Quality high -OutFile "$f" -Retries 2 2>&1 | grep -q "^Saved:"; then
      echo "[ok] $name"
    else
      echo "[fail] $name — sleep 120s"; sleep 120; break
    fi
  done
  [ "$pending" = 0 ] && { echo "ALL POLISH ASSETS DONE"; exit 0; }
done
echo "GAVE UP"
exit 1
