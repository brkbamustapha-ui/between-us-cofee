/**
 * Conversion camelCase ↔ snake_case entre le modèle TypeScript et les colonnes
 * PostgreSQL. Les noms de champs sont volontairement choisis pour que la
 * conversion soit sans ambiguïté (`imageUrl` ⇄ `image_url`, `categoryId` ⇄
 * `category_id`, `isPlaceholder` ⇄ `is_placeholder`…).
 */

export function toSnakeKey(key: string): string {
  return key.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);
}

export function toCamelKey(key: string): string {
  return key.replace(/_([a-z0-9])/g, (_match, letter: string) =>
    letter.toUpperCase(),
  );
}

/** Convertit les clés d'un objet plat vers snake_case (valeurs inchangées). */
export function toSnakeRow(
  input: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    if (value === undefined) continue;
    out[toSnakeKey(key)] = value;
  }
  return out;
}

/** Convertit les clés d'une ligne SQL vers camelCase. */
export function toCamelRow<T>(input: Record<string, unknown>): T {
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(input)) {
    out[toCamelKey(key)] = value;
  }
  return out as T;
}

export function toCamelRows<T>(input: Record<string, unknown>[]): T[] {
  return input.map((row) => toCamelRow<T>(row));
}
