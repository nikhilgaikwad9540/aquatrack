"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { signInWithPopup, onAuthStateChanged } from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";

export default function LoginPage() {
  const router = useRouter();

  const handleGoogleSignIn = async () => {
    try {
      await signInWithPopup(auth, googleProvider);
      // Login successful, redirect to home
      router.push("/");
    } catch (error) {
      console.error("Google sign-in error:", error);
      alert("Sign-in failed. Please try again.");
    }
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        // User already logged in, redirect to home
        router.push("/");
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <div className="flex justify-center items-center min-h-screen bg-blue-50">
      <div className="bg-white shadow-lg p-8 rounded-lg">
        <h1 className="text-2xl font-semibold mb-6 text-center">
          👋 Welcome to AquaTrack
        </h1>
        <button
          onClick={handleGoogleSignIn}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded"
        >
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
