import { useState, useEffect } from 'react';
import { referralsService } from '../services/referrals.service';

export function useReferrals() {
  const [data, setData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let isMounted = true;
    const fetchStats = async () => {
      setIsLoading(true);
      try {
        const stats = await referralsService.getMyStats();
        if (isMounted) setData(stats);
      } catch (err) {
        if (isMounted) setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };
    fetchStats();
    return () => { isMounted = false; };
  }, []);

  return { data, isLoading, error };
}
