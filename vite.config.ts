import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import os from 'os';

// Use a temporary directory outside the project for cache
const tempDir = path.join(os.tmpdir(), 'vite-corelogic-cache');

// https://vitejs.dev/config/
export default defineConfig({
  // Use temp directory for cache to avoid permission issues
  cacheDir: tempDir,
  
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Separate vendor libraries into chunks
          'vendor-ui': ['react', 'react-dom'],
          'vendor-icons': ['lucide-react'],
          
          // Lazy-load heavy components
          'chunk-codette': [
            './src/components/CodettePanel.tsx',
            './src/components/CodetteControlCenter.tsx',
          ],
          
          'chunk-mixer': [
            './src/components/Mixer.tsx',
            './src/components/MixerTile.tsx',
            './src/components/PluginParameterMapper.tsx',
          ],
          
          'chunk-visualization': [
            './src/components/SpectrumVisualizerPanel.tsx',
            './src/components/Timeline.tsx',
            './src/components/WaveformAdjuster.tsx',
          ],
          
          'chunk-panels': [
            './src/components/AIPanel.tsx',
            './src/components/TeachingPanel.tsx',
          ],
        },
      },
    },
    // Increase chunk size warning threshold as we have legitimate large components
    chunkSizeWarningLimit: 600,
    // Enable compression analysis
    reportCompressedSize: true,
  },
});
