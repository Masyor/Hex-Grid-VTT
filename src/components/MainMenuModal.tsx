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
  BookOpen,
  MousePointer,
  Paintbrush,
  Ruler,
  UserPlus,
  Hand,
  Info,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import { WargameMapState, SupabaseMapRecord, Orientation } from '../types';
import { PRESET_MAPS } from '../data/presets';
import {
  fetchAllMaps,
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
  const [activeTab, setActiveTab] = useState<'guide' | 'browse' | 'create' | 'scenarios'>('guide');

  // New Map Form State
  const [newTitle, setNewTitle] = useState('New Wargame Sector');
  const [newOwner, setNewOwner] = useState('Game Master');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [newRadius, setNewRadius] = useState<number>(11);
  const [newOrientation, setNewOrientation] = useState<Orientation>('pointy');
  const [newTerrainStyle, setNewTerrainStyle] = useState<string>('clear');

  // Search & Filter State for Browse Tab
  const [searchQuery, setSearchQuery] = useState('');

  const dbConnected = isSupabaseConfigured();

  // Sync maps on modal open
  useEffect(() => {
    if (isOpen) {
      refreshMapsList();
    }
  }, [isOpen, refreshMapsList]);

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
        <div className="bg-slate-950/80 border-b border-slate-800/80 px-5 flex items-center gap-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('guide')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
              activeTab === 'guide'
                ? 'border-emerald-500 text-emerald-400 bg-emerald-950/20'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <BookOpen className="w-4 h-4 text-emerald-400" />
            <span>Getting Started</span>
          </button>

          <button
            onClick={() => setActiveTab('browse')}
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
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
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
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
            className={`px-4 py-3 text-xs font-semibold flex items-center gap-2 border-b-2 transition cursor-pointer shrink-0 ${
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
          {/* TAB 0: GETTING STARTED GUIDE */}
          {activeTab === 'guide' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              <div className="p-5 bg-emerald-950/40 border border-emerald-800/60 rounded-2xl space-y-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 bg-emerald-900/60 rounded-lg text-emerald-400">
                    <Swords className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">Welcome to Hex Grid Virtual Tabletop</h3>
                    <p className="text-xs text-emerald-300/80">
                      Tactical wargaming, campaign planning, and battlemap simulation.
                    </p>
                  </div>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Hex VTT allows Game Masters and commanders to build interactive tactical battle maps, place military unit tokens, paint custom terrain, measure firing distances, and track turns across sessions.
                </p>
              </div>

              {/* Password Safety Notice */}
              <div className="p-4 bg-amber-950/50 border border-amber-800/80 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-amber-300">
                  <Shield className="w-4 h-4 text-amber-400" />
                  <span>Important GM Password Safety Notice</span>
                </div>
                <p className="text-xs text-slate-300 leading-relaxed">
                  Make sure to keep your GM access password safe — only <strong>Masyor</strong> can retrieve it if you forget it!
                </p>
              </div>

              {/* How to Use / Controls Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                    <MousePointer className="w-4 h-4 text-emerald-400" />
                    <span>Unit Movement & Stacking</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Use the <strong>Select Tool (V)</strong> to click and drag units across hexes. When multiple units occupy the same hex, clicking the stack opens an inspector to select or move individual tokens.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                    <Paintbrush className="w-4 h-4 text-emerald-400" />
                    <span>Terrain Painter</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Use the <strong>Paint Tool (B)</strong> to apply terrain like Woods, Hills, Rivers, Fortifications, or custom colored emojis directly onto hexes. Use Eraser (E) to clear painted tiles.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                    <Ruler className="w-4 h-4 text-emerald-400" />
                    <span>Distance Measurement</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Use the <strong>Measure Tool (M)</strong> to click and drag across hexes to measure range in axial hex steps and yards/meters instantly.
                  </p>
                </div>

                <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-slate-200 uppercase tracking-wider">
                    <UserPlus className="w-4 h-4 text-emerald-400" />
                    <span>Spawning & Editing Units</span>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    Use the <strong>Spawn Tool (U)</strong> to drop new unit counters onto any hex, or manage complete unit stats and faction colors from the sidebar panel.
                  </p>
                </div>
              </div>

              {/* Quick Start Buttons */}
              <div className="pt-2 flex flex-wrap items-center justify-end gap-3">
                <button
                  onClick={() => setActiveTab('browse')}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold cursor-pointer transition flex items-center gap-2"
                >
                  <Search className="w-4 h-4 text-emerald-400" />
                  <span>Browse Saved Maps</span>
                </button>

                <button
                  onClick={() => setActiveTab('create')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer transition shadow flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Map</span>
                </button>
              </div>
            </div>
          )}

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
                    {dbConnected ? 'Connected' : 'Offline'}
                  </span>
                </div>
              </div>

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
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="Optional password to restrict GM edit mode..."
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 font-mono focus:outline-none focus:border-emerald-500 pr-9"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-2 text-slate-400 hover:text-slate-200 cursor-pointer transition"
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[10px] text-amber-400/90 mt-1.5 flex items-center gap-1 font-medium">
                    <Shield className="w-3 h-3 text-amber-400 shrink-0" />
                    <span>Important: Keep your password safe — only Masyor can retrieve it if you forget it!</span>
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

