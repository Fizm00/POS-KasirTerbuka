import idDictionary from "./id.json";

type Dictionary = typeof idDictionary;

type NestedKeyOf<ObjectType extends object> = {
  [Key in keyof ObjectType & (string | number)]: ObjectType[Key] extends object
    ? `${Key}` | `${Key}.${NestedKeyOf<ObjectType[Key]>}`
    : `${Key}`;
}[keyof ObjectType & (string | number)];

export type TranslationKey = NestedKeyOf<Dictionary>;

/**
 * Access a nested value in an object using dot notation.
 */
function getNestedValue(obj: Record<string, unknown>, path: string): unknown {
  return path.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, obj);
}

/**
 * Translate a key into the corresponding string from the Indonesian dictionary.
 * Supports placeholder interpolation, e.g. {{name}}.
 */
export function t(
  key: TranslationKey | (string & {}),
  params?: Record<string, string | number>
): string {
  const value = getNestedValue(idDictionary as Record<string, unknown>, key);

  if (typeof value !== "string") {
    return key;
  }

  if (!params) {
    return value;
  }

  return Object.entries(params).reduce<string>((acc, [paramKey, paramValue]) => {
    return acc.replace(new RegExp(`{{\\s*${paramKey}\\s*}}`, "g"), String(paramValue));
  }, value);
}

export default idDictionary;
