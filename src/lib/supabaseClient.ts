import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { WargameMapState, SupabaseMapRecord } from '../types';
import { PRESET_MAPS } from '../data/presets';

const STORAGE_CREDENTIALS_KEY = 'vtt_supabase_credentials';
const LOCAL_MAPS_KEY = 'vtt_local_maps';

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

// LocalStorage Fallback Storage Helpers
function getLocalMaps(): SupabaseMapRecord[] {
  try {
    const raw = localStorage.getItem(LOCAL_MAPS_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to parse local maps:', e);
  }
  // Default fallback initial maps
  const defaultLocal: SupabaseMapRecord[] = [
    {
      id: 'local_crossroads',
      name: 'Operation Crossroads',
      updated_at: new Date().toISOString(),
      state_json: PRESET_MAPS.crossroads,
    },
    {
      id: 'local_pass',
      name: 'Iron Ridge Pass',
      updated_at: new Date().toISOString(),
      state_json: PRESET_MAPS.mountain_pass,
    },
  ];
  localStorage.setItem(LOCAL_MAPS_KEY, JSON.stringify(defaultLocal));
  return defaultLocal;
}

function saveLocalMaps(maps: SupabaseMapRecord[]) {
  localStorage.setItem(LOCAL_MAPS_KEY, JSON.stringify(maps));
}

export async function fetchAllMaps(): Promise<{ maps: SupabaseMapRecord[]; source: 'supabase' | 'local'; error?: string }> {
  const client = getSupabaseClient();
  if (client) {
    try {
      const { data, error } = await client
        .from('wargame_maps')
        .select('id, name, updated_at, state_json')
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Supabase fetch error, falling back to local storage:', error.message);
        return { maps: getLocalMaps(), source: 'local', error: error.message };
      }
      return { maps: data as SupabaseMapRecord[], source: 'supabase' };
    } catch (err: any) {
      console.warn('Supabase fetch exception:', err);
      return { maps: getLocalMaps(), source: 'local', error: err.message || 'Connection failed' };
    }
  }

  return { maps: getLocalMaps(), source: 'local' };
}

export async function saveMapToBackend(
  name: string,
  state: WargameMapState,
  mapId?: string
): Promise<{ success: boolean; record?: SupabaseMapRecord; source: 'supabase' | 'local'; error?: string }> {
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

      if (mapId && !mapId.startsWith('local_')) {
        payload.id = mapId;
      }

      const { data, error } = await client
        .from('wargame_maps')
        .upsert(payload)
        .select()
        .single();

      if (error) {
        console.warn('Supabase save failed, saving locally:', error.message);
        const localRecord = saveMapLocally(name, mapStateWithDate, mapId);
        return { success: true, record: localRecord, source: 'local', error: error.message };
      }

      return { success: true, record: data as SupabaseMapRecord, source: 'supabase' };
    } catch (err: any) {
      console.warn('Supabase save exception:', err);
      const localRecord = saveMapLocally(name, mapStateWithDate, mapId);
      return { success: true, record: localRecord, source: 'local', error: err.message };
    }
  }

  const localRecord = saveMapLocally(name, mapStateWithDate, mapId);
  return { success: true, record: localRecord, source: 'local' };
}

function saveMapLocally(name: string, state: WargameMapState, mapId?: string): SupabaseMapRecord {
  const maps = getLocalMaps();
  const id = mapId || `local_${Date.now()}`;
  const now = new Date().toISOString();

  const existingIdx = maps.findIndex((m) => m.id === id);
  const newRecord: SupabaseMapRecord = {
    id,
    name,
    updated_at: now,
    state_json: { ...state, title: name, updatedAt: now },
  };

  if (existingIdx >= 0) {
    maps[existingIdx] = newRecord;
  } else {
    maps.unshift(newRecord);
  }

  saveLocalMaps(maps);
  return newRecord;
}

export async function deleteMapFromBackend(mapId: string): Promise<{ success: boolean; error?: string }> {
  const client = getSupabaseClient();
  if (client && !mapId.startsWith('local_')) {
    try {
      const { error } = await client.from('wargame_maps').delete().eq('id', mapId);
      if (error) {
        console.warn('Supabase delete error:', error.message);
      }
    } catch (e) {
      console.warn('Supabase delete exception:', e);
    }
  }

  // Also remove from local storage if present
  const maps = getLocalMaps().filter((m) => m.id !== mapId);
  saveLocalMaps(maps);
  return { success: true };
}
