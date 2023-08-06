import { Expression } from "./Parser.ts";
import { TTuple, Type, TypeEnv } from "./Typing.ts";

// deno-lint-ignore no-explicit-any
export type RuntimeValue = any;

export type ImportValues = Map<string, [RuntimeValue, Type]>;
export type ImportPackage = {
  values: ImportValues;
  types: TypeEnv;
};

export type ImportEnv = { [key: string]: ImportPackage };

export const emptyImportEnv = (): ImportEnv => ({});

export class VChar {
  value: number;

  constructor(value: number) {
    this.value = value;
  }
}

export const mkChar = (value: number | string): RuntimeValue => {
  if (typeof value === "string") {
    return new VChar(value.charCodeAt(0));
  }
  return new VChar(value);
};

export const isChar = (value: RuntimeValue): boolean => value instanceof VChar;

class VTuple {
  values: Array<RuntimeValue>;

  constructor(values: Array<RuntimeValue>) {
    this.values = values;
  }
}

export const mkTuple = (values: Array<RuntimeValue>): RuntimeValue => new VTuple(values);

export const isTuple = (value: RuntimeValue): boolean => value instanceof VTuple;

export const tupleComponent = (value: RuntimeValue, index: number): RuntimeValue => value.values[index];

export const tupleComponents = (value: RuntimeValue): Array<RuntimeValue> => value.values;

export const equals = (v1: RuntimeValue, v2: RuntimeValue): boolean => {
  if (v1 === v2) {
    return true;
  }

  if (isTuple(v1) && isTuple(v2)) {
    if (v1.values.length !== v2.values.length) {
      return false;
    }
    for (let i = 0; i < v1.values.length; i++) {
      if (!equals(v1.values[i], v2.values[i])) {
        return false;
      }
    }
    return true;
  }
  if (Array.isArray(v1) && Array.isArray(v2)) {
    if (v1.length !== v2.length) {
      return false;
    }
    for (let i = 0; i < v1.length; i++) {
      if (!equals(v1[i], v2[i])) {
        return false;
      }
    }
    return true;
  }
  if (v1 instanceof RegExp && v2 instanceof RegExp) {
    return v1.toString() === v2.toString();
  }
  if (typeof v1 === "object" && typeof v2 === "object") {
    const fields1 = Object.entries(v1).sort();
    const fields2 = Object.entries(v2).sort();

    if (fields1.length !== fields2.length) {
      return false;
    }

    for (let i = 0; i < fields1.length; i++) {
      if (fields1[i][0] !== fields2[i][0]) {
        return false;
      }
      if (!equals(fields1[i][1], fields2[i][1])) {
        return false;
      }
    }

    return true;
  }

  return false;
};

export const valueToString = (v: RuntimeValue): string => {
  if (v === null) {
    return "()";
  }
  if (typeof v === "string") {
    return `"${v.replaceAll('"', '\\"')}"`;
  }
  if (typeof v === "boolean") {
    return v ? "True" : "False";
  }
  if (typeof v === "number") {
    return `${v}`;
  }
  if (typeof v === "function") {
    return "function";
  }
  if (isChar(v)) {
    if (v.value === 10) {
      return "'\\n'";
    }
    if (v.value === 39 || v.value === 92) {
      return `'\\${String.fromCharCode(v.value)}'`;
    }
    if (v.value < 32) {
      return `'\\u{${v.value.toString(16)}}'`;
    }
    return `'${String.fromCharCode(v.value)}'`;
  }
  if (isTuple(v)) {
    return `(${tupleComponents(v).map((v: RuntimeValue) => valueToString(v)).join(", ")})`;
  }
  if (Array.isArray(v)) {
    if (v[0] === "Nil") {
      return "[]";
    }
    if (v[0] === "Cons") {
      const result = [];
      let current = v;
      while (current[0] === "Cons") {
        result.push(current[1]);
        current = current[2];
      }

      return `[${result.map((v: RuntimeValue) => valueToString(v)).join(", ")}]`;
    }
    if (v.length === 1) {
      return v[0];
    } else {
      const param = (p: RuntimeValue): string =>
        (Array.isArray(p) && p.length > 1 && p[0] !== "Nil" && p[0] !== "Cons")
          ? `(${valueToString(p)})`
          : valueToString(p);

      return `${v[0]} ${v.slice(1).map((v: RuntimeValue) => param(v)).join(" ")}`;
    }
  }
  if (v instanceof RegExp) {
    return v.toString();
  }
  if (typeof v === "object") {
    const fields = Object.entries(v).sort();

    if (fields.length === 0) {
      return "{}";
    }

    const result: Array<string> = [];
    let isFirst = true;
    result.push("{ ");
    for (const [k, v] of fields) {
      if (isFirst) {
        isFirst = false;
      } else {
        result.push(", ");
      }

      result.push(`${k}: ${valueToString(v)}`);
    }
    result.push(" }");

    return result.join("");
  }

  return `${v}`;
};

export type NestedString = string | Array<NestedString>;

export const expressionToNestedString = (value: RuntimeValue, type: Type, expr: Expression): NestedString =>
  ((expr.type === "Let" || expr.type === "LetRec") && type instanceof TTuple)
    ? expr.declarations.map((d, i) => `${d.name} = ${valueToString(value[i])}: ${type.types[i]}`)
    : `${valueToString(value)}: ${type}`;

export const nestedStringToString = (s: NestedString): string =>
  Array.isArray(s) ? s.map(nestedStringToString).join("\n") : s;
