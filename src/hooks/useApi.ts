"use client";

// Generic API hook for data fetching
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseApiOptions {
  immediate?: boolean;
  dependencies?: any[];
}

export const useApi = <T>(
  apiCall: () => Promise<T>,
  options: UseApiOptions = {}
) => {
  const { immediate = true, dependencies = [] } = options;
  
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiCallRef = useRef(apiCall);

  // Update the ref when apiCall changes
  useEffect(() => {
    apiCallRef.current = apiCall;
  }, [apiCall]);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await apiCallRef.current();
      setData(result);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array to prevent infinite loops

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate, ...dependencies]);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    refetch,
    setData,
    setError,
  };
};

// Hook for multiple API calls
export const useMultipleApi = <T extends Record<string, any>>(
  apiCalls: T,
  options: UseApiOptions = {}
) => {
  const { immediate = true, dependencies = [] } = options;
  
  const [data, setData] = useState<Partial<Record<keyof T, any>>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const apiCallsRef = useRef(apiCalls);

  // Update the ref when apiCalls changes
  useEffect(() => {
    apiCallsRef.current = apiCalls;
  }, [apiCalls]);

  const execute = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const results = await Promise.allSettled(
        Object.entries(apiCallsRef.current).map(async ([key, apiCall]) => {
          const result = await apiCall();
          return [key, result];
        })
      );

      const newData: Partial<Record<keyof T, any>> = {};
      const errors: string[] = [];

      results.forEach((result, index) => {
        const key = Object.keys(apiCallsRef.current)[index] as keyof T;
        
        if (result.status === 'fulfilled') {
          newData[key] = result.value[1];
        } else {
          errors.push(`${String(key)}: ${result.reason}`);
        }
      });

      setData(newData);
      
      if (errors.length > 0) {
        setError(errors.join(', '));
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An error occurred';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []); // Empty dependency array to prevent infinite loops

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [execute, immediate, ...dependencies]);

  const refetch = useCallback(() => {
    return execute();
  }, [execute]);

  return {
    data,
    loading,
    error,
    refetch,
    setData,
    setError,
  };
};
