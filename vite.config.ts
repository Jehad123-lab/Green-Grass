import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'html-transform',
      transformIndexHtml(html) {
        return html
          .replace(/<script type="importmap">[\s\S]*?<\/script>/gi, '')
          .replace(/<script src="https:\/\/esm\.sh.*"><\/script>/gi, '');
      },
    },
  ],
});