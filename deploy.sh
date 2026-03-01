#!/bin/bash
# Деплой портфолио iDev на сервер. Не трогает другие проекты — заливает только в указанную папку.

set -e
SERVER="91.229.10.4"
USER="root"
REMOTE_DIR="/var/www/idev.team"

echo "→ Деплой в ${USER}@${SERVER}:${REMOTE_DIR}"
echo "  (убедись, что папка создана на сервере: ssh ${USER}@${SERVER} \"mkdir -p ${REMOTE_DIR}/crm\")"
echo ""

# Заливаем только файлы портфолио, EN-версии и CRM
rsync -avz --delete \
  --include='index.html' \
  --include='styles.css' \
  --include='script.js' \
  --include='lang-redirect.js' \
  --include='en/' \
  --include='en/index.html' \
  --include='crm/' \
  --include='crm/index.html' \
  --include='crm/styles.css' \
  --include='crm/app.js' \
  --include='crm/en/' \
  --include='crm/en/index.html' \
  --include='crm/en/app-en.js' \
  --exclude='*' \
  ./ "${USER}@${SERVER}:${REMOTE_DIR}/"

echo ""
echo "Готово. Сайт: https://idev.team (после настройки DNS и Nginx)"
