import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';

try {
  const key = Object.keys(localStorage).find((k) => k.includes('auth-token'));
  if (key) {
    const data = JSON.parse(localStorage.getItem(key) ?? '{}');
    const expired = !data.access_token || !data.expires_at || (Date.now() / 1000) > data.expires_at;
    if (expired) { localStorage.clear(); }
  }
} catch { localStorage.clear(); }

createRoot(document.getElementById('root')!).render(<App />);
