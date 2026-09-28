import React,{useEffect,useState} from 'react';
import PixelIcon from './PixelIcon';
export default function Settings({lang,t,onClose,onReset,onChangeLang}){
  const [motion,setMotion]=useState(()=>localStorage.getItem('solvox.reducedMotion')==='1' || localStorage.getItem('numericore.reducedMotion')==='1' || localStorage.getItem('aljabarmaster.reducedMotion')==='1');
  const [saved,setSaved]=useState(false);
  useEffect(()=>{document.documentElement.classList.toggle('reduced-motion',motion);localStorage.setItem('solvox.reducedMotion',motion?'1':'0')},[motion]);
  const chooseLanguage=(next)=>{onChangeLang?.(next);setSaved(true)};
  return <div className="modal-backdrop"><div className="settings-card">
    <div className="utility-art-modal-head settings-head-v93"><div className="settings-head-mark-v93" aria-hidden="true"></div><div><div className="eyebrow">{t('settings')}</div><h2>{t('settingsTitle')}</h2></div></div>
    <div className="settings-row language-setting-v42"><div><b>{t('language')}</b><p>{t('languageHint')}</p></div><div className="language-switch-v42" role="group" aria-label={t('language')}><button className={lang==='id'?'active':''} onClick={()=>chooseLanguage('id')}>ID <span>{t('languageIndonesia')}</span></button><button className={lang==='en'?'active':''} onClick={()=>chooseLanguage('en')}>EN <span>{t('languageEnglish')}</span></button></div></div>
    <div className="settings-row"><div><b>{t('reducedMotion')}</b><p>{t('motionHint')}</p></div><button className={`toggle-btn ${motion?'on':''}`} onClick={()=>setMotion(v=>!v)}>{motion?t('on'):t('off')}</button></div>
    <div className="settings-row danger"><div><b>{t('resetTitle')}</b><p>{t('resetDesc')}</p></div><button className="danger-btn" onClick={onReset}><PixelIcon name="reset" size={14}/><span>{t('reset')}</span></button></div>
    {saved&&<div className="success success-v27"><PixelIcon name="check" size={14}/><span>{t('save')}</span></div>}
    <button className="primary-btn" onClick={()=>{setSaved(true);setTimeout(onClose,180)}}>{t('close')}</button>
  </div></div>
}
