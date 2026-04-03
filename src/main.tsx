import { createRoot } from 'react-dom/client';
import App from './app/App.tsx';
import './styles/index.css';

try {
  const oldKey = Object.keys(localStorage).find((k) => k.includes('sb-') && k.includes('auth-token'));
  if (oldKey) localStorage.removeItem(oldKey);
} catch {}

createRoot(document.getElementById('root')!).render(<App />);
