# ТЗ: Мастерская = ядро платформы (node-based)

## 1. Продуктовая модель

### 1.1 Хаб `/`

- **Мастерская — основа**, не вторичная вкладка.
- На главной:
  - список **сценариев** (созданных в мастерской + встроенных);
  - кнопка **«Новый сценарий»** → сразу canvas мастерской;
  - у каждой карточки: **Играть** | **Редактировать**.
- Встроенный Cherwood можно удалить позже и пересобрать графом.

### 1.2 Мастерская `/studio/:projectId`

Node-based редактор (референс: UE Blueprints / dialogue graphs / shader graphs):

| Тип ноды | Содержимое |
|----------|------------|
| **Location** | id, name, background URL/color, exits (рёбра), inspectables, NPCs |
| **NPC** (или вложено в Location) | name, intro, dialogue options → effects |
| **Inspect / Clue** | label, result text, clue payload, once, flags |
| **Event** | private \| shared; text; set flags; grant clue; unlock location |
| **Branch** | condition on flags / variables / turn number |
| **Timeline** | `atRound: N` → fire event(s) globally or per-location |
| **Start** | start location + roster rules |

Связи (edges):
- Location → Location = **move exit**
- Location → Event = «доступно здесь»
- Timeline → Event = «срабатывает на раунде N»
- Branch Yes/No → дальнейшие ноды

Порты цветные по типу (move / trigger / data), как на референсах.

### 1.3 Runtime (договорённости)

1. **1 действие / игрок / раунд** (wait / move / inspect / talk / share).
2. **Приватность по умолчанию**: действия и их результаты видит только игрок (и хост-engine).
3. **Share** — действие; на хаб; улика в корзину только **same location**.
4. **Shared events** — нода Event с `scope: "all" | "same_location" | "actor"`.
5. **Шкала ходов (Timeline)**:
   - список правил `{ atRound: 10, eventNodeId }`;
   - после закрытия раунда N engine запускает все Timeline с `atRound === N`;
   - пример: раунд 10 — всем private note «за вами следят»; раунд 15 — shared unlock локации «двор» + улика.
6. Состояние стола — память хоста; телефоны — PeerJS.

### 1.4 Персистентность сценариев

- Пока: **localStorage** + Export/Import JSON (без серверной БД).
- Позже: commit в git / cloud.
- Формат файла: `ScenarioDocument` (см. `src/lib/scenario/types.ts`).

## 2. Этапы реализации

| Этап | Содержание |
|------|------------|
| **S0** | Модель ScenarioDocument, localStorage catalog, хаб = список + создать |
| **S1** | Canvas: Location-ноды, drag, edges move, inspector, save |
| **S2** | Inspect/NPC/Event внутри location; flags; export graph → runtime |
| **S3** | Timeline-ноды + engine fire on round |
| **S4** | Branch conditions; playtest from studio |
| **S5** | Удалить hardcoded Cherwood, пересобрать в мастерской |

## 3. Не в scope сейчас

- Полноценный AI-генератор нод
- Collaborative editing
- Server DB для сценариев
