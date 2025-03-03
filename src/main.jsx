import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
import { AIProvider } from './context/AIContext';
import { UserProvider } from './context/UserContext';
import { DialogProvider } from './context/DialogContext';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <UserProvider>
      <AIProvider>
        <DialogProvider>
          <App />
        </DialogProvider>
      </AIProvider>
    </UserProvider>
  </React.StrictMode>,
); 