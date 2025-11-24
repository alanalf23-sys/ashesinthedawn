/**
 * WALTER Layout Provider Component
 * 
 * Applies WALTER layout definitions to React components
 * Provides responsive positioning and styling based on conditions
 */

import React, { createContext, useMemo, useCallback } from 'react';
import {
  Layout,
  Coordinates,
  WalterExpressionEngine,
  RGBA,
} from '../config/walterConfig';
import { useWalterElement } from './useWalterLayout';
import { getNormalizedDimensions, createThrottledResizeListener } from '../lib/windowScaling';

// ============================================================================
// CONTEXT TYPES
// ============================================================================

export interface LayoutContextType {
  layout: Layout;
  parentWidth: number;
  parentHeight: number;
  getElementStyle: (elementName: string) => React.CSSProperties;
  getElementColor: (elementName: string) => { fg: string; bg?: string };
  getElementMargin: (elementName: string) => string;
  getResponsiveCoords: (elementName: string) => Coordinates;
  engine: WalterExpressionEngine;
}

export const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

// ============================================================================
// PROVIDER COMPONENT
// ============================================================================

interface WalterLayoutProviderProps {
  layout: Layout;
  parentWidth: number;
  parentHeight: number;
  children: React.ReactNode;
}

export const WalterLayoutProvider: React.FC<WalterLayoutProviderProps> = ({
  layout,
  parentWidth,
  parentHeight,
  children,
}) => {
  const engine = useMemo(
    () => new WalterExpressionEngine(parentWidth, parentHeight),
    [parentWidth, parentHeight]
  );

  const getElementStyle = useCallback(
    (elementName: string): React.CSSProperties => {
      const element = layout.elements[elementName];
      if (!element) return {};

      const coords = element.position;

      // Calculate actual pixel values
      const left = coords.x + coords.ls * parentWidth;
      const top = coords.y + coords.ts * parentHeight;
      const width = coords.w + coords.rs * parentWidth;
      const height = coords.h + coords.bs * parentHeight;

      return {
        position: 'absolute',
        left: `${left}px`,
        top: `${top}px`,
        width: `${width}px`,
        height: `${height}px`,
        zIndex: element.zOrder ?? 0,
      };
    },
    [layout.elements, parentWidth, parentHeight]
  );

  const rgbaToString = (rgba: RGBA): string => {
    return `rgba(${rgba.r}, ${rgba.g}, ${rgba.b}, ${rgba.a / 255})`;
  };

  const getElementColor = useCallback(
    (elementName: string): { fg: string; bg?: string } => {
      const element = layout.elements[elementName];
      if (!element?.color) {
        return { fg: 'inherit' };
      }

      return {
        fg: rgbaToString(element.color.foreground),
        bg: element.color.background ? rgbaToString(element.color.background) : undefined,
      };
    },
    [layout.elements]
  );

  const getElementMargin = useCallback(
    (elementName: string): string => {
      const element = layout.elements[elementName];
      if (!element?.margin) return '0';

      const m = element.margin;
      return `${m.top}px ${m.right}px ${m.bottom}px ${m.left}px`;
    },
    [layout.elements]
  );

  const getResponsiveCoords = useCallback(
    (elementName: string): Coordinates => {
      const element = layout.elements[elementName];
      if (!element) {
        return { x: 0, y: 0, w: 0, h: 0, ls: 0, ts: 0, rs: 0, bs: 0 };
      }

      let coords = element.position;

      // Apply responsive rules
      if (layout.responsiveRules) {
        for (const rule of layout.responsiveRules) {
          if (rule.elementName === elementName && engine.evaluateCondition(rule.condition)) {
            coords = {
              ...coords,
              ...rule.adjustments,
            };
          }
        }
      }

      return coords;
    },
    [layout.elements, layout.responsiveRules, engine]
  );

  const value: LayoutContextType = {
    layout,
    parentWidth,
    parentHeight,
    getElementStyle,
    getElementColor,
    getElementMargin,
    getResponsiveCoords,
    engine,
  };

  return (
    <LayoutContext.Provider value={value}>
      {children}
    </LayoutContext.Provider>
  );
};

// ============================================================================
// STYLED COMPONENT HELPERS
// ============================================================================

interface StyledWalterElementProps {
  elementName: string;
  as?: keyof React.ReactHTML;
  children?: React.ReactNode;
  className?: string;
  onClick?: React.MouseEventHandler<HTMLElement>;
}

/**
 * Generic component that applies WALTER layout
 */
export const StyledWalterElement = React.forwardRef<
  HTMLElement,
  StyledWalterElementProps
>(({ elementName, as = 'div', children, className, onClick }, ref) => {
  const { style, colors, margin } = useWalterElement(elementName);

  const Element = as as React.ElementType;

  return (
    <Element
      ref={ref}
      style={{
        ...style,
        color: colors.fg,
        backgroundColor: colors.bg,
        margin,
      }}
      className={className}
      onClick={onClick}
    >
      {children}
    </Element>
  );
});

StyledWalterElement.displayName = 'StyledWalterElement';

// ============================================================================
// RESPONSIVE LAYOUT COMPONENT
// ============================================================================

interface ResponsiveLayoutProps {
  layout: Layout;
  children: React.ReactNode;
}

export const ResponsiveLayout: React.FC<ResponsiveLayoutProps> = ({ layout, children }) => {
  const [dimensions, setDimensions] = React.useState(() => {
    const dims = getNormalizedDimensions();
    return { width: dims.width, height: dims.height };
  });

  React.useEffect(() => {
    // Use throttled resize listener for better performance
    const unsubscribe = createThrottledResizeListener((normalizedDims) => {
      setDimensions({
        width: normalizedDims.width,
        height: normalizedDims.height,
      });
    }, 150);

    return unsubscribe;
  }, []);

  return (
    <WalterLayoutProvider
      layout={layout}
      parentWidth={dimensions.width}
      parentHeight={dimensions.height}
    >
      {children}
    </WalterLayoutProvider>
  );
};
