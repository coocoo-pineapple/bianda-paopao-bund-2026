#!/bin/bash
# 桌面图标 + 看板素材批量生成：接口失败自动等待重试，全部生成完退出
# 用法: bash tools/gen_icons.sh
GEN="C:\\Users\\admin\\Documents\\New project\\generate_image_openai.ps1"
MODEL="gpt-image-2-count"
ICODIR="D:\\bianda-paopao\\public\\assets\\icons"
ASSETDIR="D:\\bianda-paopao\\public\\assets"
STYLE="Windows 11 Fluent Design style 3D icon, soft gradients, subtle depth, front-facing, centered composition, isolated on transparent background, no text, no watermark, clean app icon, high detail"

# 每行: 输出路径|尺寸|背景|提示词
TASKS=(
  "$ICODIR\\fold-mart.png|1024x1024|transparent|manila amber folder, slightly open, with a small golden coin stack and price tag emblem floating in front, $STYLE"
  "$ICODIR\\fold-info.png|1024x1024|transparent|manila amber folder, slightly open, with a small blue bar chart document emblem floating in front, $STYLE"
  "$ICODIR\\bin.png|1024x1024|transparent|recycle bin wastebasket, translucent frosted glass basket with a crumpled white paper ball inside, $STYLE"
  "$ICODIR\\doc-word.png|1024x1024|transparent|blue document file icon, white page with folded corner and subtle blue text lines, deep blue cover accent, $STYLE"
  "$ICODIR\\doc-pdf.png|1024x1024|transparent|red document file icon, white page with folded corner and subtle red text lines, crimson cover accent, $STYLE"
  "$ICODIR\\film.png|1024x1024|transparent|video media file icon, dark rounded rectangle screen with warm glowing amber play button triangle and small filmstrip perforations on the sides, $STYLE"
  "$ASSETDIR\\bi-bg.png|1536x1024||very dark deep navy blue layered torn paper art background, concentric paper-cut layers like a deep well seen from inside, faint warm golden light glow at top center, extremely dark and subtle, low contrast, elegant, atmospheric, no text, suitable as dashboard background"
  "$ASSETDIR\\bi-fish.png|1024x1024|transparent|paper-cut craft style golden fish wearing a small orange necktie, side view swimming, layered kraft paper texture, warm gold tones, handmade papercraft aesthetic, isolated on transparent background, no text"
)

winpath_to_unix() { echo "$1" | sed 's|\\|/|g; s|^D:|/d|; s|^C:|/c|'; }

for round in $(seq 1 24); do
  pending=0
  for task in "${TASKS[@]}"; do
    IFS='|' read -r out size bg prompt <<< "$task"
    [ -f "$(winpath_to_unix "$out")" ] && continue
    pending=1
    name=$(basename "$out")
    echo "[round $round] generating $name ..."
    ARGS=(-File "$GEN" -Model "$MODEL" -Prompt "$prompt" -Size "$size" -Quality high -OutFile "$out" -Retries 2)
    [ -n "$bg" ] && ARGS+=(-Background "$bg")
    if powershell "${ARGS[@]}" 2>&1 | grep -q "^Saved:"; then
      echo "[ok] $name"
    else
      echo "[fail] $name — sleep 150s"
      sleep 150
      break
    fi
  done
  [ "$pending" = 0 ] && { echo "ALL ASSETS DONE"; exit 0; }
done
echo "GAVE UP after 24 rounds"
exit 1
