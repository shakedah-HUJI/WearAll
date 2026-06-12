"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    if (data.user) {
      // Save name via API so it uses the service client (bypasses RLS)
      await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ display_name: name.trim() }),
      });
    }

    window.location.href = "/closet/upload";
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#F9FAFB] px-6 pt-20 pb-10">
      <div className="mb-10">
        <h1 className="font-sans font-bold text-[2.1rem] leading-tight text-[#111111]">
          Build your closet
        </h1>
        <p className="text-[#6B7280] mt-1">
          Start by creating your account
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#111111]">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className="w-full px-4 py-3 rounded-[14px] border border-[#E5E7EB] bg-white text-[#111111] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent"
            placeholder="Sofia"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#111111]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className="w-full px-4 py-3 rounded-[14px] border border-[#E5E7EB] bg-white text-[#111111] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent"
            placeholder="you@example.com"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-[#111111]">Password</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full px-4 py-3 rounded-[14px] border border-[#E5E7EB] bg-white text-[#111111] placeholder-[#6B7280] focus:outline-none focus:ring-2 focus:ring-[#111111] focus:border-transparent"
            placeholder="At least 6 characters"
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
          className="mt-2 w-full py-3.5 rounded-full bg-gradient-to-br from-[#111111] to-[#333333] text-white font-semibold text-base disabled:opacity-60 active:scale-[0.98] transition-all shadow-[0_4px_20px_rgba(17,17,17,0.38)]"
        >
          {loading ? "Creating account…" : "Get started"}
        </button>
      </form>

      <p className="mt-8 text-center text-sm text-[#6B7280]">
        Already have an account?{" "}
        <Link href="/login" className="text-[#111111] font-medium">
          Sign in
        </Link>
      </p>
    </div>
  );
}
