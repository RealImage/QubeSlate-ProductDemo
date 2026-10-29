import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { SlateProvider } from '@slate/api';
import { App } from './App';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <SlateProvider portal="admin">
        <App />
      </SlateProvider>
    </BrowserRouter>
  </StrictMode>
);
