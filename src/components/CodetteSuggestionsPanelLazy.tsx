/**
 * CodetteSuggestionsPanelLazy
 * Lazy-loaded version of Codette suggestions panel
 * Isolated to prevent import errors from affecting main app
 */

import { Suspense, lazy } from 'react';

// Lazy load the actual component to isolate any import issues
const CodetteSuggestionsPanel = lazy(() =>
  import('./CodetteSuggestionsPanel').then(module => ({
    default: module.CodetteSuggestionsPanel
  }))
);

interface CodetteSuggestionsPanelLazyProps {
  trackId?: string;
  context?: string;
  onApply?: (suggestion: any) => void;
}

export function CodetteSuggestionsPanelLazy({
  trackId,
  context = "general",
  onApply,
}: CodetteSuggestionsPanelLazyProps) {
  return (
    <Suspense fallback={
      <div className="p-4 bg-gray-800 border border-gray-700 rounded">
        <p className="text-sm text-gray-400">Loading suggestions...</p>
      </div>
    }>
      <CodetteSuggestionsPanel
        trackId={trackId}
        context={context}
        onApply={onApply}
      />
    </Suspense>
  );
}
