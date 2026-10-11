// Unit test untuk worker/src/singlePlayerStore.js tanpa Cloudflare D1.
//
// Fake-D1 tipis di atas `node:sqlite` (DatabaseSync) yang meniru permukaan
// D1 yang dipakai store: prepare().bind().first()/all()/run(), db.exec(), db.batch().
//
// Jalankan dengan loader JSON agar game.js (impor solvoxQuestions.json tanpa
// import attribute) bisa dimuat di Node:
//
//   node --import /tmp/opencode/ltr/register.mjs worker/test/single-player-store.mjs
//
// (Lihat catatan di akhir file untuk perintah yang bisa dipakai ulang.)

import { readFileSync } from 'node:fs';
import { DatabaseSync } from 'node:sqlite';

import { createSinglePlayerStore, MAX_CHAPTER } from '../src/singlePlayerStore.js';

// ---------------------------------------------------------------------------
// harness
// ---------------------------------------------------------------------------

let failures = 0;
function check(cond, msg) {
  if (cond) {
    console.log(`  ok  - ${msg}`);
  } else {
    failures += 1;
    console.error(`  FAIL - ${msg}`);
  }
}

function eq(actual, expected, msg) {
  const a = JSON.stringify(actual);
  const b = JSON.stringify(expected);
  check(a === b, `${msg} (got ${a}, want ${b})`);
}

// ---------------------------------------------------------------------------
// fake D1 (node:sqlite)
// ---------------------------------------------------------------------------

class BoundStatement {
  constructor(fake, sql, params) {
    this.fake = fake;
    this.sql = sql;
    this.params = params;
  }

  async first() {
    const stmt = this.fake.raw.prepare(this.sql);
    const row = stmt.get(...this.params);
    return row === undefined ? null : row;
  }

  async all() {
    const stmt = this.fake.raw.prepare(this.sql);
    return { results: stmt.all(...this.params) };
  }

  async run() {
    const stmt = this.fake.raw.prepare(this.sql);
    const info = stmt.run(...this.params);
    return { meta: { changes: Number(info.changes), last_row_id: Number(info.lastInsertRowid) } };
  }
}

class PreparedStatement {
  constructor(fake, sql) {
    this.fake = fake;
    this.sql = sql;
  }

  bind(...params) {
    return new BoundStatement(this.fake, this.sql, params);
  }
}

class FakeD1 {
  constructor() {
    this.raw = new DatabaseSync(':memory:');
    this.raw.exec('PRAGMA foreign_keys = ON;');
  }

  prepare(sql) {
    return new PreparedStatement(this, sql);
  }

  exec(sql) {
    this.raw.exec(sql);
  }

  async batch(statements) {
    const out = [];
    for (const statement of statements) out.push(await statement.run());
    return out;
  }
}

function freshStore() {
  const db = new FakeD1();
  const migration = readFileSync(
    new URL('../migrations/0001_single_player.sql', import.meta.url),
    'utf8',
  );
  db.exec(migration);
  return createSinglePlayerStore({ DB: db });
}

// ---------------------------------------------------------------------------
// skenario
// ---------------------------------------------------------------------------

