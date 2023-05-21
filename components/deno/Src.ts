export class Src {
  private name: string;

  constructor(name: string) {
    this.name = name;
  }

  urn(): string {
    return this.name;
  }

  newSrc(name: string): Src {
    if (this.name.endsWith("/")) {
      return from(name, this.name);
    } else {
      return from(name, dropLastComponent(this.name));
    }
  }
}

const dropLastComponent = (n: string): string => {
  const idx = n.lastIndexOf("/");

  if (idx === -1) {
    return n;
  } else {
    return n.substring(0, idx);
  }
};

export const from = (name: string, base: string = Deno.cwd()): Src => {
  if (
    name.startsWith("http:") || name.startsWith("https:") ||
    name.startsWith("/")
  ) {
    return new Src(name);
  }

  while (true) {
    if (name.startsWith("./")) {
      name = name.substring(2);
    } else if (name.startsWith("../")) {
      name = name.substring(3);
      base = dropLastComponent(base);
    } else if (base.endsWith("/")) {
      return new Src(`${base}${name}`);
    } else {
      return new Src(`${base}/${name}`);
    }
  }
};

export const home = (): Src => new Src(`${Deno.cwd()}/`);
