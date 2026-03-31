import { useState, useEffect } from 'react';
import { initialStore, STORAGE_KEY } from '../types';
import type { Store } from '../types';

export function useStore() {
  const [store, setStore] = useState<Store>(() => {
    try {
      const item = window.localStorage.getItem(STORAGE_KEY);
      return item ? JSON.parse(item) : initialStore;
    } catch (error) {
      console.error(error);
      return initialStore;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (error) {
      console.error(error);
    }
  }, [store]);

  return { store, setStore };
}
