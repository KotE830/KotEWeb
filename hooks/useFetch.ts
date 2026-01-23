'use client';

import { useEffect, useState } from "react";

export default function useFetch<T = any[]>(url: string) {
  const [data, setData] = useState<T>([] as T);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    setLoading(true);
    const apiUrl = process.env.NEXT_PUBLIC_API_URL 
      ? `${process.env.NEXT_PUBLIC_API_URL}${url}`
      : url;
    
    fetch(apiUrl)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        setData(data);
      })
      .catch((err) => {
        console.error("Fetch error:", err);
        setData([] as T);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [url]);

  return { data, loading };
}

