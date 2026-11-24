import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { FORCE_WEB_KEY } from './MobileGate'

// Пользователь уже выбрал веб-версию на телефоне — не показываем заглушку снова.
try {
  if (localStorage.getItem(FORCE_WEB_KEY) === '1') document.documentElement.classList.add('force-web')
} catch {
  // Хранилище недоступно.
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
