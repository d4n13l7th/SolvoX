import React, { useEffect, useState } from 'react';
import { singlePlayerSaves, singlePlayerRequestError } from '../services/singlePlayerSaves';
import { SolvoxUtilityArt } from './SolvoxUtilityArt';
import PixelIcon from './PixelIcon';
import { getPlayerAsset } from '../data/playerAssets';

const MAX_SAVES = 5;
const slotName = (name, index) => String(name || '').trim().slice(0, 40) || `Petualangan ${index + 1}`;

export default function SinglePlayerSavesList({ lang, t, onBack, onSelectSave, onCreateSave, onDeleted }) {
  const [loading, setLoading] = useState(false), [creating, setCreating] = useState(false), [deletingId, setDeletingId] = useState(''), [saves, setSaves] = useState([]), [error, setError] = useState('');
  const ensureGuest = async () => {
    const guest = await singlePlayerSaves.getGuestSession();
    return guest.ok || guest.status !== 401 ? guest : singlePlayerSaves.createGuestSession('Player');
  };
  const load = async () => {
    setLoading(true); setError('');
    try {
      const guest = await ensureGuest();
      if (!guest.ok) throw new Error(singlePlayerRequestError(guest, lang));
      const result = await singlePlayerSaves.listSaves();
      if (!result.ok || !Array.isArray(result.data?.saves)) throw new Error(singlePlayerRequestError(result, lang));
      setSaves(result.data.saves);
    } catch (cause) { setError(String(cause.message || cause)); } finally { setLoading(false); }
  };
  useEffect(() => { load(); }, []);
  const handleCreate = async () => {
    setCreating(true); setError('');
    try {
      const guest = await ensureGuest();
      if (!guest.ok) throw new Error(singlePlayerRequestError(guest, lang));
      const result = await singlePlayerSaves.createSave({ name: lang === 'en' ? `Adventure ${saves.length + 1}` : `Petualangan ${saves.length + 1}`, characterId: 'traveler', currentChapterId: 1, completedLevels: [] });
      if (!result.ok || !result.data?.save) throw new Error(singlePlayerRequestError(result, lang));
      sessionStorage.setItem('solvox.sp.saveId', result.data.save.id);
      onCreateSave?.(result.data.save);
    } catch (cause) { setError(String(cause.message || cause)); } finally { setCreating(false); }
  };
  const handleSelect = async (save) => {
    setLoading(true); setError('');
    try {
      const result = await singlePlayerSaves.getSave(save.id);
      if (!result.ok || !result.data?.save) throw new Error(singlePlayerRequestError(result, lang));
      sessionStorage.setItem('solvox.sp.saveId', result.data.save.id);
      onSelectSave?.(result.data.save);
    } catch (cause) { setError(String(cause.message || cause)); } finally { setLoading(false); }
  };
  const handleDelete = async (save) => {
    const message = lang === 'en' ? `Delete “${slotName(save.name, 0)}”? This cannot be undone.` : `Hapus “${slotName(save.name, 0)}”? Tindakan ini tidak dapat dibatalkan.`;
    if (!window.confirm(message)) return;
    setDeletingId(save.id); setError('');
    try {
      const result = await singlePlayerSaves.deleteSave(save.id);
      if (!result.ok) throw new Error(singlePlayerRequestError(result, lang));
      setSaves((current) => current.filter((item) => item.id !== save.id));
      onDeleted?.(save.id);
    } catch (cause) { setError(String(cause.message || cause)); } finally { setDeletingId(''); }
  };
  return <div className="save-select">
    <div className="save-select-bg" aria-hidden="true"><video autoPlay loop muted playsInline preload="metadata" poster="/assets/home/home-background-v83-poster.jpg"><source src="/assets/home/home-background-v83-1080p.mp4" type="video/mp4" /></video><i /></div>
    <header className="save-select-header"><button className="save-select-back" type="button" onClick={onBack}><SolvoxUtilityArt name="back" size={24} /><span>{t('back')}</span></button><div><small>{t('singleAdventure')}</small><h1>{lang === 'en' ? 'Your adventures' : 'Petualanganmu'}</h1><p>{lang === 'en' ? 'Choose a progress slot or begin a new adventure.' : 'Pilih progress untuk melanjutkan, atau mulai petualangan baru.'}</p></div><strong>{saves.length}/{MAX_SAVES}<span>{lang === 'en' ? 'slots' : 'slot'}</span></strong></header>
    <main className="save-select-grid">{saves.map((save, index) => {
      const character = getPlayerAsset(save.characterId || 'traveler'); const completed = Array.isArray(save.completedLevels) ? save.completedLevels.length : 0;
      return <article className="save-card" key={save.id} style={{ '--save-accent': character.accent || '#61e2d5' }}><button className="save-card-open" type="button" onClick={() => handleSelect(save)} disabled={loading || !!deletingId}><img src={character.portrait} alt="" /><span><small>Slot {index + 1}</small><b>{slotName(save.name, index)}</b><em>{lang === 'en' ? `Chapter ${save.currentChapterId || 1} · ${completed}/5 cleared` : `Chapter ${save.currentChapterId || 1} · ${completed}/5 selesai`}</em></span><PixelIcon name="right" size={18} /></button><button className="save-card-delete" type="button" onClick={() => handleDelete(save)} disabled={loading || deletingId === save.id}>{deletingId === save.id ? '…' : (lang === 'en' ? 'Delete' : 'Hapus')}</button></article>;
    })}{saves.length < MAX_SAVES && <button className="save-card save-card-new" type="button" onClick={handleCreate} disabled={loading || creating}><PixelIcon name="spark" size={22} /><span><small>{lang === 'en' ? 'Empty slot' : 'Slot kosong'}</small><b>{creating ? (lang === 'en' ? 'Creating…' : 'Membuat…') : (lang === 'en' ? 'New adventure' : 'Petualangan baru')}</b></span><PixelIcon name="right" size={18} /></button>}</main>
    {error && <div className="save-select-error" role="alert">{error}<button type="button" onClick={load}>{lang === 'en' ? 'Retry' : 'Coba lagi'}</button></div>}
  </div>;
}
