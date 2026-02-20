#!/usr/bin/env bash
set -euo pipefail

# =========================
# 설정값 (필요 시 수정)
# =========================
FRONT_DIR="frontend"
REMOTE_HOST="supporterhub.cafe24.com"
REMOTE_PATH="/home"
REMOTE_USER="${REMOTE_USER:-root}"   # 기본 root. 필요하면: export REMOTE_USER=계정명

PREFIX="supporter26"
TS="$(date +%y%m%d%H%M%S)"           # YYMMDDHHMMSS
REMOTE_JAR_NAME="${PREFIX}_${TS}.jar"

# =========================
# 1) Frontend build
# =========================
echo "==> [1/3] Frontend build: ${FRONT_DIR}"
pushd "${FRONT_DIR}" >/dev/null

if [[ -f package-lock.json ]]; then
  npm ci
else
  npm install
fi

npm run build
popd >/dev/null

# =========================
# 2) Backend (Gradle) build
# =========================
echo "==> [2/3] Gradle build (root)"
chmod +x ./gradlew
./gradlew build

# =========================
# 3) JAR 찾기 (가장 최신, plain 제외)
# =========================
echo "==> [3/3] Find latest JAR"
JAR_PATH="$(ls -t build/libs/*.jar 2>/dev/null | grep -v 'plain\.jar' | head -n 1 || true)"

if [[ -z "${JAR_PATH}" ]]; then
  echo "❌ build/libs/ 에 업로드할 JAR을 못 찾았어. (plain.jar 제외)"
  echo "   build/libs/ 아래 생성물을 확인해줘."
  exit 1
fi

echo "   Local JAR: ${JAR_PATH}"
echo "   Remote   : ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/${REMOTE_JAR_NAME}"

# =========================
# 4) 서버로 전송 (sshpass 사용)
#    - 방법 A: 환경변수 SUPPORTERHUB_SSH_PASS 사용
#    - 방법 B: 실행 중 비밀번호 입력
# =========================
if command -v sshpass >/dev/null 2>&1; then
    if [[ -z "${SUPPORTERHUB_SSH_PASS:-}" && -f "$HOME/.supporterhub_pass" ]]; then
      SUPPORTERHUB_SSH_PASS=$(cat "$HOME/.supporterhub_pass")
    fi

  sshpass -p "${SUPPORTERHUB_SSH_PASS}" scp -o StrictHostKeyChecking=accept-new \
    "${JAR_PATH}" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/${REMOTE_JAR_NAME}"

  echo "✅ Upload complete!"
else
  echo "⚠️ sshpass가 없어서 비밀번호 자동 입력이 안 돼."
  echo "   아래 중 하나로 진행해줘:"
  echo "   1) macOS: brew install sshpass"
  echo "   2) 또는 ssh 키 로그인 구성 후 scp 재시도"
  echo
  echo "수동 scp 명령:"
  echo "scp \"${JAR_PATH}\" \"${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}/${REMOTE_JAR_NAME}\""
  exit 2
fi