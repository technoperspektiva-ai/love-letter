# Love Letter 1.15.3 — Desktop Background Continuity

Виправлено desktop background:
- фон тепер малюється fixed canvas на весь viewport;
- `.mobile-app` більше не відповідає за розмір фону;
- `creatorView` та main content мають `height:auto` + `min-height:100dvh`;
- sidebar отримав окрему напівпрозору surface;
- main content займає всю область праворуч від sidebar;
- на коротких сторінках унизу більше не має з'являтися інший фон;
- recipient story не успадковує desktop creator background.

Також збережено 1.15.2 fix: світлий recipient topbar для нормального контрасту логотипа.
