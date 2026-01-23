'use client';

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";

/**
 * Custom hook for pages that require authentication.
 * Unauthenticated users are automatically redirected to the home page ('/').
 *
 * @returns { isAuthenticated, loading } - Loading state and authentication state
 */
export default function useRequireAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const response = await axios.get("/api/auth/check");
        const authenticated = response.data.authenticated || false;
        setIsAuthenticated(authenticated);
        
        // Redirect to home if not authenticated
        if (!authenticated) {
          router.push("/");
          return;
        }
      } catch (error) {
        setIsAuthenticated(false);
        router.push("/");
        return;
      } finally {
        setLoading(false);
      }
    }

    checkAuth();
  }, [router]);

  return { loading, isAuthenticated };
}

