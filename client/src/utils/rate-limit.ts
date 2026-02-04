const ipCount = new Map<string, number[]>();
const LIMIT = 10;
const WINDOW = 60_000;

export function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const timestamps = ipCount.get(ip) || [];
  const recent = timestamps.filter((t) => now - t < WINDOW);
  if (recent.length >= LIMIT) return false;
  recent.push(now);
  ipCount.set(ip, recent);
  return true;
}
