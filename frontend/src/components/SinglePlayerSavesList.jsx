import React, { useEffect, useState } from 'react';
import { singlePlayerSaves } from '../services/singlePlayerSaves';
import { SolvoxUtilityArt } from './SolvoxUtilityArt';
import PixelIcon from './PixelIcon';

const MAX_SAVES = 5;

function slotName(name, index) {
  if (name && name.trim()) return name.trim().slice(0, 40);
  return `Petualangan ${index + 1}`;
}

export default function SinglePlayerSavesList({ lang, t, onBack, onSelectSave, onCreateSave, onLegacyImported }) {
  const [loading, setLoading] = useState(false);
  const [saves, setSaves] = useState([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);
  const [importing, setImporting] = useState(false);

  const ensureGuest = async () => {
    const g = await singlePlayerSaves.getGuestSession();
    if (g.ok) return g;
    return singlePlayerSaves.createGuestSession('Player');
  };

  const load = async () => {
    setLoading(true);
    setError('');
    try {
      const g = await ensureGuest();
      if (!g.ok) throw new Error('Gagal memuat sesi');
      const r = await singlePlayerSaves.listSaves();
      if (!r.ok) throw new Error(r.data?.message || 'Gagal memuat petualangan');
      setSaves(r.data.saves || []);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleCreate = async () => {
    setCreating(true);
    setError('');
    try {
      const g = await ensureGuest();
      if (!g.ok) throw new Error('Gagal memuat sesi');
      const name = `Petualangan ${saves.length + 1}`;
      const r = await singlePlayerSaves.createSave({ name, characterId: 'traveler', currentChapterId: 1, completedLevels: [] });
      if (r.ok && r.data?.save) {
        const ns = r.data.save;
        setSaves((s) => [...s, ns]);
        if (onCreateSave) onCreateSave(ns);
        else if (onSelectSave) onSelectSave(ns);
        return;
      }
      if (r.status === 409 && Array.isArray(r.data?.saves)) {
        setSaves(r.data.saves);
        setError('Batas 5 petualangan tercapai');
        return;
      }
      throw new Error(r.data?.message || 'Gagal membuat petualangan');
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setCreating(false);
    }
  };

  const handleLegacyImport = async () => {
    setImporting(true);
    setError('');
    try {
      const g = await ensureGuest();
      if (!g.ok) throw new Error('Gagal memuat sesi');
      let progress = null;
      try {
        for (const k of ['solvox.progress.v1','numericore.v35.progress','aljabarmaster.v34.progress','aljabarmaster.v33.progress','aljabarmaster.v32.progress','aljabarmaster.v31.progress','aljabarmaster.v30.progress','aljabarmaster.v29.progress','aljabarmaster.v28.progress','aljabarmaster.v23.progress','aljabarmaster.v20.progress','aljabarmaster.v16final.progress']) {
          const v = localStorage.getItem(k);
          if (v) { progress = JSON.parse(v); break; }
        }
      } catch (e) {}
      const payload = { legacyKey: 'localStorage:legacy', progress };
      const r = await singlePlayerSaves.legacyImport(payload);
      if (r.ok && r.data?.save) {
        setSaves((s) => {
          const exists = s.some((x) => x.id === r.data.save.id);
          return exists ? s.map((x) => (x.id === r.data.save.id ? r.data.save : x)) : [...s, r.data.save];
        });
        if (onLegacyImported) onLegacyImported(r.data.save, !!r.data.alreadyImported);
        return;
      }
      if (r.status === 409 && Array.isArray(r.data?.saves)) {
        setSaves(r.data.saves);
        setError('Batas 5 petualangan tercapai');
        return;
      }
      throw new Error(r.data?.message || 'Gagal mengimpor petualangan lama');
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="chapter-select-v44">
      <div className="chapter-select-bg-v44" aria-hidden="true">
        <video autoPlay loop muted playsInline preload="metadata" poster="/assets/home/home-background-cinematic-poster.jpg">
          <source src="/assets/home/home-background-cinematic.mp4" type="video/mp4" />
        </video>
        <div />
      </div>

      <header className="chapter-select-top-v44">
        <button className="chapter-select-back-v44" type="button" onClick={onBack}>
          <SolvoxUtilityArt name="back" size={28} className="solvox-back-art" />
          <span className="solvox-back-label-v82">{t('back')}</span>
        </button>

        <div className="chapter-select-title-v44">
          <small>{t('singleAdventure')}</small>
          <h1>{t('chooseChapter')}</h1>
          <p>{t('chooseChapterHint')}</p>
        </div>

        <div className="chapter-select-stat-v44">
          <b>{saves.length}/{MAX_SAVES}</b>
          <span>Slot Petualangan</span>
        </div>
      </header>

      <main className="chapter-select-grid-v44" style={{ gap: '1.25rem' }}>
        {saves.map((sv, i) => {
          const completed = Array.isArray(sv.completedLevels) ? sv.completedLevels.length : 0;
          const total = 5;
          return (
            <button
              key={sv.id}
              type="button"
              className="chapter-card-v44 is-open"
              style={{ '--chapter-accent': '#3FB984' }}
              onClick={() => { try{ sessionStorage.setItem("solvox.sp.saveId", sv.id); }catch(e){}; onSelectSave && onSelectSave(sv); }}
            >
              <span className="chapter-card-copy-v44">
                <small>Slot {i + 1}</small>
                <strong>{slotName(sv.name, i)}</strong>
                <em>Chapter aktif: {sv.currentChapterId || 1} • Selesai: {completed}/{total}</em>
              </span>
              <span className="chapter-card-progress-v44">
                <span>Lanjutkan</span>
                <span>
                  <PixelIcon name="right" size={13} />
                </span>
              </span>
            </button>
          );
        })}

        {saves.length < MAX_SAVES && (
          <button
            type="button"
            disabled={creating || loading}
            className="chapter-card-v44 is-open"
            style={{ '--chapter-accent': '#5B9BFF' }}
            onClick={handleCreate}
          >
            <span className="chapter-card-copy-v44">
              <small>Slot kosong</small>
              <strong>Petualangan Baru</strong>
              <em>Buat petualangan baru untuk melanjutkan campaign</em>
            </span>
            <span className="chapter-card-progress-v44">
              <span>{creating ? 'Membuat...' : 'Buat Baru'}</span>
              <span>
                <PixelIcon name="right" size={13} />
              </span>
            </span>
          </button>
        )}

        <button
          type="button"
          disabled={importing || loading}
          className="chapter-card-v44 is-open"
          style={{ '--chapter-accent': '#FFB020' }}
          onClick={handleLegacyImport}
        >
          <span className="chapter-card-copy-v44">
            <small>Migrasi</small>
            <strong>Impor Petualangan Lama</strong>
            <em>Impor progress single player dari perangkat ini</em>
          </span>
          <span className="chapter-card-progress-v44">
            <span>{importing ? 'Mengimpor...' : 'Impor'}</span>
            <span>
              <PixelIcon name="right" size={13} />
            </span>
          </span>
        </button>
      </main>

      {error && (
        <div style={{ padding: '1rem 2rem', color: '#ffb4b4', textAlign: 'center' }}>
          {error}
        </div>
      )}
    </div>
  );
}
