import { useId as useReactId } from 'react';

export default function useId(prefix?: string) {
  const reactId = useReactId();
  return prefix ? `${prefix}-${reactId}` : reactId;
}
