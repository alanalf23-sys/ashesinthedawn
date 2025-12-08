export const canWrite = (el: any, key: string) => (key in el);
export const isDefined = (v: any) => v !== null && v !== undefined;
export const panic = (msg: string) => { throw new Error(msg) };
export const safeWrite = (obj: any, key: string, value: any) => { try { obj[key] = value } catch {} };
export type Procedure<T> = (arg: T) => void;
