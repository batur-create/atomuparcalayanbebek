import React from 'react'
import ReactDOM from 'react-dom/client'
import Root from './App.jsx' // App yerine Root'u import et
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>,
)