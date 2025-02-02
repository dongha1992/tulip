import { useState } from 'react';

let idCount = 0;

export function generateId(prefix = 'tulip-id-') {
  idCount = idCount + 1;
  return `${prefix}${idCount}`;
}

export default function useId(prefix?: string) {
  const [id] = useState(() => generateId(prefix));

  return id;
}
