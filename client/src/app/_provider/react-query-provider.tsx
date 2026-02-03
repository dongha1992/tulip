'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useState } from 'react';

const makeQueryClient = () =>
  new QueryClient({
    defaultOptions: {
      queries: { staleTime: 60 * 1000 },
    },
  });

type ReactQueryProviderProps = {
  children: React.ReactNode;
};

const ReactQueryProvider = ({ children }: ReactQueryProviderProps) => {
  const [queryClient] = useState(() => makeQueryClient());

  return (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

export { ReactQueryProvider };
