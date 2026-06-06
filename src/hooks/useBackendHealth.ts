import { useState, useEffect, useCallback } from 'react';

export type BackendStatus = 'checking' | 'online' | 'offline';

export function useBackendHealth() {
  const [status, setStatus] = useState<BackendStatus>('checking');
  const [checkTrigger, setCheckTrigger] = useState(0);

  const checkBackend = useCallback(async () => {
    let active = true;
    const check = async () => {
      setStatus('checking');
      try {
        const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1';
        const healthUrl = apiBase.endsWith('/api/v1') 
          ? apiBase.replace('/api/v1', '/health') 
          : `${apiBase}/health`;
          
        const res = await fetch(healthUrl);
        if (active) {
          if (res.ok) {
            setStatus('online');
          } else {
            setStatus('offline');
          }
        }
      } catch {
        if (active) {
          setStatus('offline');
        }
      }
    };
    
    // Call asynchronously to avoid setting state synchronously in useEffect
    void Promise.resolve().then(check);
    
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const cleanup = checkBackend();
    return () => {
      cleanup.then(fn => fn());
    };
  }, [checkTrigger, checkBackend]);

  const recheck = useCallback(() => {
    setCheckTrigger(prev => prev + 1);
  }, []);

  return { status, recheck };
}
