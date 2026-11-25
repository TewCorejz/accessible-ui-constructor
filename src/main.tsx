import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import './theme-dark.css'
import './theme-dark-overrides.css'
import { applyColorTheme, readColorTheme } from './colorTheme'
import { FORCE_WEB_KEY } from './MobileGate'

// Пользователь уже выбрал веб-версию на телефоне — не показываем заглушку снова.
try {
  if (localStorage.getItem(FORCE_WEB_KEY) === '1') document.documentElement.classList.add('force-web')
} catch {
  // Хранилище недоступно.
}

// Тему ставим до первой отрисовки, чтобы страница не «мигала» светлой.
applyColorTheme(readColorTheme())

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
