import { useEffect, useState } from "react";

export default function usePersistedArray<T>(
  persistKey: string
): [T[], (entry: T) => void, (index: number) => void] {
  const [array, setArray] = useState<T[]>([]);
  useEffect(() => {
    const persistedArray = window.localStorage.getItem(persistKey) || "[]";
    setArray(JSON.parse(persistedArray));
  }, [persistKey]);

  const setAndPersistArray = (action: (oldEntries: T[]) => T[]) => {
    setArray((oldArray) => {
      const newArray = action(oldArray);
      window.localStorage.setItem(persistKey, JSON.stringify(newArray));
      return newArray;
    });
  };

  const add = (entry: T) => setAndPersistArray((_) => [..._, entry]);
  const remove = (index: number) =>
    setAndPersistArray((_) => {
      const ret = [..._];
      ret.splice(index, 1);
      return ret;
    });

  return [array, add, remove];
}
