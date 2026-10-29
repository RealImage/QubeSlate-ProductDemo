import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// /api goes to the shared mock server (npm run dev:api). Point VITE_API_URL at a real backend to bypass it.
const api = { '/api': process.env.SLATE_API_ORIGIN ?? 'http://localhost:4100' };

export default defineConfig({
  plugins: [react()],
  server: { proxy: api },
  preview: { proxy: api }
});
