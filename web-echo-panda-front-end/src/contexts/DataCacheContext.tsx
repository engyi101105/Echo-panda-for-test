import React, { createContext, useContext, useState, ReactNode } from 'react';

interface DataCacheContextType {
  // Getters with automatic fetch
  getCachedData: <T>(key: string, fetchFn: () => Promise<T>) => Promise<T>;
  // Clear specific cache
  clearCache: (key: string) => void;
  // Check if data is loading
  isLoading: (key: string) => boolean;
}

interface CacheEntry<T = any> {
  data: T;
  loading: boolean;
}

const DataCacheContext = createContext<DataCacheContextType | undefined>(undefined);

export const DataCacheProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [cache, setCache] = useState<Map<string, CacheEntry>>(new Map());

  const getCachedData = async <T,>(key: string, fetchFn: () => Promise<T>): Promise<T> => {
    // If data exists in cache, return it
    const cached = cache.get(key);
    if (cached && !cached.loading) {
      console.log(`✅ Cache HIT for: ${key}`);
      return cached.data as T;
    }

    // If already loading, wait for it
    if (cached?.loading) {
      console.log(`⏳ Already loading: ${key}`);
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          const current = cache.get(key);
          if (current && !current.loading) {
            clearInterval(checkInterval);
            resolve(current.data as T);
          }
        }, 50);
      });
    }

    console.log(`❌ Cache MISS for: ${key} - Fetching...`);
    // Mark as loading
    setCache(prev => new Map(prev).set(key, { data: null, loading: true }));

    try {
      // Fetch fresh data
      const data = await fetchFn();
      
      // Store in cache
      setCache(prev => new Map(prev).set(key, { data, loading: false }));
      console.log(`💾 Cached: ${key}`);
      
      return data;
    } catch (error) {
      // Remove loading state on error
      setCache(prev => {
        const newCache = new Map(prev);
        newCache.delete(key);
        return newCache;
      });
      throw error;
    }
  };

  const clearCache = (key: string) => {
    setCache(prev => {
      const newCache = new Map(prev);
      newCache.delete(key);
      return newCache;
    });
  };

  const isLoading = (key: string): boolean => {
    return cache.get(key)?.loading || false;
  };

  return (
    <DataCacheContext.Provider value={{ getCachedData, clearCache, isLoading }}>
      {children}
    </DataCacheContext.Provider>
  );
};

export const useDataCache = () => {
  const context = useContext(DataCacheContext);
  if (!context) {
    throw new Error('useDataCache must be used within DataCacheProvider');
  }
  return context;
};
