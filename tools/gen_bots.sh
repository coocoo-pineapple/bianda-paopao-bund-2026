#!/bin/bash
# 机器人形象三连：菜园农夫 / Excel 抓数员 / 抱数据狂奔，纸雕风统一
GEN="C:\\Users\\admin\\Documents\\New project\\generate_image_openai.ps1"
MODEL="gpt-image-2-count"
OUT="D:\\bianda-paopao\\public\\assets"
STYLE="cute papercraft craft style robot character, rounded kraft paper body with warm cream and amber panels, friendly glowing amber eyes on a small dark screen face, layered paper texture, handmade paper sculpture aesthetic, soft studio light, isolated on transparent background, no text, high detail"

declare -a TASKS=(
  "bot-farmer.png|$STYLE, wearing a tiny straw farmer hat, holding a small watering can, standing beside a paper cabbage"
  "bot-scraper.png|$STYLE, holding a small green fishing net scooping up flying paper documents and spreadsheet sheets, busy working pose"
  "bot-carry.png|$STYLE, running happily while hugging a tall stack of paper documents, one sheet flying away"
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
  [ "$pending" = 0 ] && { echo "ALL BOTS DONE"; exit 0; }
done
exit 1
