# Деплой iDev на сервер 91.229.10.4 и домен idev.team

Сайт кладётся в **отдельную папку** `/var/www/idev.team`, другие проекты на сервере не затрагиваются.

---

## 1. Привязка домена idev.team к серверу (DNS)

### Вариант A: DNS на nic.ru (если подключён DNS-хостинг)

1. В личном кабинете **nic.ru** открой **Мои домены** → выбери **idev.team**.
2. Зайди в раздел **DNS-хостинг** → **Управление DNS-зонами** (или **Ресурсные записи** для этого домена).  
   Если такого раздела нет — у домена может быть только «страница парковки»; тогда нужен либо платный **DNS-master** в nic.ru, либо Вариант B.
3. Нажми **Добавить запись** и создай:
   - **Тип:** A  
   - **Имя/хост:** `@` (корень домена idev.team)  
   - **Значение/IP:** `91.229.10.4`  
   - TTL: 3600 или по умолчанию  
4. Для **www.idev.team** добавь вторую запись:
   - **Тип:** A  
   - **Имя:** `www`  
   - **Значение:** `91.229.10.4`  
5. Сохрани и при необходимости нажми **Выгрузить зону** / **Применить**.

### Вариант B: Домен на nic.ru, DNS у Cloudflare (бесплатно)

1. Зарегистрируйся на [cloudflare.com](https://cloudflare.com), добавь сайт **idev.team**.
2. Cloudflare покажет свои DNS-серверы (например `ada.ns.cloudflare.com`, `bob.ns.cloudflare.com`).
3. В **nic.ru** → домен **idev.team** → **DNS-серверы** → **Изменить**: укажи эти два сервера вместо statuspage1/statuspage2.nic.ru, сохрани.
4. В панели Cloudflare для idev.team добавь A-записи:
   - `@` → `91.229.10.4`
   - `www` → `91.229.10.4`

Через 5–60 минут домен начнёт указывать на сервер. Проверка: `ping idev.team` — в ответе должен быть 91.229.10.4.

---

## 2. Подготовка сервера (один раз)

Подключись по SSH:

```bash
ssh root@91.229.10.4
```

Создай папку только для этого сайта (остальные каталоги не трогай):

```bash
mkdir -p /var/www/idev.team/crm
chown -R www-data:www-data /var/www/idev.team
```

Если у тебя Nginx — ниже отдельный конфиг только для idev.team. Если Apache — нужен отдельный VirtualHost с DocumentRoot `/var/www/idev.team`.

---

## 3. Nginx: отдельный сайт для idev.team

Чтобы не задевать уже работающие проекты, добавляется **новый** конфиг, без правок существующих.

Создай файл (например):

```bash
nano /etc/nginx/sites-available/idev.team
```

Вставь (порт 80; если нужен SSL — потом добавим certbot):

```nginx
server {
    listen 80;
    server_name idev.team www.idev.team;
    root /var/www/idev.team;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /crm/ {
        try_files $uri $uri/ /crm/index.html;
    }
}
```

Включи сайт и перезагрузи Nginx:

```bash
ln -sf /etc/nginx/sites-available/idev.team /etc/nginx/sites-enabled/
nginx -t && systemctl reload nginx
```

Если у тебя уже есть другой default/server на 80 — ничего не перезаписывай: этот блок слушает только `idev.team` и `www.idev.team`.

---

## 4. Загрузка файлов с твоего компьютера

Из папки проекта портфолио (где лежат `index.html`, папка `crm/` и т.п.) выполни:

```bash
chmod +x deploy.sh
./deploy.sh
```

Скрипт запросит пароль от `root@91.229.10.4` и зальёт только:

- `index.html`, `styles.css`, `script.js`
- `crm/index.html`, `crm/styles.css`, `crm/app.js`

в `/var/www/idev.team/`. Остальные директории на сервере скрипт не меняет.

Если хочешь без пароля — настрой вход по ключу:

```bash
ssh-copy-id root@91.229.10.4
```

---

## 5. HTTPS (опционально)

После того как по адресу http://idev.team открывается сайт:

```bash
apt install certbot python3-certbot-nginx -y
certbot --nginx -d idev.team -d www.idev.team
```

Certbot сам добавит HTTPS в конфиг Nginx для idev.team, не трогая другие сайты.

---

## Кратко

| Шаг | Действие |
|-----|----------|
| DNS | A-запись idev.team → 91.229.10.4 |
| Сервер | `mkdir -p /var/www/idev.team/crm` |
| Nginx | Новый конфиг только для idev.team, root `/var/www/idev.team` |
| Файлы | Запустить `./deploy.sh` из папки портфолио |

Пароль и другие секреты в репозиторий не клади. Для деплоя лучше использовать SSH-ключ.
