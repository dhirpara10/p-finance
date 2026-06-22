"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Mode = "signin" | "signup" | "forgot";

export default function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");
    setLoading(true);

    try {
      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        window.location.href = "/";
      } else if (mode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("Check your email for a confirmation link, then sign in.");
        setMode("signin");
      } else {
        const { error } = await supabase.auth.resetPasswordForEmail(email);
        if (error) throw error;
        setMessage("Password reset email sent. Check your inbox.");
        setMode("signin");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#0a0a0f] px-4">
      {/* Logo / title */}
      <div className="mb-8 text-center">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500/30 to-fuchsia-500/20 text-3xl ring-1 ring-purple-400/20">
          💰
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-white">PFT</h1>
        <p className="mt-1 text-sm text-neutral-500">Personal Finance Tracker</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-sm rounded-3xl border border-white/[0.07] bg-neutral-900/80 p-7 backdrop-blur-sm">
        <h2 className="mb-6 text-center text-base font-semibold text-neutral-100">
          {mode === "signin" ? "Welcome back" : mode === "signup" ? "Create your account" : "Reset password"}
        </h2>

        {message && (
          <div className="mb-4 rounded-xl border border-emerald-400/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-300">
            {message}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-neutral-400">Email</label>
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/20 placeholder:text-neutral-600"
            />
          </div>

          {mode !== "forgot" && (
            <div>
              <label className="mb-1.5 block text-xs font-medium text-neutral-400">Password</label>
              <input
                type="password"
                required
                autoComplete={mode === "signup" ? "new-password" : "current-password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                minLength={6}
                className="w-full rounded-xl border border-white/10 bg-white/[0.05] px-3.5 py-2.5 text-sm text-white outline-none transition focus:border-purple-400/40 focus:ring-1 focus:ring-purple-400/20 placeholder:text-neutral-600"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 w-full rounded-xl bg-purple-600 py-2.5 text-sm font-medium text-white transition hover:bg-purple-500 disabled:opacity-50"
          >
            {loading
              ? "Please wait…"
              : mode === "signin"
                ? "Sign in"
                : mode === "signup"
                  ? "Create account"
                  : "Send reset email"}
          </button>
        </form>

        <div className="mt-5 space-y-2 text-center text-xs text-neutral-500">
          {mode === "signin" && (
            <>
              <button onClick={() => { setMode("signup"); setError(""); }} className="block w-full hover:text-neutral-300">
                No account? <span className="text-purple-400">Sign up</span>
              </button>
              <button onClick={() => { setMode("forgot"); setError(""); }} className="block w-full hover:text-neutral-300">
                Forgot password?
              </button>
            </>
          )}
          {(mode === "signup" || mode === "forgot") && (
            <button onClick={() => { setMode("signin"); setError(""); }} className="hover:text-neutral-300">
              ← Back to sign in
            </button>
          )}
        </div>
      </div>

      <p className="mt-6 text-xs text-neutral-600">Your data is private and encrypted.</p>
    </div>
  );
}
