import React, { useEffect, useState } from 'react';
import { singlePlayerSaves } from '../services/singlePlayerSaves';
import { SolvoxUtilityArt } from './SolvoxUtilityArt';
import PixelIcon from './PixelIcon';
import { getPlayerAsset } from '../data/playerAssets';

const MAX_SAVES = 5;

function slotName(name, index) {
  if (name && name.trim()) return name.trim().slice(0, 40);
  return `Petualangan ${index + 1}`;
}

export default function SinglePlayerSavesList({ lang, t, onBack, onSelectSave, onCreateSave }) {
  const [loading, setLoading] = useState(false);
  const [saves, setSaves] = useState([]);
  const [error, setError] = useState('');
  const [creating, setCreating] = useState(false);

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
      let initialChar = 'traveler';
      try {
        const c = localStorage.getItem('solvox.singlePlayer.character.v1') || sessionStorage.getItem('solvox.singlePlayer.character.v1');
        if (c) initialChar = c;
      } catch (e) {}
      const r = await singlePlayerSaves.createSave({ name, characterId: initialChar, currentChapterId: 1, completedLevels: [] });
      if (r.ok && r.data?.save) {
        const ns = r.data.save;
        setSaves((s) => [...s, ns]);
        try {
          sessionStorage.setItem('solvox.sp.saveId', ns.id);
        } catch (e) {}
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

  const handleSelectSave = async (sv) => {
    setLoading(true);
    setError('');
    try {
      const g = await ensureGuest();
      if (!g.ok) throw new Error('Gagal memuat sesi');
      try {
        sessionStorage.setItem('solvox.sp.saveId', sv.id);
      } catch (e) {}
      const r = await singlePlayerSaves.getSave(sv.id);
      if (!r.ok || !r.data?.save) throw new Error(r.data?.message || 'Gagal membuka petualangan');
      const saveData = r.data.save;
      if (onSelectSave) onSelectSave(saveData);
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setLoading(false);
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
        <button className="chapter-select-back-v44" type="button" onClick={onBack} disabled={loading || creating}>
          <SolvoxUtilityArt name="back" size={28} className="solvox-back-art" />
          <span className="solvox-back-label-v82">{t('back')}</span>
        </button>
        <div className="chapter-select-title-v44">
          <small>{t('singleAdventure')}</small>
          <h1>{lang === 'en' ? 'Your Adventures' : 'Petualanganmu'}</h1>
          <p>{lang === 'en' ? 'Select a save slot to continue, or start a new adventure.' : 'Pilih slot petualangan untuk melanjutkan, atau buat petualangan baru.'}</p>
        </div>
        <div className="chapter-select-stat-v44">
          <b>{saves.length}/{MAX_SAVES}</b>
          <span>Slot Petualangan</span>
        </div>
      </header>
      <main className="chapter-select-list-v44">
        {saves.length === 0 && (
          <button type="button" disabled={creating || loading} className="chapter-card-v44 is-open is-list" style={{ '--chapter-accent': '#5B9BFF' }} onClick={handleCreate}>
            <span className="chapter-card-copy-v44"><small>Slot kosong</small><strong>Petualangan Baru</strong></span>
            <span className="chapter-card-progress-v44"><span>{creating ? 'Membuat...' : 'Buat Baru'}</span><span><PixelIcon name="right" size={13} /></span></span>
          </button>
        )}
        {saves.length > 0 && saves.map((sv, i) => {
          const completed = Array.isArray(sv.completedLevels) ? sv.completedLevels.length : 0;
          const total = 5;
          const ch = getPlayerAsset(sv.characterId || 'traveler');
          return (
            <button key={sv.id} type="button" className="chapter-card-v44 is-open is-list" style={{ '--chapter-accent': ch.accent || '#3FB984' }} onClick={() => handleSelectSave(sv)} disabled={loading || creating}>
              <span className="chapter-card-copy-v44">
                <span className="save-row-v44">
                  <img src={ch.portrait} alt="" className="save-portrait-v44" />
                  <span>
                    <small>Slot {i + 1}</small>
                    <strong>{slotName(sv.name, i)}</strong>
                    <em>Chapter aktif: {sv.currentChapterId || 1} • Selesai: {completed}/{total}</em>
                  </span>
                </span>
              </span>
              <span className="chapter-card-progress-v44"><span>{loading ? 'Memuat...' : 'Lanjutkan'}</span><span><PixelIcon name="right" size={13} /></span></span>
            </button>
          );
        })}
        {saves.length > 0 && saves.length < MAX_SAVES && (
          <button type="button" disabled={creating || loading} className="chapter-card-v44 is-open is-list" style={{ '--chapter-accent': '#5B9BFF' }} onClick={handleCreate}>
            <span className="chapter-card-copy-v44"><small>Slot kosong</small><strong>Petualangan Baru</strong></span>
            <span className="chapter-card-progress-v44"><span>{creating ? 'Membuat...' : 'Buat Baru'}</span><span><PixelIcon name="right" size={13} /></span></span>
          </button>
        )}
      </main>
      {error && (<div style={{ padding: '1rem 2rem', color: '#ffb4b4', textAlign: 'center' }}>{error}</div>)}
      {(loading || creating) && !error && (<div style={{ padding: '0 2rem 1rem', color: '#e6e6e6', textAlign: 'center', opacity: 0.9 }}>Memuat...</div>)}
    </div>
  );
}
