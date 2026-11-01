import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { federation } from '@module-federation/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const jobsFeedUrl = env.VITE_JOBS_FEED_URL || 'http://localhost:3001';
  const insightsUrl = env.VITE_INSIGHTS_URL || 'http://localhost:3002';

  return {
    plugins: [
      react(),
      tailwindcss(),
      federation({
        name: 'shell',
        filename: 'remoteEntry.js',
        // shared UI kit consumed by the micro frontends
        exposes: { './ui': './src/ui/index.tsx' },
        remotes: {
          jobsFeed: {
            type: 'module',
            name: 'jobsFeed',
            entry: `${jobsFeedUrl}/remoteEntry.js`,
            entryGlobalName: 'jobsFeed',
            shareScope: 'default',
          },
          insights: {
            type: 'module',
            name: 'insights',
            entry: `${insightsUrl}/remoteEntry.js`,
            entryGlobalName: 'insights',
            shareScope: 'default',
          },
        },
        shared: {
          react: { singleton: true },
          'react-dom': { singleton: true },
        },
        dts: false,
      }),
    ],
    server: { port: 3000, strictPort: true, origin: 'http://localhost:3000' },
    preview: { port: 3000, strictPort: true },
    build: { target: 'esnext' },
    test: { environment: 'jsdom' },
  };
});
