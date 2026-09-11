# Love Letter 1.15.5 — Explicit Media + Story Gap Fix

## Портрет більше не може підчепитися сам
Причина була в тому, що старий `portraitData` зберігався в draft/state,
а кілька місць у коді трактували сам факт його існування як вибір портрета.

Тепер:
- media працює тільки при `mediaEnabled: true`;
- `mediaMode: none` повністю очищає portrait/photo/file state;
- новий лист і Ideas-сценарій стартують без зображення;
- старий draft мігрується: неявні portrait/photo очищаються;
- desktop preview, recipient story і share PNG використовують одне правило.

## Порожня прогалина desktop recipient
Прибрано штучні `min-height: 650/720px`.
Story surface тепер росте від реального контенту, а не від макета «телефона».
