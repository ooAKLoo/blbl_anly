import React from 'react';
import ReactDOM from 'react-dom/client';
import { Orbit } from '@ooakloowj/orbit';
import App from './App';
import './index.css';

Orbit.configure({
  appId: 'com.ooakloo.upluse',
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
