// Minimal JSX runtime types used by the custom createElement

export type JsxValue = string | number | boolean | null | undefined | Node | ReadonlyArray<JsxValue> | InjectValue | DomElement;

export type DomElement = HTMLElement | SVGElement;

// Minimal interfaces for Inject.* used by createElement
export interface InjectValue {
  value: unknown;
  addTarget: (target: Node) => void;
}

export interface InjectAttribute {
  addTarget: (el: DomElement, key: string) => void;
}

export interface InjectRef {
  addTarget: (el: DomElement) => void;
}

export interface InjectClassList {
  addTarget: (el: DomElement) => void;
}

// Export a placeholder type aggregation for imports elsewhere
export const Inject = {
  Value: class {},
  Attribute: class {},
  Ref: class {},
  ClassList: class {}
};
