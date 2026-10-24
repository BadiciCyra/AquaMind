/**
 * Capitalizes the first letter of each word using Turkish locale ('tr-TR').
 * Correctly handles Turkish characters like i -> İ, ı -> I, ç -> Ç, ş -> Ş, ğ -> Ğ, ü -> Ü, ö -> Ö.
 */
export function toTurkishTitleCase(str: string): string {
  if (!str) return '';
  return str
    .split(' ')
    .map((word) => {
      if (!word) return '';
      const firstChar = word.charAt(0).toLocaleUpperCase('tr-TR');
      const rest = word.slice(1);
      return firstChar + rest;
    })
    .join(' ');
}
