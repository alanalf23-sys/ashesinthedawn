/**
 * WALTER-Inspired Layout Configuration System
 * 
 * Window Arrangement Logic Template Engine for CoreLogic Studio
 * Brings REAPER's powerful layout system to React
 * 
 * Supports:
 * - Coordinate lists [x y w h ls ts rs bs]
 * - Responsive expressions (w<100, h>200)
 * - Edge attachment scaling
 * - Named layouts and presets
 * - Macro-based definitions
 */

// ============================================================================
// CORE TYPES
// ============================================================================

export type CoordinateValue = number | string;

export interface Coordinates {
  x: number;          // Left edge
  y: number;          // Top edge
  w: number;          // Width
  h: number;          // Height
  ls: number;         // Left attach scale (0-1)
  ts: number;         // Top attach scale (0-1)
  rs: number;         // Right attach scale (0-1)
  bs: number;         // Bottom attach scale (0-1)
}

export interface UIElement {
  name: string;
  position: Coordinates;
  color?: ColorSet;
  font?: FontStyle;
  margin?: Margins;
  visible?: boolean;
  zOrder?: number;
}

export interface ColorSet {
  foreground: RGBA;
  background?: RGBA;
  highlight?: RGBA;
  shadow?: RGBA;
}

export interface RGBA {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FontStyle {
  size: number;
  family: string;
  weight: 'normal' | 'bold' | 'italic';
  index: number; // 0=main, 1-8=user, -1=volpan
}

export interface Margins {
  left: number;
  top: number;
  right: number;
  bottom: number;
  alignment?: number; // 0=left, 0.5=center, 1=right
}

export interface Layout {
  name: string;
  imageDir?: string;
  elements: { [key: string]: UIElement };
  responsiveRules?: ResponsiveRule[];
}

export interface ResponsiveRule {
  condition: string;        // "w<100" or "h>200" etc
  elementName: string;      // Which element to modify
  adjustments: Partial<Coordinates>;
}

export interface WalterConfig {
  version: string;
  theme: string;
  layouts: { [key: string]: Layout };
  globalLayouts?: string[];
  macros?: { [key: string]: MacroDefinition };
  parameters?: UserParameter[];
}

export interface MacroDefinition {
  params: string[];
  body: string[];
}

export interface UserParameter {
  name: string;
  description: string;
  default: number;
  min: number;
  max: number;
}

// ============================================================================
// EXPRESSION EVALUATION
// ============================================================================

export class WalterExpressionEngine {
  private variables: Map<string, number> = new Map();

  constructor(parentW: number, parentH: number) {
    this.variables.set('w', parentW);
    this.variables.set('h', parentH);
  }

  setVariable(name: string, value: number): void {
    this.variables.set(name, value);
  }

  /**
   * Parse and evaluate condition expressions
   * Examples: "w<100", "h>200", "w<100&recarm"
   */
  evaluateCondition(condition: string): boolean {
    const comparisons = [
      { op: '<=', fn: (a: number, b: number) => a <= b },
      { op: '>=', fn: (a: number, b: number) => a >= b },
      { op: '==', fn: (a: number, b: number) => a === b },
      { op: '!=', fn: (a: number, b: number) => a !== b },
      { op: '<', fn: (a: number, b: number) => a < b },
      { op: '>', fn: (a: number, b: number) => a > b },
    ];

    const expr = condition;

    // Handle bitwise AND
    if (expr.includes('&')) {
      const parts = expr.split('&');
      return parts.every(part => this.evaluateCondition(part.trim()));
    }

    // Handle negation
    if (expr.startsWith('!')) {
      const varName = expr.substring(1);
      const val = this.variables.get(varName);
      return val === 0 || val === undefined;
    }

    // Handle truthiness
    if (expr.startsWith('?')) {
      const varName = expr.substring(1);
      const val = this.variables.get(varName);
      return (val ?? 0) !== 0;
    }

    // Handle comparisons
    for (const comp of comparisons) {
      if (expr.includes(comp.op)) {
        const [left, right] = expr.split(comp.op).map(s => s.trim());
        const leftVal = this.evaluateValue(left);
        const rightVal = this.evaluateValue(right);
        return comp.fn(leftVal, rightVal);
      }
    }

    return false;
  }

  /**
   * Evaluate a coordinate value (supports arithmetic)
   */
  evaluateValue(expr: string): number {
    expr = expr.trim();

    // Try to parse as direct number
    if (!isNaN(Number(expr))) {
      return Number(expr);
    }

    // Try to get as variable
    if (this.variables.has(expr)) {
      return this.variables.get(expr) ?? 0;
    }

    // Handle arithmetic: +, -, *, /
    if (expr.includes('+')) {
      const [left, right] = expr.split('+');
      return this.evaluateValue(left) + this.evaluateValue(right);
    }
    if (expr.includes('-') && !expr.startsWith('-')) {
      const [left, right] = expr.split('-');
      return this.evaluateValue(left) - this.evaluateValue(right);
    }
    if (expr.includes('*')) {
      const [left, right] = expr.split('*');
      return this.evaluateValue(left) * this.evaluateValue(right);
    }
    if (expr.includes('/')) {
      const [left, right] = expr.split('/');
      return this.evaluateValue(left) / this.evaluateValue(right);
    }

    return 0;
  }

