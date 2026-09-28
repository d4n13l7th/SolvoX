# Solvox V62 — Windows Setup

This ZIP is intentionally flattened so the project root contains `package.json` directly. Do not run `npm install` from a parent folder.

1. Extract the ZIP.
2. Open PowerShell in the extracted folder.
3. Confirm these files are visible:
   - `package.json`
   - `server.js`
   - `frontend\package.json`
4. Run:

```powershell
npm install
```

5. Start the game:

```powershell
npm start
```

6. Open:

```text
http://localhost:3000
```

7. Optional structural QA:

```powershell
npm run qa
```

If PowerShell reports `ENOENT` for `package.json`, the command is being run from the wrong directory. Move into the folder that contains `package.json` first.

Requirements: Node.js 18 LTS or newer.
