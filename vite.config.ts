import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
  // `process.env` does not carry .env files here — Vite only loads them into
  // `import.meta.env` for application code, so the config reads them itself.
  const env = loadEnv(mode, process.cwd(), 'VITE_');

  return {
    plugins: [react()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // Keeps the browser same-origin in development, so no CORS setup is needed
      // beyond the API's own allowlist.
      proxy: {
        '/api': {
          target: env.VITE_DEV_API_TARGET || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
    build: {
      target: 'es2022',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            react: ['react', 'react-dom'],
            query: ['@tanstack/react-query'],
          },
        },
      },
    },
  };
});
