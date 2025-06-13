"use client";
import { useAuth } from "../../context/auth-context";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login"); // redirect to login if not signed in
    }
  }, [user, loading, router]);

  if (loading || !user) return <p>Loading...</p>;

  return children;
}
