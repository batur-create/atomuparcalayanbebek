import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx'; // Artık Root yerine direkt App'i çağıracağız
import './index.css';
import { BrowserRouter } from 'react-router-dom'; // Router'ı buraya taşıyoruz

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);