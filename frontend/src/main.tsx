import React from 'react'
import ReactDOM from 'react-dom/client'
import 'mapbox-gl/dist/mapbox-gl.css'
import './styles/tokens.css'
import App from './App'
import './index.css'

try {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  )

  setTimeout(() => {
    document.getElementById('boot-status')?.remove()
  }, 2000)
} catch (error) {
  const bootStatus = document.getElementById('boot-status')
  if (bootStatus) {
    bootStatus.textContent = `UrbanMind error: ${error instanceof Error ? error.message : String(error)}`
    bootStatus.style.borderColor = '#ef4444'
    bootStatus.style.color = '#fecaca'
  }
  throw error
}
