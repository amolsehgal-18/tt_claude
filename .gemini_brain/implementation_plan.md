# Fix End-of-Season Crash & Session Hardening

## Problem
The user reports a crash at GW 34. While the exact cause is elusive, there are several "soft" points in the code that could trigger an unhandled exception as the season progresses or when sessions change:
1. **Index Out of Bounds**: `_getSlice` and `_updateMood` use `indexWhere` without guarding against a `-1` result.
2. **Empty Deck**: `_nextCard` assumes `_masterDeck` is never empty.
3. **Session Conflict**: `GameScreen` loads saved data even if the new `widget.session` doesn't match the old one (e.g., different name or mode), leading to "User not found" errors in the league table.

## Proposed Changes

### [Guard] Game Logic Hardening
#### [MODIFIED] [game_screen.dart](file:///Users/amolsehgal/antigravity%20-%20touchline%20tantrum/touchline_tantrum/lib/screens/game_screen.dart)
- **Safe Indexing**: Add checks in `_getSlice`, `_updateMood`, and `_checkWinCondition` to handle cases where the user team is not found in the league table.
- **Deck Protection**: Add a fallback in `_nextCard` if the deck is empty.
- **Session Sync**: Update `_initializeGame` to check if the `saved_session` matches the current `widget.session`. If not, start a fresh game to avoid data corruption.
- **Match Limit Guard**: Add an explicit check in `_nextCard` to ensure we don't proceed if the match limit has already been reached.

### [UI] Layout Safety
#### [MODIFIED] [game_screen.dart](file:///Users/amolsehgal/antigravity%20-%20touchline%20tantrum/touchline_tantrum/lib/screens/game_screen.dart)
- **Null Guards**: Ensure all UI elements using `nextOpponent` or `activeScenario` have robust null fallbacks (already partially implemented, but will perform a final audit).

### [Migration] Unified Workspace Repository
#### [NEW] [.gitignore](file:///Users/amolsehgal/antigravity%20-%20touchline%20tantrum/.gitignore)
Create a root-level ignore file to handle both the agent data and the Flutter subproject:
- Include common Flutter ignores (`build/`, `.dart_tool/`, etc.).
- Allow the `.gemini/` folder so the agent's brain data (tasks/walkthroughs) is migrated.
- Ignore the local `.git` inside `touchline_tantrum` to avoid "git-in-git" issues.

#### [LOGIC] Git Initialization
1.  **Initialize Git** at the parent level (`/Users/amolsehgal/antigravity - touchline tantrum`).
2.  **Consolidate**: Remove the existing `.git` from the `touchline_tantrum` subfolder to merge it into the main workspace repo.
3.  **Add all files**: Stage the entire workspace.
4.  **Push**: Push to a **brand new** GitHub repository.

## Verification Plan
### Automated Tests
- Run `git status` at the root level to ensure all expected files (app + .gemini) are staged.
- Check the final GitHub repository URL to verify the folder structure.
### Automated Tests
- Run `flutter analyze` to ensure no regression and type safety.
### Manual Verification
- Start a "Don't Bottle It" (8 GM) saga.
- Play until GW 38 and verify the end overlay appears without crashing.
- Quit to main menu, change name, and start a new saga to verify the session reset logic.
