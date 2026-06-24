"use client";

import { useState } from "react";
import { Copy, RefreshCw, Check, Smartphone } from "lucide-react";
import type { FinanceDashboardState } from "@/components/dashboard/useFinanceDashboard";
import { SettingsPanel, Field } from "./SettingsAccountsPage";
import { saveSetting } from "@/lib/sheetsApi";

type Props = { state: FinanceDashboardState };

export function SettingsShortcutPage({ state }: Props) {
  const [token, setToken] = useState<string>(state.shortcutToken ?? "");
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  const apiUrl = typeof window !== "undefined" ? `${window.location.origin}/api/quick-add` : "/api/quick-add";

  async function generateToken() {
    const newToken = Array.from(crypto.getRandomValues(new Uint8Array(24)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");
    setSaving(true);
    await saveSetting("shortcut_token", newToken);
    setToken(newToken);
    state.setShortcutToken(newToken);
    setSaving(false);
  }

  async function copyToken() {
    await navigator.clipboard.writeText(token);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  async function copyUrl() {
    await navigator.clipboard.writeText(apiUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <SettingsPanel title="iOS Shortcut" onBack={state.goBackSettingsPage}>
      <div className="rounded-2xl border border-blue-500/20 bg-blue-500/8 p-4 text-sm text-blue-200 space-y-1">
        <p className="font-semibold flex items-center gap-2"><Smartphone size={14} /> Quick Add via Siri</p>
        <p className="text-xs text-blue-300/70">Generate a personal token, paste it into the iOS Shortcut once, then say "Hey Siri, Finance Quick Add" to log transactions instantly.</p>
      </div>

      <Field label="Your API URL">
        <div className="flex items-center gap-2">
          <span className="flex-1 truncate rounded-2xl bg-neutral-200 px-4 py-3 text-sm font-mono text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
            {apiUrl}
          </span>
          <button
            type="button"
            onClick={copyUrl}
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-200 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
          >
            {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
          </button>
        </div>
      </Field>

      <Field label="Your personal token">
        {token ? (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="flex-1 truncate rounded-2xl bg-neutral-200 px-4 py-3 text-sm font-mono text-neutral-600 dark:bg-neutral-800 dark:text-neutral-400">
                {token}
              </span>
              <button
                type="button"
                onClick={copyToken}
                className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-neutral-200 text-neutral-600 hover:bg-neutral-300 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700"
              >
                {copied ? <Check size={15} className="text-emerald-400" /> : <Copy size={15} />}
              </button>
            </div>
            <button
              type="button"
              onClick={generateToken}
              disabled={saving}
              className="flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-300"
            >
              <RefreshCw size={11} className={saving ? "animate-spin" : ""} />
              Regenerate token
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={generateToken}
            disabled={saving}
            className="w-full rounded-2xl bg-neutral-900 py-3 text-sm font-semibold text-white hover:bg-neutral-700 dark:bg-white dark:text-neutral-950 dark:hover:bg-neutral-200"
          >
            {saving ? "Generating…" : "Generate token"}
          </button>
        )}
      </Field>

      {token && (
        <div className="space-y-3 rounded-2xl border border-white/[0.07] bg-white/[0.03] p-4 text-xs text-neutral-400">
          <p className="font-semibold text-neutral-300">Shortcut setup steps</p>
          <ol className="space-y-1.5 list-decimal list-inside">
            <li>Open iOS Shortcuts → tap <strong>+</strong> → name it <strong>Finance Quick Add</strong></li>
            <li>Add <strong>Get Contents of URL</strong> → paste your API URL above → method GET → header: <code className="text-blue-300">Authorization: Bearer YOUR_TOKEN</code></li>
            <li>Follow the full setup instructions shared in the app chat</li>
          </ol>
          <p className="text-neutral-500">Keep your token private — anyone with it can add transactions to your account.</p>
        </div>
      )}
    </SettingsPanel>
  );
}
