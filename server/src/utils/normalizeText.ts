// Flattens any input (string, array, object) into a plain string for chunking/claim extraction
export function normalizeToPlainText(input: unknown): string {
  if (typeof input === "string") return input;
  if (Array.isArray(input)) return input.map(normalizeToPlainText).join(" ");
  if (input && typeof input === "object") {
    // Recursively extract all string values from any nested object
    let result = "";
    for (const value of Object.values(input)) {
      result += " " + normalizeToPlainText(value);
    }
    return result.trim();
  }
  return input != null ? String(input) : "";
}
