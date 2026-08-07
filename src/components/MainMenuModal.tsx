import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  Search,
  Map,
  Shield,
  User,
  Key,
  Calendar,
  Layers,
  Sparkles,
  Swords,
  Database,
  ArrowRight,
  Check,
  Lock,
  Unlock,
} from 'lucide-react';
import { WargameMapState, SupabaseMapRecord, Orientation } from '../types';
import { PRESET_MAPS } from '../data/presets';
import {
  fetchAllMaps,
  getStoredSupabaseCredentials,
  saveSupabaseCredentials,
  resetSupabaseClient,
  isSupabaseConfigured,
} from '../lib/supabaseClient';

interface MainMenuModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadMapState: (mapState: WargameMapState, recordId?: string) => void;
  onNewCustomMap: (config: {
    title: string;
    ownerName: string;
    accessPassword?: string;
    radius: number;
    orientation: Orientation;
    presetTerrain?: string;
  }) => void;
  savedMaps: SupabaseMapRecord[];
  refreshMapsList: () => void;
}

export const MainMenuModal: React.FC<MainMenuModalProps> = ({
  isOpen,
  onClose,
  onLoadMapState,
  onNewCustomMap,
  savedMaps,
  refreshMapsList,
}) => {
  const [activeTab, setActiveTab] = useState<'create' | 'browse' | 'scenarios'>('browse');

  // New Map Form State
  const [newTitle, setNewTitle] = useState('New Wargame Sector');
  const [newOwner, setNewOwner] = useState('Game Master');
  const [newPassword, setNewPassword] = useState('');
  const [newRadius, setNewRadius] = useState<number>(11);
  const [newOrientation, setNewOrientation] = useState<Orientation>('pointy');
  const [newTerrainStyle, setNewTerrainStyle] = useState<string>('clear');

  // Search & Filter State for Browse Tab
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMapRecord, setSelectedMapRecord] = useState<SupabaseMapRecord | null>(null);

  // Supabase Settings State
  const [showDbSettings, setShowDbSettings] = useState(false);
  const [dbUrl, setDbUrl] = useState('');
  const [dbKey, setDbKey] = useState('');
  const [dbConnected, setDbConnected] = useState(isSupabaseConfigured());

  // Sync maps and credentials on modal open
  useEffect(() => {
    if (isOpen) {
      const creds = getStoredSupabaseCredentials();
      setDbUrl(creds.url);
      setDbKey(creds.key);
      setDbConnected(isSupabaseConfigured());
      refreshMapsList();
    }
  }, [isOpen, refreshMapsList]);

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseCredentials({ url: dbUrl.trim(), key: dbKey.trim() });
    resetSupabaseClient();
    setDbConnected(isSupabaseConfigured());
    refreshMapsList();
    setShowDbSettings(false);
  };

  if (!isOpen) return null;

  // Filter saved maps
  const filteredMaps = savedMaps.filter((m) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    const nameMatch = m.name.toLowerCase().includes(q);
    const ownerMatch = m.state_json?.ownerName?.toLowerCase().includes(q);
    const descMatch = m.state_json?.description?.toLowerCase().includes(q);
    return nameMatch || ownerMatch || descMatch;
  });

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onNewCustomMap({
      title: newTitle || 'New Hex Sector',
      ownerName: newOwner || 'Game Master',
      accessPassword: newPassword || undefined,
      radius: newRadius,
      orientation: newOrientation,
      presetTerrain: newTerrainStyle,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        {/* Top Header */}
        <div className="p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-emerald-950/80 border border-emerald-800/80 rounded-xl text-emerald-400 font-bold shadow-inner">
              <Swords className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white tracking-wide">HEX VTT</h2>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Virtual Tabletop
                </span>
              </div>
              <p className="text-xs text-slate-400">Map Manager, Scenario Builder & Campaign Vault</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-800 rounded-xl transition cursor-pointer"
            title="Close Main Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="bg-slate-950/80 border-b border-slate-800/80 px-5 flex items-center gap-2">
          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'browse'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>Search & Load Maps</span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
              {savedMaps.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('create')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'create'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create New Map</span>
          </button>

          <button
            onClick={() => setActiveTab('scenarios')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer ${
              activeTab === 'scenarios'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>Sample Scenarios</span>
          </button>
        </div>

        {/* Modal Body Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* TAB 1: BROWSE & SEARCH MAPS */}
          {activeTab === 'browse' && (
            <div className="space-y-4">
              {/* Search Bar & Storage Indicator */}
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-950 p-3 rounded-xl border border-slate-800">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search by map title, GM name, or keyword..."
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div className="flex items-center gap-2 text-xs text-slate-400 shrink-0">
                  <Database className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Cloud Database:</span>
                  <span
                    className={`font-semibold px-2 py-0.5 rounded text-[10px] ${
                      dbConnected
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                        : 'bg-amber-950 text-amber-300 border border-amber-800'
                    }`}
                  >
                    {dbConnected ? 'Supabase Connected' : 'Not Connected'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowDbSettings(!showDbSettings)}
                    className="px-2 py-1 text-[11px] bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition cursor-pointer"
                    title="Configure Supabase Connection"
                  >
                    Settings
                  </button>
                </div>
              </div>

              {/* DB Credentials Form (if toggled or if not connected) */}
              {(showDbSettings || !dbConnected) && (
                <form
                  onSubmit={handleSaveCredentials}
                  className="p-4 bg-slate-950 rounded-xl border border-amber-800/80 space-y-3 animate-in fade-in"
                >
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-bold text-amber-300 flex items-center gap-2">
                      <Database className="w-4 h-4 text-amber-400" />
                      <span>Supabase Database Credentials</span>
                    </div>
                    {dbConnected && (
                      <button
                        type="button"
                        onClick={() => setShowDbSettings(false)}
                        className="text-xs text-slate-400 hover:text-white cursor-pointer"
                      >
                        Hide
                      </button>
                    )}
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {!dbConnected
                      ? 'No active Supabase connection detected on this browser. Enter your Supabase credentials below to sync campaign maps across devices.'
                      : 'You are currently connected. You can update your Supabase URL or Anon Key below if needed.'}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-[10px] font-semibold text-slate-300 block mb-1">Project URL</label>
                      <input
                        type="url"
                        required
                        value={dbUrl}
                        onChange={(e) => setDbUrl(e.target.value)}
                        placeholder="https://your-project.supabase.co"
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-semibold text-slate-300 block mb-1">Anon / Public Key</label>
                      <input
                        type="text"
                        required
                        value={dbKey}
                        onChange={(e) => setDbKey(e.target.value)}
                        placeholder="eyJhbGciOiJIUzI1Ni..."
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-1">
                    <button
                      type="submit"
                      className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-bold transition cursor-pointer shadow"
                    >
                      Save & Connect Database
                    </button>
                  </div>
                </form>
              )}

              {/* Map Grid */}
              {filteredMaps.length === 0 ? (
                <div className="p-12 text-center bg-slate-950/60 rounded-2xl border border-slate-800 space-y-3">
                  <Map className="w-10 h-10 text-slate-600 mx-auto" />
                  <div className="text-sm font-semibold text-slate-300">No maps found matching "{searchQuery}"</div>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    Try searching another keyword or switch to the "Create New Map" tab to launch a fresh campaign sector.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {filteredMaps.map((record) => {
                    const state = record.state_json;
                    const unitCount = state?.units?.length || 0;
                    const terrainCount = Object.keys(state?.terrains || {}).length;
                    const gmName = state?.ownerName || 'Game Master';
                    const hasPass = !!(state?.accessPassword || state?.gmPasscode);

                    return (
                      <div
                        key={record.id}
                        className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 hover:border-emerald-500/60 transition-all flex flex-col justify-between space-y-3 group"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="text-sm font-bold text-slate-100 group-hover:text-emerald-400 transition truncate">
                              {record.name}
                            </h3>
                            {hasPass && (
                              <span
                                className="flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-950/80 border border-amber-800/80 text-amber-300"
                                title="Password protected GM map"
                              >
                                <Lock className="w-3 h-3 text-amber-400" />
                                <span>GM Pass</span>
                              </span>
                            )}
                          </div>

                          <div className="flex items-center gap-2 mt-1 text-[11px] text-slate-400">
                            <span className="flex items-center gap-1 text-slate-300">
                              <User className="w-3 h-3 text-amber-400" />
                              GM: <strong className="text-slate-200">{gmName}</strong>
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 text-slate-400">
                              <Calendar className="w-3 h-3 text-slate-500" />
                              {new Date(record.updated_at).toLocaleDateString()}
                            </span>
                          </div>

                          {state?.description && (
                            <p className="text-xs text-slate-400 line-clamp-2 mt-2 leading-relaxed">
                              {state.description}
                            </p>
                          )}
                        </div>

                        <div className="pt-3 border-t border-slate-900 flex items-center justify-between">
                          <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400">
                            <span className="flex items-center gap-1">
                              <Layers className="w-3 h-3 text-emerald-400" />
                              {unitCount} Units
                            </span>
                            <span className="flex items-center gap-1">
                              <Map className="w-3 h-3 text-blue-400" />
                              {terrainCount} Hex Tiles
                            </span>
                          </div>

                          <button
                            onClick={() => {
                              onLoadMapState(record.state_json, record.id);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition shadow"
                          >
                            <span>Open Map</span>
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CREATE NEW MAP */}
          {activeTab === 'create' && (
            <form onSubmit={handleCreateSubmit} className="space-y-5 max-w-2xl mx-auto">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Map className="w-4 h-4 text-emerald-400" />
                  <span>Map & Campaign Identity</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Map Title</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Ridge Sector 7, Town Siege"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Game Master Name</label>
                    <input
                      type="text"
                      required
                      value={newOwner}
                      onChange={(e) => setNewOwner(e.target.value)}
                      placeholder="e.g. GM Alex"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-slate-300 block mb-1">
                    GM Access Password <span className="text-slate-500 font-normal">(Optional for co-GMs)</span>
                  </label>
                  <div className="relative">
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Optional password to restrict GM edit mode..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500 pr-9"
                    />
                    <Key className="w-3.5 h-3.5 text-slate-500 absolute right-3 top-2.5 pointer-events-none" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1">
                    You automatically remain unlocked on this device as the creator. Other users need this password for GM edits.
                  </p>
                </div>
              </div>

              {/* Grid Settings */}
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800 space-y-4">
                <div className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-blue-400" />
                  <span>Grid & Size Configuration</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Grid Diameter / Bounds</label>
                    <select
                      value={newRadius}
                      onChange={(e) => setNewRadius(Number(e.target.value))}
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                    >
                      <option value={5}>Skirmish (11x11 Hex Grid)</option>
                      <option value={8}>Tactical (17x17 Hex Grid)</option>
                      <option value={11}>Standard Sector (23x23 Hex Grid)</option>
                      <option value={15}>Large Battlefield (31x31 Hex Grid)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold text-slate-300 block mb-1">Hex Orientation</label>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setNewOrientation('pointy')}
                        className={`p-2 rounded-lg border text-xs font-medium cursor-pointer transition ${
                          newOrientation === 'pointy'
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Pointy Top (▲)
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewOrientation('flat')}
                        className={`p-2 rounded-lg border text-xs font-medium cursor-pointer transition ${
                          newOrientation === 'flat'
                            ? 'bg-emerald-950 border-emerald-500 text-emerald-300'
                            : 'bg-slate-900 border-slate-800 text-slate-400'
                        }`}
                      >
                        Flat Top (⬢)
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-sm flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-emerald-950 transition"
              >
                <Plus className="w-4 h-4" />
                <span>Launch New Wargame Map</span>
              </button>
            </form>
          )}

          {/* TAB 3: SAMPLE SCENARIOS */}
          {activeTab === 'scenarios' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(PRESET_MAPS).map(([key, preset]) => (
                <div
                  key={key}
                  className="p-5 bg-slate-950 rounded-2xl border border-slate-800/90 hover:border-amber-500/60 transition-all flex flex-col justify-between space-y-4 group"
                >
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <h3 className="text-sm font-bold text-slate-100 group-hover:text-amber-300 transition">
                        {preset.title}
                      </h3>
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">{preset.description}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-900 flex items-center justify-between">
                    <div className="text-[10px] font-mono text-slate-400">
                      {preset.units.length} Preset Units • {Object.keys(preset.terrains).length} Painted Tiles
                    </div>

                    <button
                      onClick={() => {
                        onLoadMapState(preset);
                        onClose();
                      }}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow transition"
                    >
                      <span>Load Scenario</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
