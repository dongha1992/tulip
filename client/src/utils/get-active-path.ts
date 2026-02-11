import { closest } from 'fastest-levenshtein';

export const getActivePath = (
  path: string,
  paths: string[],
  ignorePaths?: string[],
) => {
  const ignored = ignorePaths ?? [];
  const candidates = paths.filter((p) => !ignored.includes(p));

  if (candidates.length === 0) {
    return { activeIndex: -1, activePath: null as string | null };
  }

  const closestPath = closest(path, candidates);
  const index = paths.indexOf(closestPath);

  if (index === -1 || ignored.includes(closestPath)) {
    return { activeIndex: -1, activePath: null as string | null };
  }

  return { activeIndex: index, activePath: closestPath };
};
