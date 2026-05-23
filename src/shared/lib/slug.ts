/**
 * Conservative URL/filename slugifier. Folds diacritics, lowercases,
 * collapses non-alphanumerics to hyphens, trims edges, caps at 60 chars,
 * and falls back to "character" if everything was stripped.
 */
export function slugify(input: string): string {
  const stripped = input
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
  return stripped || "character";
}
