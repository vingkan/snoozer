export function nullIfEmpty(raw: string): string | null {
  const trimmed = raw.trim();
  return trimmed.length === 0 ? null : trimmed;
}

export function estimateSizeInMb(text: string): number {
  const encoded = new TextEncoder().encode(text);
  return encoded.length / 1024 / 1024;
}
