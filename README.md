V89 — Chapter 4 Titan + Chapter 5 Axiom boss integration.

# Solvox V62

Solvox is a math-first RPG with chapter battles, bilingual UI, single-player progression, and multiplayer duels.

## What's changed in V42

- Home uses the cinematic MP4 background and is locked to the viewport so the page does not scroll.
- Multiplayer is no longer a direct Home navigation item. `Main` opens a mode selector with **Single Player** and **Multiplayer**.
- Single-player battle HUD follows the supplied reference composition: back button + player HP on the left, Chapter/Stage centered, enemy HP on the right; characters occupy the arena above the learning deck; the lower deck is **Question / Hint / Math Keypad**.
- Wrong-answer learning feedback is a compact warning ribbon below the HUD instead of another large panel inside the question card.
- Settings now owns the **Indonesia / English** language switch; the language control is removed from Home.
- Old backup sprites, the obsolete home GIF, pause raster, obsolete revision notes, and the old bottom home banner were removed.

## Project structure

```text
Solvox-V62/
├─ package.json
├─ server.js
├─ qa-check.js
├─ backend/
├─ data/
└─ frontend/
   ├─ package.json
   ├─ src/
   │  ├─ components/
   │  ├─ data/
   │  ├─ services/
   │  ├─ config/
   │  └─ styles/
   └─ public/assets/
      ├─ characters/
      ├─ home/
      └─ ui/reference/
```

## Windows quick start

Run these commands **from the folder that directly contains `package.json`**:

```powershell
npm install
npm start
```

For development:

```powershell
npm run dev
```

For structural QA:

```powershell
npm run qa
```

Open `http://localhost:3000` after the server starts.

Node.js 18 LTS or newer is required.
V54 notes: Home background slightly brightened and previously approved Home button styling restored. No experimental Solfox assets added.
V77 HOME REWORK
- Home uses the supplied Solvox logo and a reference-inspired text-only menu: Main, Dashboard, Settings, Feedback.
## V91 update
Chapter 4 and Chapter 5 now use the newly supplied video backgrounds. Mobile battle fighter sizing, attack travel, and question-panel typography were refined without changing the battle layout or gameplay flow.
