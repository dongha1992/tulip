import { closest } from 'fastest-levenshtein';

export const getActivePath = (
  path: string,
  paths: string[],
  ignorePaths?: string[],
) => {
  //TODO: 임시
  if (path.startsWith('/stocks')) {
    return { activeIndex: 0, activePath: '/' };
  }
  const closestPath = closest(path, paths.concat(ignorePaths || []));
  const index = paths.indexOf(closestPath);

  return { activeIndex: index, activePath: closestPath };
};
