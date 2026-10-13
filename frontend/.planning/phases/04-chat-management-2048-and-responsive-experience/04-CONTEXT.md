# Phase 4: Chat Management, 2048, and Responsive Experience - Context

**Gathered:** 2026-10-13  
**Status:** Ready for planning  

## Phase Boundary

Phase 4 builds multi-conversation chat management (sidebar, switching, renaming, deleting, auto-titling), the lightweight deterministic 2048 waiting game (pure engine + accessible UI + touch/keyboard controls), and integrates the game strictly into active waiting while delivering responsive quality across desktop, tablet, and mobile.

## Requirements Covered

- **PERSIST-06**: A user can create, switch between, rename, and delete chats from a responsive history sidebar or panel.
- **PERSIST-07**: A new chat receives a sensible short title derived from its first user message without requiring a naming dialog.
- **PERSIST-08**: Chat history survives browser reload when the cookie snapshot is valid and the UI clearly handles empty or recovered history.
- **GAME-01**: The waiting interface contains a lightweight 4×4 2048 game only while an AI request is actively waiting.
- **GAME-02**: The game implements standard tile movement, merging, spawning, scoring, and best score tracking for the current game session.
- **GAME-03**: The game supports win and game-over states and provides a restart control.
- **GAME-04**: The game supports keyboard arrow controls on desktop and swipe/pointer controls on touch devices.
- **GAME-05**: Game logic is separated into deterministic, testable functions independent from React UI and chat state.
- **GAME-06**: Game controls do not submit chat messages, steal arrow keys from focused text inputs, scroll-jack the page, or cancel/restart the AI request.
- **GAME-07**: Game controls, status, score, restart, win, and game-over states are usable with keyboard and assistive technology.
- **QUAL-04**: Landing, authentication, chat, waiting, history, and game surfaces work responsively on desktop, tablet, and mobile.

## Architectural Decisions

1. **Sidebar and Chat Lifecycle**:
   - Conversations are loaded and saved through `src/lib/cookie/repository.ts`.
   - The active conversation ID is tracked in route state or query params (`/chat?c=<id>`) or local React state with fallback to the newest conversation.
   - Deleting the active chat switches cleanly to the next most recent conversation or an empty state.
   - Renaming modifies the conversation title in memory and persists it through the cookie repository.

2. **Deterministic 2048 Engine**:
   - Lives in `src/lib/game/2048/` as pure TypeScript functions (`createGame`, `move`, `canMove`, `spawnTile`).
   - Completely decoupled from React and chat controllers.
   - Tracks current score and session best score.

3. **Event & Focus Isolation**:
   - Game keyboard listeners attach only when the game board has focus or is the active target, and explicitly prevent default only on handled game keys within the board container.
   - Arrow keys while typing in `ChatComposer`'s textarea never move game tiles.
   - Touch gestures on the game board use `touch-action: none` on the board container to avoid page scrolling during play.

4. **Waiting Room Isolation**:
   - The 2048 game is presented strictly within the active waiting phase (`WaitingShell`), alongside the elapsed timer and band copy.
   - Ending waiting (success, stop, or failure) unmounts or closes the game without discarding the active answer or error recovery block.
