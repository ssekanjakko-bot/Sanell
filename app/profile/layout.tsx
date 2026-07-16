'use client'
import { useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, type User } from "firebase/auth";
import { auth } from "@/lib/firebase";

export default function ProfileLayout({ children }: { children: ReactNode }) {
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setLoading(false);
      
      if (!u) {
        // ADD?redirect= here
        router.push("/sell?redirect=/profile");
      }
    });
    return () => unsub();
  }, [router]);

  if (loading) return <div className="p-10 text-center">Loading profile...</div>;
  return <>{children}</>;
}