import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { fileURLToPath, URL } from 'node:url';
import { APP_NAME } from './src/config.ts';

/** 서비스 이름이 미확정이라 index.html에 박지 않는다. %APP_NAME%을 빌드 시 치환한다. */
const appName = (): Plugin => ({
  name: 'app-name-html',
  transformIndexHtml: {
    order: 'pre',
    handler: (html) => html.replaceAll('%APP_NAME%', APP_NAME),
  },
});

export default defineConfig({
  plugins: [react(), tailwindcss(), appName()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
});
