import { useTheme } from '../themes/ThemeContext';

export default function Watermark() {
  const { currentTheme } = useTheme();

  return (
    <div
      className="fixed bottom-1 right-2 text-xs font-mono pointer-events-none"
      style={{
        color: currentTheme.colors.text.tertiary,
      }}
    >
      Codette Quantum • Prototype Visual GUI • Phase 3 Build
    </div>
  );
}
