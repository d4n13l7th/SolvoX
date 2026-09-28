import React from 'react';
import {createRoot} from 'react-dom/client';
import App from './App';
import ErrorBoundary from './components/ErrorBoundary';
import './styles/app.css';
import './styles/ui-v32.css';
import './styles/ui-v33.css';
import './styles/ui-v34.css';
import './styles/ui-v42.css';
import './styles/chapter-select-v44.css';
import './styles/mode-select-v45.css';
import './styles/battle-v43.css';
import './styles/utility-art-v75.css';
import './styles/solvox-brand-v89.css';
import './styles/home-menu-v83.css';
import './styles/font-v78.css';
import './styles/ui-v93.css';
import './styles/responsive-v93.css';

createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary><App/></ErrorBoundary>
  </React.StrictMode>
);
