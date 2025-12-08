// Minimal implementations for Inject helpers used by createElement runtime

export class Value {
  value: unknown;
  private targets: Node[] = [];
  constructor(value: unknown) { this.value = value }
  addTarget(target: Node) { this.targets.push(target) }
}

export class Attribute {
  private targets: Array<{el: Element, key: string}> = [];
  addTarget(el: Element, key: string) { this.targets.push({el, key}) }
}

export class Ref {
  private targets: Element[] = [];
  addTarget(el: Element) { this.targets.push(el) }
}

export class ClassList {
  private targets: Element[] = [];
  addTarget(el: Element) { this.targets.push(el) }
}

export const Inject = { Value, Attribute, Ref, ClassList };
