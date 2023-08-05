import { RuntimeValue } from "./Values.ts";

type RuntimeEnvBindings = { [key: string]: RuntimeValue };

export class Env {
  private bindings: RuntimeEnvBindings;

  constructor(
    bindings: RuntimeEnvBindings = {},
  ) {
    this.bindings = bindings;
  }

  bind(name: string, value: RuntimeValue): Env {
    this.bindings[name] = value;

    return this;
  }

  has(name: string): boolean {
    return Object.hasOwn(this.bindings, name);
  }

  get(name: string): RuntimeValue {
    const v = this.bindings[name];

    if (v === undefined) {
      throw { type: "UnknownName", name };
    } else {
      return v;
    }
  }

  clone(): Env {
    return new Env({ ...this.bindings });
  }

  names(): Array<string> {
    return Object.keys(this.bindings);
  }
}

export const emptyEnv = (): Env => new Env();
