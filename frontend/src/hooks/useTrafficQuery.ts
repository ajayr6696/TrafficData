import { useEffect, useState } from 'react';

type QueryState<T> = {
  data: T | null;
  isLoading: boolean;
  error: string | null;
};

export const useTrafficQuery = <T,>(
  queryFn: () => Promise<T>,
  dependencies: React.DependencyList,
  enabled = true,
) => {
  const [state, setState] = useState<QueryState<T>>({
    data: null,
    isLoading: enabled,
    error: null,
  });

  useEffect(() => {
    let isCurrent = true;

    if (!enabled) {
      setState((current) => ({ ...current, isLoading: false }));
      return () => {
        isCurrent = false;
      };
    }

    setState((current) => ({ ...current, isLoading: true, error: null }));

    queryFn()
      .then((data) => {
        if (isCurrent) {
          setState({ data, isLoading: false, error: null });
        }
      })
      .catch((error: unknown) => {
        if (isCurrent) {
          setState({
            data: null,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Unable to load data',
          });
        }
      });

    return () => {
      isCurrent = false;
    };
  }, dependencies);

  return state;
};
