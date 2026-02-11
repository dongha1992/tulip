function safeNum(x: unknown): number | undefined {
  return typeof x === 'number' && Number.isFinite(x) ? x : undefined;
}

function clamp01(x: number): number {
  return Math.max(0, Math.min(1, x));
}

function normalizePctMaybe(p?: number): number | undefined {
  if (p == null) return undefined;
  // 혹시 0~100로 오면 0~1로
  const v = p > 1 ? p / 100 : p;
  // guard
  if (!Number.isFinite(v)) return undefined;
  return Math.max(0, Math.min(1, v));
}

function roundShares(x: number): number {
  return Math.round(x);
}

function formatPct01(p?: number): string {
  if (p == null || !Number.isFinite(p)) return 'n/a';
  return `${(p * 100).toFixed(2)}%`;
}

function formatShares(n?: number): string {
  if (n == null || !Number.isFinite(n)) return 'n/a';
  const abs = Math.abs(n);

  if (abs >= 1e12) return `${(n / 1e12).toFixed(2)}T`;
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(2)}K`;
  return `${Math.round(n).toLocaleString()}`;
}

export {
  clamp01,
  formatPct01,
  formatShares,
  normalizePctMaybe,
  roundShares,
  safeNum
};

