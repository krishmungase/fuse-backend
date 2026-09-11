type DynamicImport = <T>(specifier: string) => Promise<T>;

const dynamicImport = new Function(
  "specifier",
  "return import(specifier)",
) as DynamicImport;

export const importAiSdk = () => dynamicImport<typeof import("ai")>("ai");
