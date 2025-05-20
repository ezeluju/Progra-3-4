// @ts-check
import { defineConfig } from 'astro/config';
import react        from '@astrojs/react';
import tailwindcss  from '@tailwindcss/vite';   // ← tu plugin

export default defineConfig({
  /** 1️⃣  Activá SSR global — permite POST/PUT/DELETE en /api */
  output: 'server',

  /** 2️⃣  Integraciones de Astro */
  integrations: [react()],

  /** 3️⃣  Plugins de Vite (aquí va tu Tailwind) */
  vite: {
    plugins: [tailwindcss()]
  }
});
