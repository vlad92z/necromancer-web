import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initMixpanel } from './utils/mixpanel'

initMixpanel('150a8a103393d526b846dd7d68ce65fb')

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
