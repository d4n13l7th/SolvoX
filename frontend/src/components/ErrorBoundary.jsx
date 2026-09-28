import React from 'react';
import PixelIcon from './PixelIcon';
import {GAME_META} from '../config/game';
import {T} from '../services/i18n';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, message: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, message: error?.message || 'Unknown runtime error' };
  }

  componentDidCatch(error, info) {
    console.error('[Solvox ErrorBoundary]', error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;
    const lang = localStorage.getItem('solvox.lang') || localStorage.getItem('numericore.lang') || localStorage.getItem('aljabarmaster.lang') || 'id';
    const t = (key) => T[lang]?.[key] ?? T.id[key] ?? key;
    return (
      <main style={{minHeight:'100vh',display:'grid',placeItems:'center',padding:24,background:'#070b14',color:'#fff',fontFamily:'Inter,system-ui,sans-serif'}}>
        <section style={{maxWidth:620,width:'100%',padding:28,border:'1px solid rgba(255,255,255,.12)',borderRadius:20,background:'rgba(18,24,40,.92)',boxShadow:'0 24px 80px rgba(0,0,0,.45)'}}>
          <div style={{fontSize:12,letterSpacing:'.18em',textTransform:'uppercase',opacity:.7}}>{GAME_META.shortTitle}</div>
          <h1 style={{margin:'10px 0 8px'}}>{t('errorScreenTitle')}</h1>
          <p style={{opacity:.8,lineHeight:1.6}}>{t('errorScreenDescription')}</p>
          <details style={{marginTop:18,opacity:.7}}>
            <summary>{t('technicalDetails')}</summary>
            <code style={{display:'block',whiteSpace:'pre-wrap',marginTop:8}}>{this.state.message}</code>
          </details>
          <button onClick={this.handleReload} style={{marginTop:20,border:0,borderRadius:12,padding:'12px 18px',fontWeight:800,cursor:'pointer'}}>{`⟲ ${t('reload')}`}</button>
        </section>
      </main>
    );
  }
}
