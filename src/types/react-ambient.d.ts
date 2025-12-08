declare module 'react' {
  export type ReactNode = any;
  export function useState<T>(initial: T | (() => T)): [T, (v: T | ((prev: T) => T)) => void];
  export function useRef<T>(initial: T | null): { current: T | null };
  export function useEffect(effect: () => (void | (() => void)), deps?: any[]): void;
  export const Fragment: any;
  export type FC<P = {}> = (props: P & { children?: ReactNode }) => ReactNode;
  export default {} as any;
  export interface ChangeEvent<T = any> { target: T }
}
