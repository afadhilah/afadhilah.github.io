import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import "../../src/resources/custom.css";
import "@once-ui-system/core/css/styles.css";
import "@once-ui-system/core/css/tokens.css";

// Apply Once UI Design System tokens to root (Hardcoded from once-ui.config.ts to avoid Next.js font errors)
const root = document.documentElement;
root.setAttribute('data-brand', 'cyan');
root.setAttribute('data-accent', 'red');
root.setAttribute('data-neutral', 'gray');
root.setAttribute('data-solid', 'contrast');
root.setAttribute('data-solid-style', 'flat');
root.setAttribute('data-border', 'playful');
root.setAttribute('data-surface', 'translucent');
root.setAttribute('data-transition', 'all');
root.setAttribute('data-scaling', '100');
root.setAttribute('data-viz-style', 'gradient');
root.setAttribute('data-theme', 'light');

// Apply font variables manually to match portfolio
root.style.setProperty('--font-heading', 'Geist, sans-serif');
root.style.setProperty('--font-body', 'Geist, sans-serif');
root.style.setProperty('--font-label', 'Geist, sans-serif');
root.style.setProperty('--font-code', 'Geist Mono, monospace');

// Add classes that Once UI components expect
root.classList.add('--font-heading', '--font-body', '--font-label', '--font-code');

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