async function main() {
  console.log('singlePlayerStore');

  // -- session & resolveGuest ------------------------------------------------
  const store = freshStore();
  const { token, guest } = await store.createSession({ displayName: 'Rani' });
  check(typeof token === 'string' && token.length >= 20, 'createSession mengembalikan token');
  check(guest && guest.displayName === 'Rani', 'createSession mengembalikan guest');
  check(guest.characterId === 'traveler', 'guest default character = traveler');

  const resolved = await store.resolveGuest(token);
  check(resolved && resolved.id === guest.id, 'resolveGuest menemukan sesi valid');
  eq(await store.resolveGuest('not-a-real-token-xxxxx'), null, 'token asing ditolak');
  eq(await store.resolveGuest('short'), null, 'token pendek ditolak');
  eq(await store.resolveGuest(''), null, 'token kosong ditolak');

  // -- updateProfile ---------------------------------------------------------
  const profiled = await store.updateProfile(guest.id, { displayName: 'Rani II', characterId: 'asuka', exp: 40 });
  check(profiled.displayName === 'Rani II', 'updateProfile mengganti displayName');
  check(profiled.characterId === 'asuka', 'updateProfile mengganti characterId');
  check(profiled.exp === 40, 'updateProfile menyimpan exp');

  // -- createSave & urutan/gap completedLevels -------------------------------
  const a = await store.createSave(guest.id, {
    name: 'Slot A',
    completedLevels: [3, 1, 1, 7, 0, -1, 3],
    currentChapterId: 3,
    exp: 200,
  });
  check(!!a.save, 'createSave sukses');
  eq(a.save.completedLevels, [1, 3], 'completedLevels dedupe+sort+clamp (gap dipertahankan)');
  check(a.save.currentChapterId === 3, 'createSave menyimpan currentChapterId');
  check(a.save.revision === 1, 'save baru revision = 1');

  const b = await store.createSave(guest.id, { name: 'Slot B' });
  eq(b.save.completedLevels, [], 'save kedua default completedLevels kosong');
  check(b.save.currentChapterId === 1, 'save kedua default chapter = 1');

  // -- limit 5 save ----------------------------------------------------------
  await store.createSave(guest.id, { name: 'Slot C' });
  await store.createSave(guest.id, { name: 'Slot D' });
  await store.createSave(guest.id, { name: 'Slot E' });
  const sixth = await store.createSave(guest.id, { name: 'Slot F' });
  check(sixth.limit === true, 'save ke-6 ditolak karena batas 5');
  check(Array.isArray(sixth.saves) && sixth.saves.length === 5, 'penolakan menyertakan daftar 5 save');

  const list = await store.listSaves(guest.id);
  check(list.length === 5, 'listSaves mengembalikan 5 slot');

  // -- updateSave & revision -------------------------------------------------
  const updated = await store.updateSave(guest.id, a.save.id, {
    name: 'Slot A2',
    completedLevels: [2, 4, 5],
    currentChapterId: 5,
  });
  check(updated.name === 'Slot A2', 'updateSave mengganti nama');
  eq(updated.completedLevels, [2, 4, 5], 'updateSave mengganti completedLevels');
  check(updated.revision === 2, 'updateSave menaikkan revision ke 2');

  // -- checkpoint: create, conflict, advance ---------------------------------
  const cp1 = await store.putCheckpoint(guest.id, a.save.id, 2, { baseRevision: 0, payload: { idx: 1, hp: 80 } });
  check(!!cp1.checkpoint && cp1.checkpoint.revision === 1, 'putCheckpoint awal revision 1');
  eq(cp1.checkpoint.payload, { idx: 1, hp: 80 }, 'payload checkpoint tersimpan');

  const cpConflict = await store.putCheckpoint(guest.id, a.save.id, 2, { baseRevision: 0, payload: { idx: 9 } });
  check(cpConflict.conflict === true, 'putCheckpoint dengan baseRevision basi → conflict');
  check(cpConflict.current.revision === 1, 'conflict menyertakan checkpoint terkini');

  const cp2 = await store.putCheckpoint(guest.id, a.save.id, 2, { baseRevision: 1, payload: { idx: 2, hp: 60 } });
  check(cp2.checkpoint.revision === 2, 'putCheckpoint dengan baseRevision cocok → revision 2');

  const gotCp = await store.getCheckpoint(guest.id, a.save.id, 2);
  check(gotCp.found === true && gotCp.checkpoint.revision === 2, 'getCheckpoint mengembalikan revisi terbaru');

  const missingCp = await store.getCheckpoint(guest.id, a.save.id, 4);
  check(missingCp.found === false, 'getCheckpoint chapter tanpa checkpoint → found false');

  // -- finishRun: win ---------------------------------------------------------
  // Baseline eksplisit: updateSave di atas menyetel currentChapterId ke 5,
  // sedangkan uji di bawah mengharapkan kemajuan dari chapter 2.
  const baseline = await store.updateSave(guest.id, a.save.id, { currentChapterId: 2 });
  const beforeExp = baseline.exp || 0;
  const win = await store.finishRun(guest.id, a.save.id, 2, {
    outcome: 'win',
    clientRunId: 'run-win-1',
    correct: 8,
    answered: 10,
    hintsUsed: 1,
    durationSec: 120,
  });
  check(!!win.run && win.run.outcome === 'win', 'finishRun win mencatat run');
  check(win.run.expAwarded === 100, 'finishRun win memberi 100 exp');
  check(win.save.completedLevels.includes(2), 'finishRun win menambah chapter ke completedLevels');
  check(win.save.currentChapterId === 3, 'finishRun win memajukan currentChapterId ke 3');
  check(win.save.exp === beforeExp + 100, 'finishRun win menambah exp save');
  const cpAfterWin = await store.getCheckpoint(guest.id, a.save.id, 2);
  check(cpAfterWin.found === false, 'finishRun win menghapus checkpoint chapter');

  // idempotensi
  const winAgain = await store.finishRun(guest.id, a.save.id, 2, {
    outcome: 'win',
    clientRunId: 'run-win-1',
    correct: 8,
    answered: 10,
    hintsUsed: 1,
    durationSec: 120,
  });
  check(winAgain.already === true, 'finishRun dengan clientRunId sama → already true');
  check(winAgain.save.exp === win.save.exp, 'finishRun idempoten tidak menambah exp lagi');

  // -- finishRun: lose --------------------------------------------------------
  const lose = await store.finishRun(guest.id, a.save.id, 3, {
    outcome: 'lose',
    clientRunId: 'run-lose-1',
    correct: 3,
    answered: 5,
    hintsUsed: 0,
    durationSec: 30,
  });
  check(lose.run.outcome === 'lose', 'finishRun lose mencatat outcome lose');
  check(lose.run.expAwarded === 10, 'finishRun lose memberi 10 exp');
  check(!lose.save.completedLevels.includes(3), 'finishRun lose tidak menandai chapter selesai');
  check(lose.save.currentChapterId === 3, 'finishRun lose tidak memajukan chapter');

  // -- legacyImport idempoten & limit ----------------------------------------
  const legacyStore = freshStore();
  const legacyGuest = (await legacyStore.createSession({})).guest;
  const imported = await legacyStore.legacyImport(legacyGuest.id, {
    name: 'Petualangan Lama',
    legacyImportKey: 'local-v1-abc',
    completedLevels: [1, 2],
    currentChapterId: 3,
    exp: 500,
  });
  check(!!imported.save, 'legacyImport membuat slot');
  eq(imported.save.completedLevels, [1, 2], 'legacyImport menyimpan completedLevels');

  const importedAgain = await legacyStore.legacyImport(legacyGuest.id, {
    name: 'Lain',
    legacyImportKey: 'local-v1-abc',
    completedLevels: [5],
  });
  check(importedAgain.already === true, 'legacyImport dengan key sama → already true');
  check(importedAgain.save.id === imported.save.id, 'legacyImport idempoten mengembalikan slot yang sama');
  eq(importedAgain.save.completedLevels, [1, 2], 'legacyImport tidak menimpa data lama');

  const legacyLimitStore = freshStore();
  const lGuest = (await legacyLimitStore.createSession({})).guest;
  for (let i = 0; i < 5; i += 1) {
    await legacyLimitStore.createSave(lGuest.id, { name: `S${i}` });
  }
  const legacyOver = await legacyLimitStore.legacyImport(lGuest.id, { legacyImportKey: 'k-over' });
  check(legacyOver.limit === true, 'legacyImport ditolak saat slot penuh');

  // -- isolasi kepemilikan lintas tamu ---------------------------------------
  const otherStore = freshStore();
  const otherGuest = (await otherStore.createSession({})).guest;
  const foreignGet = await otherStore.getSave(guest.id, a.save.id); // guest beda, id slot guest A
  eq(foreignGet, null, 'getSave menolak slot milik tamu lain');
  const foreignUpdate = await otherStore.updateSave(otherGuest.id, a.save.id, { name: 'hack' });
  eq(foreignUpdate, null, 'updateSave menolak slot milik tamu lain');

  // -- deleteCheckpoint & deleteSave -----------------------------------------
  await store.putCheckpoint(guest.id, b.save.id, 1, { baseRevision: 0, payload: { idx: 0 } });
  const droppedCp = await store.deleteCheckpoint(guest.id, b.save.id, 1);
  check(droppedCp === true, 'deleteCheckpoint menghapus checkpoint');
  check((await store.getCheckpoint(guest.id, b.save.id, 1)).found === false, 'checkpoint benar-benar hilang');

  const deleted = await store.deleteSave(guest.id, b.save.id);
  check(deleted === true, 'deleteSave menghapus slot');
  eq(await store.getSave(guest.id, b.save.id), null, 'slot terhapus tidak ditemukan lagi');
  check((await store.deleteSave(guest.id, b.save.id)) === false, 'deleteSave slot tak ada → false');

  // -- MAX_CHAPTER sanity -----------------------------------------------------
  check(MAX_CHAPTER === 5, `MAX_CHAPTER = 5 (got ${MAX_CHAPTER})`);

  console.log(failures === 0 ? '\nSELURUH TES LULUS' : `\n${failures} TES GAGAL`);
  process.exit(failures === 0 ? 0 : 1);
}

main().catch((err) => {
  console.error('Tes error tak terduga:', err);
  process.exit(1);
});
