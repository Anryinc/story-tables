# story-tables

Чистая платформа столов (без legacy Grok/Nitro/PGLite).

- **Хаб проектов** `/`
- **Карточка сценария** `/project/:id`
- **Хаб стола (ПК)** `/table/:code`
- **Телефон** `/play/:code`
- **Мастерская (граф JSON)** `/studio/:id`

Игровой стейт — в памяти вкладки хоста. Связь телефонов — **PeerJS** (публичный брокер, серверная БД не нужна).

## Локально

```bash
npm install
npm run dev
```

## Vercel

Import repo **Anryinc/story-tables**, framework Vite, build `npm run build`, output `dist`.
Проверка: `https://<app>.vercel.app/BUILD.txt` → `stamp: clean-v0.1.0`.