  /**
   * Parse coordinate expressions like "100@w" or "scalar@x"
   * Examples:
   *   "100@w" -> [0 0 100 0]
   *   "50@h" -> [0 0 0 50]
   *   "10@ls" -> [0 0 0 0 10]
   */
  parseCoordinateExpression(expr: string): Partial<Coordinates> {
    const result: Partial<Coordinates> = {};

    if (expr.includes('@')) {
      const [value, component] = expr.split('@');
      const numVal = this.evaluateValue(value.trim());

      const componentMap: { [key: string]: keyof Coordinates } = {
        'x': 'x', '0': 'x',
        'y': 'y', '1': 'y',
        'w': 'w', '2': 'w',
        'h': 'h', '3': 'h',
        'ls': 'ls', '4': 'ls',
        'ts': 'ts', '5': 'ts',
        'rs': 'rs', '6': 'rs',
        'bs': 'bs', '7': 'bs',
      };

      const key = componentMap[component.trim()];
      if (key) {
        result[key] = numVal;
      }
    }

    return result;
  }
}

// ============================================================================
// LAYOUT BUILDER
// ============================================================================

export class LayoutBuilder {
  private layout: Layout;
  private engine: WalterExpressionEngine;

  constructor(name: string, parentW: number, parentH: number) {
    this.layout = {
      name,
      elements: {},
    };
    this.engine = new WalterExpressionEngine(parentW, parentH);
  }

  /**
   * Set an element with WALTER-style coordinates
   */
  set(elementName: string, coords: Coordinates, options?: Partial<UIElement>): this {
    this.layout.elements[elementName] = {
      name: elementName,
      position: coords,
      ...options,
    };
    return this;
  }

  /**
   * Clear an element's definition
   */
  clear(elementName: string): this {
    delete this.layout.elements[elementName];
    return this;
  }

  /**
   * Set color for an element
   */
  setColor(elementName: string, fg: RGBA, bg?: RGBA): this {
    if (this.layout.elements[elementName]) {
      this.layout.elements[elementName].color = { foreground: fg, background: bg };
    }
    return this;
  }

  /**
   * Set margins for an element
   */
  setMargin(elementName: string, margins: Margins): this {
    if (this.layout.elements[elementName]) {
      this.layout.elements[elementName].margin = margins;
    }
    return this;
  }

  /**
   * Set font for an element
   */
  setFont(elementName: string, font: FontStyle): this {
    if (this.layout.elements[elementName]) {
      this.layout.elements[elementName].font = font;
    }
    return this;
  }

  /**
   * Add responsive rule
   */
  addResponsiveRule(condition: string, elementName: string, adjustments: Partial<Coordinates>): this {
    if (!this.layout.responsiveRules) {
      this.layout.responsiveRules = [];
    }
    this.layout.responsiveRules.push({ condition, elementName, adjustments });
    return this;
  }

  /**
   * Build and return the layout
   */
  build(): Layout {
    return this.layout;
  }

  /**
   * Apply responsive adjustments based on current conditions
   */
  applyResponsiveAdjustments(): Layout {
    const adjusted = { ...this.layout };

    if (this.layout.responsiveRules) {
      for (const rule of this.layout.responsiveRules) {
        if (this.engine.evaluateCondition(rule.condition)) {
          const element = adjusted.elements[rule.elementName];
          if (element) {
            element.position = {
              ...element.position,
              ...rule.adjustments,
            };
          }
        }
      }
    }

    return adjusted;
  }
}

// ============================================================================
// COORDINATE HELPERS
// ============================================================================

export function coords(
  x: number = 0,
  y: number = 0,
  w: number = 0,
  h: number = 0,
  ls: number = 0,
  ts: number = 0,
  rs: number = 0,
  bs: number = 0
): Coordinates {
  return { x, y, w, h, ls, ts, rs, bs };
}

export function rgba(r: number, g: number, b: number, a: number = 255): RGBA {
  return { r, g, b, a };
}

export function margin(left: number, top: number, right: number, bottom: number, alignment?: number): Margins {
  return { left, top, right, bottom, alignment };
}

export function font(size: number, family: string, weight: 'normal' | 'bold' | 'italic' = 'normal', index: number = 0): FontStyle {
  return { size, family, weight, index };
}

// ============================================================================
// PRESET LAYOUTS
// ============================================================================

export const WALTER_PRESETS = {
  compact: (w: number, h: number): Layout => {
    return new LayoutBuilder('compact', w, h)
      .set('tcp.mute', coords(0, 0, 20, 20))
      .set('tcp.solo', coords(25, 0, 20, 20))
      .set('tcp.volume', coords(0, 25, 60, 100))
      .build();
  },

  standard: (w: number, h: number): Layout => {
    return new LayoutBuilder('standard', w, h)
      .set('tcp.label', coords(0, 0, w - 40, 24, 0, 0, 1, 0))
      .set('tcp.mute', coords(w - 40, 0, 20, 20, 1, 0, 1, 0))
      .set('tcp.solo', coords(w - 20, 0, 20, 20, 1, 0, 1, 0))
      .set('tcp.volume', coords(5, 30, w - 10, 80, 0, 0, 1, 0))
      .set('tcp.pan', coords(5, 115, w - 10, 40, 0, 0, 1, 0))
      .build();
  },

  extended: (w: number, h: number): Layout => {
    return new LayoutBuilder('extended', w, h)
      .set('tcp.label', coords(0, 0, w - 40, 24, 0, 0, 1, 0))
      .set('tcp.mute', coords(w - 40, 0, 20, 20, 1, 0, 1, 0))
      .set('tcp.solo', coords(w - 20, 0, 20, 20, 1, 0, 1, 0))
      .set('tcp.volume', coords(5, 30, w - 10, 60, 0, 0, 1, 0))
      .set('tcp.pan', coords(5, 95, w - 10, 40, 0, 0, 1, 0))
      .set('tcp.width', coords(5, 140, w - 10, 40, 0, 0, 1, 0))
      .set('tcp.meter', coords(5, 185, w - 10, 80, 0, 0, 1, 0))
      .build();
  },
};
