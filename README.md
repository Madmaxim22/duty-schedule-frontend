# График дежурств — Frontend

[![GitHub Pages](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://madmaxim22.github.io/duty-schedule-frontend/)

Мобильное веб-приложение (mobile-first) для просмотра и управления графиком дежурств по кабинетам.

**Расположение:** `C:\Users\Максим\Documents\Frontend\Duty\duty-schedule-frontend`  
**Backend API:** [duty-schedule-backend](../duty-schedule-backend)

## Содержание

- [Возможности](#возможности)
- [Стек](#стек)
- [Требования](#требования)
- [Быстрый старт](#быстрый-старт)
- [Вход в систему](#вход-в-систему)
- [Роли и экраны](#роли-и-экраны)
- [Доступ с телефона](#доступ-с-телефона)
- [Переменные окружения](#переменные-окружения)
- [Сборка и Docker](#сборка-и-docker)
- [GitHub Pages](#github-pages)
- [Структура проекта](#структура-проекта)
- [Лицензия](#лицензия)

## Возможности

- Регистрация и вход (email + пароль).
- Календарь текущего месяца с переключением месяцев.
- Подсветка дней, когда **вы** дежурите.
- По клику на дату — модальное окно: кто дежурит в каждом кабинете (2 секции × 4 кабинета).
- **Admin:** модерация регистраций, назначение дежурств на день.

## Стек

| Технология | Назначение |
|------------|------------|
| React 19 | UI |
| Vite 6 | сборка и dev-сервер |
| TypeScript | типизация |
| React Router 7 | маршрутизация |
| TanStack Query | запросы к API |
| react-hook-form + zod | формы |
| react-day-picker 9 | календарь |
| CSS (mobile-first) | стили, max-width 480px |

## Требования

- Node.js 20+
- npm
- Запущенный [backend](../duty-schedule-backend) на порту **3000**

## Быстрый старт

### 1. Запустите backend

Следуйте [README backend](../duty-schedule-backend/README.md):

```bash
cd ../duty-schedule-backend
npm install
copy .env.example .env
npx prisma migrate deploy
npm run db:seed
npm run dev
```

### 2. Запустите frontend

```bash
cd duty-schedule-frontend
npm install
npm run dev
```

Откройте в браузере: **http://localhost:5173**

### Прокси API

В режиме разработки запросы на `/api/*` проксируются на `http://localhost:3000` (см. `vite.config.ts`).  
Отдельный `.env` для frontend **не обязателен**.

## Вход в систему

### Администратор (после seed backend)

| | |
|---|---|
| URL | http://localhost:5173/login |
| Email | `admin@duty.local` |
| Пароль | `admin123` (или из `ADMIN_PASSWORD` в backend `.env`) |

### Обычный пользователь

1. **Регистрация** — `/register` (ФИО, email, пароль).
2. Сообщение: ожидайте подтверждения администратора.
3. Админ открывает **Модерация** → одобряет заявку.
4. **Вход** — `/login`.

Пока статус `pending` или `rejected`, вход вернёт ошибку 403.

## Роли и экраны

| Маршрут | Кто | Описание |
|---------|-----|----------|
| `/login` | все | Вход |
| `/register` | все | Регистрация |
| `/` | авторизован | Календарь + модалка дня |
| `/admin/users` | admin | Заявки, список учётных записей, удаление; **Web Push** о новых заявках |
| `/admin/import` | admin | Импорт графика из JSON |
| `/admin/changes` | admin | Журнал последних изменений дежурств |
| `/admin/schedule/:date` | admin | Назначение дежурных на дату (`YYYY-MM-DD`) |

### Календарь

- **Зелёный** — ваши дежурства (`isMyDuty`).
- **Серый** — отсутствие (`isAbsent`).
- **Голубой** — в этот день есть назначения.
- Клик по дате — модалка с кабинетами 51–54 и 31–34.
- У admin в модалке — кнопка **Редактировать**.

### Структура кабинетов (как в backend)

**Секция 1:** 51, 52 (обяз.), 53, 54 (необяз.)  
**Секция 2:** 31, 32, 33 (обяз.), 34 (необяз.)

## Web Push (админ)

В меню: **Оповещения** — лента событий; **Настройки** — тема оформления и push-уведомления. Нужны VAPID-ключи в backend `.env` и HTTPS (production). Service worker: `public/sw.js`, manifest: `public/manifest.webmanifest`.

Подробнее: [корневой README — Web Push](../README.md#web-push-для-администратора).

## Доступ с телефона

1. ПК и телефон в **одной Wi‑Fi**.
2. `ipconfig` → IPv4, например `192.168.1.105`.
3. В backend `.env`: `CORS_ORIGIN=http://192.168.1.105:5173` → перезапуск backend.
4. Frontend:

   ```bash
   npm run dev -- --host
   ```

5. На телефоне: `http://192.168.1.105:5173`.

> `localhost` на телефоне не откроет приложение с ПК — нужен IP компьютера.

## Переменные окружения

Файл `.env` (опционально):

```env
# Если API не проксируется через Vite (например, отдельный домен):
# VITE_API_URL=https://example.com/api
```

По умолчанию используется относительный путь `/api` (прокси в dev, nginx в production).

## Сборка и Docker

### Локальная production-сборка

```bash
npm run build
npm run preview
```

Артефакты в папке `dist/`.

### Docker

Собирается из [docker-compose backend](../duty-schedule-backend/docker-compose.yml) как сервис `web`:

```bash
cd ../duty-schedule-backend
docker compose up -d --build
```

## GitHub Pages

Для деплоя статики на GitHub Pages:

1. В `vite.config.ts` при необходимости задайте `base: '/duty-schedule-frontend/'`.
2. Соберите: `npm run build`.
3. Опубликуйте содержимое `dist/` (Actions или ветка `gh-pages`).

Демо (после настройки репозитория):  
**https://madmaxim22.github.io/duty-schedule-frontend/**

> Для работы с GitHub Pages укажите `VITE_API_URL` на публичный URL вашего API.

## Структура проекта

```
duty-schedule-frontend/
├── src/
│   ├── app/              # router, providers, PrivateRoute, AdminRoute
│   ├── features/
│   │   ├── auth/         # AuthContext
│   │   ├── calendar/     # DutyCalendar
│   │   └── day-detail/   # модалка дня
│   ├── pages/            # Login, Register, Home, Admin, EditDay
│   └── shared/
│       ├── api/          # client, types
│       ├── constants/    # offices.ts
│       └── ui/           # Button, Input, Modal
├── docker/
│   ├── Dockerfile
│   └── nginx.conf
├── vite.config.ts
├── index.html
└── LICENSE
```

## Скрипты npm

| Команда | Описание |
|---------|----------|
| `npm run dev` | Dev-сервер :5173 |
| `npm run dev -- --host` | Dev с доступом по LAN |
| `npm run build` | TypeScript + Vite build |
| `npm run preview` | Просмотр `dist/` |

## Лицензия

Распространяется под лицензией [MIT](LICENSE).
