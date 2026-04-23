import { useEffect, useState } from 'react';

import { initDatabase } from '@/database/client';
import { seedDatabaseIfEmpty } from '@/database/seed';

type BootstrapState = {
  isReady: boolean;
  error: string | null;
};

export function useAppBootstrap(): BootstrapState {
  const [state, setState] = useState<BootstrapState>({
    isReady: false,
    error: null,
  });

  useEffect(() => {
    let isMounted = true;

    async function bootstrap() {
      try {
        await initDatabase();
        await seedDatabaseIfEmpty();

        if (isMounted) {
          setState({
            isReady: true,
            error: null,
          });
        }
      } catch (error) {
        if (isMounted) {
          setState({
            isReady: false,
            error: error instanceof Error ? error.message : 'Erro ao inicializar o app',
          });
        }
      }
    }

    bootstrap();

    return () => {
      isMounted = false;
    };
  }, []);

  return state;
}
