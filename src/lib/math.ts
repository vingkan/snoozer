export function nullishSum(
  a: number | null | undefined,
  b: number | null | undefined
): number {
  return (a ?? 0) + (b ?? 0);
}

export function nullishDivide(
  a: number | null | undefined,
  b: number | null | undefined
): number {
  if (b === 0 || b == null) {
    return 0;
  }
  return (a ?? 0) / b;
}
