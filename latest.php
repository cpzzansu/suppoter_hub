<div id="kboard-thumbnail-latest">
  <div class="kboard-latest-grid">
    <?php while($content = $list->hasNext()): ?>
      <a class="kboard-latest-item" href="<?php echo $url->getDocumentURLWithUID($content->uid)?>">
        <div class="kboard-thumbnail-cut-strings">
          <?php if($content->secret):?><img src="<?php echo $skin_path?>/images/icon-lock.png" alt="<?php echo __('Secret', 'kboard')?>"><?php endif?>
          <?php echo $content->title?>
          <span class="kboard-comments-count"><?php echo $content->getCommentsCount()?></span>
        </div>
        <div class="kboard-latest-date"><?php echo $content->getDate()?></div>
      </a>
    <?php endwhile ?>
  </div>
</div>
import random
import time
import pyautogui

# 안전장치: 마우스를 화면 좌상단으로 던지면 즉시 중단
pyautogui.FAILSAFE = True

# ===== 설정 =====
# 클릭할 사각형 범위 (왼쪽 위 x1,y1 / 오른쪽 아래 x2,y2)
x1, y1 = 3492, 1385
x2, y2 = 3554, 1435

# 클릭 간격(초) 랜덤 범위
min_delay = 1.2
max_delay = 2.4

# 총 클릭 횟수 (None이면 무한 루프)
# total_clicks = 200
total_clicks = None

# 시작 전 대기(초) - 실행 후 마우스 옮길 시간
start_delay = 1

f_interval_min = 2.0
f_interval_max = 3.0

print(f"Starting in {start_delay}s... (Move mouse to top-left corner to abort)")
time.sleep(start_delay)

# 다음 f 키 누를 시간 예약
next_f_time = time.time() + random.uniform(f_interval_min, f_interval_max)

count = 0
while True:
    # 랜덤 좌표 클릭
    x = random.randint(x1, x2)
    y = random.randint(y1, y2)
    pyautogui.click(x=x, y=y)

    # ✅ 2~3초마다 f 키 누르기
    now = time.time()
    if now >= next_f_time:
        pyautogui.press('f')
        next_f_time = now + random.uniform(f_interval_min, f_interval_max)

    # 클릭 간 랜덤 딜레이
    time.sleep(random.uniform(min_delay, max_delay))

    count += 1
    if total_clicks is not None and count >= total_clicks:
        break

print("Done.")
