import React,{useEffect,useState} from 'react';
import PixelIcon from './PixelIcon';
import {SolvoxUtilityArt} from './SolvoxUtilityArt';
import { isSoundEnabled, setSoundEnabled } from '../services/sound';

export default function Settings({lang,t,onClose,onReset,onChangeLang,onAboutUs}){
  const [motion,setMotion]=useState(()=>localStorage.getItem('solvox.reducedMotion')==='1' || localStorage.getItem('numericore.reducedMotion')==='1' || localStorage.getItem('aljabarmaster.reducedMotion')==='1');
  const [sound,setSound]=useState(()=>isSoundEnabled());
  useEffect(()=>{document.documentElement.classList.toggle('reduced-motion',motion);localStorage.setItem('solvox.reducedMotion',motion?'1':'0')},[motion]);
  const chooseLanguage=(next)=>{onChangeLang?.(next)};
  return <div className="modal-backdrop">
    <div className="settings-card settings-card-v94">
      <div className="utility-art-modal-head settings-head-v93 settings-head-v102">
        <img src="/assets/ui/utility/icons/settings-v101.webp" alt="" aria-hidden="true" className="settings-head-art-v102" />
        <div><div className="eyebrow">{t('settings')}</div><h2>{t('settingsTitle')}</h2></div>
      </div>

      <div className="settings-row language-setting-v42">
        <div><b>{t('language')}</b><p>{t('languageHint')}</p></div>
        <div className="language-switch-v42 language-switch-v94" role="group" aria-label={t('language')}>
          <button className={lang==='id'?'active':''} onClick={()=>chooseLanguage('id')} aria-label={t('languageIndonesia')} title={t('languageIndonesia')}>
            <img src="/assets/ui/utility/icons/flag-id-v94.png" alt="" aria-hidden="true" />
          </button>
          <button className={lang==='en'?'active':''} onClick={()=>chooseLanguage('en')} aria-label={t('languageEnglish')} title={t('languageEnglish')}>
            <img src="/assets/ui/utility/icons/flag-en-v94.png" alt="" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="settings-row">
        <div><b>{t('sound')}</b><p>{t('soundHint')}</p></div>
        <button className={`toggle-btn ${sound?'on':''}`} onClick={()=>setSound(v=>{const next=!v;setSoundEnabled(next);return next;})}>{sound?t('on'):t('off')}</button>
      </div>

      <div className="settings-row">
        <div><b>{t('reducedMotion')}</b><p>{t('motionHint')}</p></div>
        <button className={`toggle-btn ${motion?'on':''}`} onClick={()=>setMotion(v=>!v)}>{motion?t('on'):t('off')}</button>
      </div>

      <div className="settings-row settings-about-row-v96">
        <div><b>{t('aboutUs')}</b><p>{t('aboutUsHint')}</p></div>
        <button className="secondary-btn settings-about-btn-v96" type="button" onClick={onAboutUs}>{t('openAboutUs')}</button>
      </div>

      <div className="settings-row danger">
        <div><b>{t('resetTitle')}</b><p>{t('resetDesc')}</p></div>
        <button className="danger-btn" onClick={onReset}><PixelIcon name="reset" size={14}/><span>{t('reset')}</span></button>
      </div>
      <button className="primary-btn settings-close-v96 settings-close-btn-v96" onClick={onClose}><SolvoxUtilityArt name="close" size={18} className="settings-close-art-v96" /><span>{t('close')}</span></button>
    </div>
  </div>
}
