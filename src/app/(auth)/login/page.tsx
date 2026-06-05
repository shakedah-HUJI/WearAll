"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      // Small delay to ensure session cookie is written before navigating
      await new Promise((r) => setTimeout(r, 500));
      window.location.replace("/home");
    }
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#FBF7F2] px-6 pt-20 pb-10">
      <div className="mb-10">
        <h1 className="text-3xl font-semibold text-[#2B2622] tracking-tight">
          Welcome back
        </h1>
        <p className="text-[#8A817A] mt-1">Sign in to your closet</p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#2B2622]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 rounded-[14px] border border-[#ECE6DF] bg-white text-[#2B2622] placeholder-[#8A817A] focus:outline-none focus:ring-2 focus:ring-[#C97B5A] focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#2B2622]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            className="w-full px-4 py-3 rounded-[14px] border border-[#ECE6DF] bg-white text-[#2B2622] placeholder-[#8A817A] focus:outline-none focus:ring-2 focus:ring-[#C97B5A] focus:border-transparent"
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-sm text-red-500 bg-red-50 px-4 py-2 rounded-[10px]">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-2 w-full py-3.5 rounded-full bg-[#C97B5A] text-white font-semibold text-base disabled:opacity-60 active:scale-[0.98] transition-transform"
        >
          {loading ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#8A817A]">
        New here?{" "}
        <Link href="/signup" className="text-[#C97B5A] font-medium">
          Create an account
        </Link>
      </p>
    </div>
  );
}
