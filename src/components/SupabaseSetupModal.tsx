import React, { useState } from 'react';
import { X, Database, Copy, Check, ShieldAlert, CheckCircle2, RefreshCw } from 'lucide-react';
import {
  getStoredSupabaseCredentials,
  saveSupabaseCredentials,
  resetSupabaseClient,
  fetchAllMaps,
} from '../lib/supabaseClient';

interface SupabaseSetupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRefreshMaps: () => void;
}

export const SupabaseSetupModal: React.FC<SupabaseSetupModalProps> = ({
  isOpen,
  onClose,
  onRefreshMaps,
}) => {
  const [credentials, setCredentials] = useState(getStoredSupabaseCredentials());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; msg: string } | null>(null);
  const [sqlCopied, setSqlCopied] = useState(false);

  if (!isOpen) return null;

  const sqlSchema = `
-- Supabase Postgres Schema for Hex Grid VTT Wargame Maps
create table if not exists public.wargame_maps (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  state_json jsonb not null
);

-- Row Level Security Policy (Allows public reads and writes for Play-by-Post sessions)
alter table public.wargame_maps enable row level security;

create policy "Allow public access to wargame_maps"
  on public.wargame_maps
  for all
  using (true)
  with check (true);
`.trim();

  const handleSaveAndTest = async () => {
    setTesting(true);
    setTestResult(null);

    saveSupabaseCredentials(credentials);
    resetSupabaseClient();

    const res = await fetchAllMaps();
    setTesting(false);

    if (res.source === 'supabase' && !res.error) {
      setTestResult({
        success: true,
        msg: `Successfully connected to Supabase! Found ${res.maps.length} remote maps.`,
      });
      onRefreshMaps();
    } else {
      setTestResult({
        success: false,
        msg: res.error || 'Could not connect or table wargame_maps is missing. Using LocalStorage fallback.',
      });
    }
  };

  const handleCopySQL = () => {
    navigator.clipboard.writeText(sqlSchema);
    setSqlCopied(true);
    setTimeout(() => setSqlCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Database className="w-4 h-4 text-emerald-400" />
              Supabase Backend State Integration
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Persist play-by-post wargame map states as raw JSON in Supabase.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4 text-xs">
          {/* Inputs */}
          <div className="space-y-3 p-3.5 bg-slate-950 rounded-xl border border-slate-800">
            <div>
              <label className="text-slate-300 font-medium block mb-1">Supabase URL</label>
              <input
                type="text"
                value={credentials.url}
                onChange={(e) => setCredentials((prev) => ({ ...prev, url: e.target.value }))}
                placeholder="https://your-project.supabase.co"
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
              />
            </div>

            <div>
              <label className="text-slate-300 font-medium block mb-1">Supabase Anon Key</label>
              <input
                type="password"
                value={credentials.key}
                onChange={(e) => setCredentials((prev) => ({ ...prev, key: e.target.value }))}
                placeholder="eyJhbGciOiJIUzI1NiIsIn..."
                className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-[11px]"
              />
            </div>

            <button
              onClick={handleSaveAndTest}
              disabled={testing}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg cursor-pointer transition flex items-center justify-center gap-2 shadow"
            >
              {testing ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
              <span>{testing ? 'Testing Connection...' : 'Save Credentials & Test Connection'}</span>
            </button>

            {testResult && (
              <div
                className={`p-3 rounded-lg border flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-950/60 border-emerald-800/80 text-emerald-300'
                    : 'bg-amber-950/60 border-amber-800/80 text-amber-300'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                )}
                <span>{testResult.msg}</span>
              </div>
            )}
          </div>

          {/* SQL Setup Snippet */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="font-semibold text-slate-300 uppercase tracking-wider text-[10px]">
                Required Supabase SQL Table Schema (`wargame_maps`)
              </label>
              <button
                onClick={handleCopySQL}
                className="flex items-center gap-1 text-[11px] text-emerald-400 hover:underline cursor-pointer"
              >
                {sqlCopied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                <span>{sqlCopied ? 'Copied SQL!' : 'Copy SQL Script'}</span>
              </button>
            </div>

            <pre className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[10px] font-mono text-slate-300 overflow-x-auto leading-relaxed">
              {sqlSchema}
            </pre>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 text-right">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold rounded-lg cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
