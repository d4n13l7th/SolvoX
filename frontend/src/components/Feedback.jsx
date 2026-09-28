import React,{useState} from 'react';
import {sendFeedback} from '../services/feedback';
import PixelIcon from './PixelIcon';
import { SolvoxUtilityArt } from './SolvoxUtilityArt';

export default function Feedback({onClose,lang,t}){
  const [rating,setRating]=useState(5),[category,setCategory]=useState('pedagogy'),[text,setText]=useState(''),[sent,setSent]=useState(false),[loading,setLoading]=useState(false);
  const categories=[['pedagogy',t('feedbackCategoryPedagogy')],['gameplay',t('feedbackCategoryGameplay')],['ui',t('feedbackCategoryUI')],['bug',t('feedbackCategoryBug')]];
  const submit=async()=>{setLoading(true);try{await sendFeedback({rating,category,comment:text,lang,ts:new Date().toISOString()});setSent(true)}catch{setSent(false)}finally{setLoading(false)}};
  return <div className="modal-backdrop"><div className="feedback-card feedback-card-v35">
    <div className="utility-art-modal-head"><SolvoxUtilityArt name="feedback" size={96} variant="full" /><div><div className="eyebrow">{t('feedback')}</div><h2>{t('experience')}</h2></div></div>
    <div className="feedback-category-v35" role="tablist" aria-label={t('feedbackCategory')}>{categories.map(([id,label])=><button key={id} type="button" className={category===id?'active':''} onClick={()=>setCategory(id)}>{label}</button>)}</div>
    <div className="stars" aria-label={t('rating')}>{[1,2,3,4,5].map(x=><button type="button" key={x} onClick={()=>setRating(x)} className={x<=rating?'on':''}>★</button>)}</div>
    <textarea value={text} onChange={e=>setText(e.target.value)} placeholder={t('tellImprove')}/>
    {sent?<div className="success success-v27"><PixelIcon name="check" size={14}/><span>{t('thanks')}</span></div>:<button disabled={loading} className="primary-btn" onClick={submit}>{loading?t('saving'):t('sendFeedback')}</button>}
    <button className="ghost-btn" onClick={onClose}>{t('close')}</button>
  </div></div>
}
