import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css'; // Tailwind CSS 등 전역 스타일 적용
import { registerServiceWorker } from './api/alert/push';
import { bootstrapAuth } from './store/authBootstrap';

bootstrapAuth().finally(() => {
  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  );

  registerServiceWorker();
});
