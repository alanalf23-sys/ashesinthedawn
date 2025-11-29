/**
 * Lazy-loaded component exports for code-splitting
 * These components are loaded only when needed, reducing initial bundle size
 */

import { lazy, Suspense } from 'react';
import { Zap } from 'lucide-react';

// Lazy load heavy components
const LazyPluginBrowser = lazy(() => import('./PluginBrowser'));
const LazyRoutingMatrix = lazy(() => import('./RoutingMatrix'));
const LazySpectrumVisualizerPanel = lazy(() => import('./SpectrumVisualizerPanel'));
const LazyEffectChainPanel = lazy(() => import('./EffectChainPanel'));

// Lazy load Codette unified system
const LazyCodetteSystem = lazy(() => import('./CodetteSystem'));

// Lazy load additional large components for bundle optimization
const LazyCodettePanelComponent = lazy(() => import('./CodettePanel'));
const LazyMixerComponent = lazy(() => import('./Mixer'));
const LazyAIPanelComponent = lazy(() => import('./AIPanel'));

// Loading fallback component
const ComponentLoadingFallback = ({ name }: { name: string }) => (
  <div className="bg-gray-900 border border-gray-700 rounded p-4 flex items-center justify-center gap-2 text-xs text-gray-400">
    <Zap size={14} className="animate-pulse" />
    Loading {name}...
  </div>
);

// Wrapper components with Suspense boundaries
export const LazyPluginBrowserWrapper = (props: Record<string, unknown>) => (
  <Suspense fallback={<ComponentLoadingFallback name="Plugin Browser" />}>
    <LazyPluginBrowser {...props} />
  </Suspense>
);

export const LazyRoutingMatrixWrapper = (props: Record<string, unknown>) => (
  <Suspense fallback={<ComponentLoadingFallback name="Routing Matrix" />}>
    <LazyRoutingMatrix {...props} />
  </Suspense>
);

export const LazySpectrumVisualizerPanelWrapper = (props: Record<string, unknown>) => (
  <Suspense fallback={<ComponentLoadingFallback name="Spectrum Analyzer" />}>
    <LazySpectrumVisualizerPanel {...props} />
  </Suspense>
);

export const LazyEffectChainPanelWrapper = (props: Record<string, unknown>) => (
  <Suspense fallback={<ComponentLoadingFallback name="Effect Chain" />}>
    <LazyEffectChainPanel {...props} />
  </Suspense>
);

// Additional lazy-loaded components for bundle optimization
export const LazyCodetteSystemWrapper = (props: Record<string, unknown>) => (
  <Suspense fallback={<ComponentLoadingFallback name="Codette AI" />}>
    <LazyCodetteSystem {...props} />
  </Suspense>
);

export const LazyCodettePanelWrapper = (props: Record<string, unknown>) => (
  <Suspense fallback={<ComponentLoadingFallback name="Codette Panel" />}>
    <LazyCodettePanelComponent {...props} />
  </Suspense>
);

export const LazyMixerWrapper = (props: Record<string, unknown>) => (
  <Suspense fallback={<ComponentLoadingFallback name="Mixer" />}>
    <LazyMixerComponent {...props} />
  </Suspense>
);

export const LazyAIPanelWrapper = (props: Record<string, unknown>) => (
  <Suspense fallback={<ComponentLoadingFallback name="AI Panel" />}>
    <LazyAIPanelComponent {...props} />
  </Suspense>
);
