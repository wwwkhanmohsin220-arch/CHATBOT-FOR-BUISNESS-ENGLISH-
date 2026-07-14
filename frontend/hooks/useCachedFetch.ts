import { useState, useEffect } from 'react';

// A simple global memory cache that persists across page navigations (SPA)
const fetchCache = new Map<string, any>();

// Utility to invalidate/clear cache if needed
export function invalidateCache(url?: string) {
  if (url) {
    fetchCache.delete(url);
  } else {
    fetchCache.clear();
  }
}

export function useCachedFetch<T = any>(url: string | null) {
  const [data, setData] = useState<T | null>(url ? (fetchCache.get(url) || null) : null);
  const [loading, setLoading] = useState<boolean>(url ? !fetchCache.has(url) : false);

  useEffect(() => {
    if (!url) return;

    let mounted = true;
    
    // Background fetch to update cache and state
    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((result) => {
        fetchCache.set(url, result);
        if (mounted) {
          setData(result);
          // If this was a fast load and we were already loading, stop loading
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error(`useCachedFetch failed for ${url}:`, err);
        if (mounted) {
          setLoading(false);
        }
      });

    return () => {
      mounted = false;
    };
  }, [url]);

  return { data, loading };
}
