import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { supabase } from './lib/supabase';

// Expose Supabase for Debug/Console Scripts
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase;

  (window as any).toggleRealMode = () => {
    const isMockVar = localStorage.getItem('PROJECT_VECTOR_DEMO_MODE');
    if (isMockVar) {
      localStorage.removeItem('PROJECT_VECTOR_DEMO_MODE');
      console.log('🟢 SWITCHING TO REAL MODE (Live Database)...');
    } else {
      localStorage.setItem('PROJECT_VECTOR_DEMO_MODE', 'true');
      console.log('🟡 SWITCHING TO SIMULATION MODE (Browser Mock)...');
    }
    setTimeout(() => window.location.reload(), 1000);
  };

  console.log(`
    [PROJECT VECTOR DEBUG]
    - window.supabase is now available.
    - Run window.toggleRealMode() to switch between Mock/Real data.
    `);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
