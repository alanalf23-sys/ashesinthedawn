/**
 * WALTER Layout Hooks
 * 
 * Separated from component to comply with Fast Refresh rules
 */

import { useContext, useMemo } from 'react';
import { LayoutContext, LayoutContextType } from './WalterLayout';

export function useWalterLayout(): LayoutContextType {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useWalterLayout must be used within WalterLayoutProvider');
  }
  return context;
}

/**
 * Hook to get style for a specific element
 */
export function useWalterElement(elementName: string) {
  const { getElementStyle, getElementColor, getElementMargin, getResponsiveCoords } =
    useWalterLayout();

  return useMemo(
    () => ({
      style: getElementStyle(elementName),
      colors: getElementColor(elementName),
      margin: getElementMargin(elementName),
      coords: getResponsiveCoords(elementName),
    }),
    [elementName, getElementStyle, getElementColor, getElementMargin, getResponsiveCoords]
  );
}

/**
 * Hook to evaluate WALTER expressions
 */
export function useWalterExpression(expression: string): boolean {
  const { engine } = useWalterLayout();

  return useMemo(() => engine.evaluateCondition(expression), [engine, expression]);
}
