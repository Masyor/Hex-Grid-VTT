import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WargameMapState, SupabaseMapRecord } from '../types';

const STORAGE_CREDENTIALS_KEY = 'vtt_supabase_credentials';

export interface SupabaseConfig {
  url: string;
  key: string;
}

export function getStoredSupabaseCredentials(): SupabaseConfig {
  try {
    const raw = localStorage.getItem(STORAGE_CREDENTIALS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.url && parsed.key) return parsed;
    }
  } catch (e) {
    console.warn('Error reading stored Supabase credentials:', e);
  }
  const env = (import.meta as unknown as { env?: Record<string, string> }).env || {};
  return {
    url: env.VITE_SUPABASE_URL || '',
    key: env.VITE_SUPABASE_ANON_KEY || '',
  };
}

export function saveSupabaseCredentials(config: SupabaseConfig) {
  localStorage.setItem(STORAGE_CREDENTIALS_KEY, JSON.stringify(config));
}

let supabaseInstance: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient | null {
  const { url, key } = getStoredSupabaseCredentials();
  if (!url || !key || url.includes('YOUR_SUPABASE') || key.includes('YOUR_KEY')) {
    return null;
  }

  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(url, key);
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  return supabaseInstance;
}

export function resetSupabaseClient() {
  supabaseInstance = null;
}

export async function fetchAllMaps(): Promise<{ maps: SupabaseMapRecord[]; source: 'supabase'; error?: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('wargame_maps')
        .select('id, name, updated_at, state_json')
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error:', error.message);
        return { maps: [], source: 'supabase', error: error.message };
      }
      return { maps: (data as SupabaseMapRecord[]) || [], source: 'supabase' };
    } catch (err: any) {
      console.warn('Supabase fetch exception:', err);
      return { maps: [], source: 'supabase', error: err.message || 'Connection failed' };
    }
  }

  return { maps: [], source: 'supabase', error: 'Supabase client not initialized' };
}

export async function saveMapToBackend(
  name: string,
  state: WargameMapState,
  mapId?: string
): Promise<{ success: boolean; record?: SupabaseMapRecord; source: 'supabase'; error?: string }> {
  const client = getSupabaseClient();
  const now = new Date().toISOString();
  const mapStateWithDate = { ...state, title: name, updatedAt: now };

  if (client) {
    try {
      const payload: Partial<SupabaseMapRecord> = {
        name,
        updated_at: now,
        state_json: mapStateWithDate,
      };

      if (mapId && !mapId.startsWith('local_') && !mapId.startsWith('preset_')) {
        payload.id = mapId;
      }

      const { data, error } = await client
        .from('wargame_maps')
        .upsert(payload)
        .select()
        .single();

      if (error) {
        console.warn('Supabase save failed:', error.message);
        return { success: false, source: 'supabase', error: error.message };
      }

      return { success: true, record: data as SupabaseMapRecord, source: 'supabase' };
    } catch (err: any) {
      console.warn('Supabase save exception:', err);
      return { success: false, source: 'supabase', error: err.message };
    }
  }

  return { success: false, source: 'supabase', error: 'Supabase client not connected' };
}

export async function deleteMapFromBackend(mapId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (client && !mapId.startsWith('preset_')) {
    try {
      const { error } = await client.from('wargame_maps').delete().eq('id', mapId);
      if (error) {
        console.warn('Supabase delete error:', error.message);
        return { success: false, error: error.message };
      }
      return { success: true };
    } catch (e: any) {
      console.warn('Supabase delete exception:', e);
      return { success: false, error: e.message };
    }
  }

  return { success: true };
}

