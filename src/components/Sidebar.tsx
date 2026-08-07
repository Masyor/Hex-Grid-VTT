import React, { useState } from 'react';
import {
  Map,
  Plus,
  Trash2,
  Settings,
  Layers,
  Users,
  Database,
  ChevronLeft,
  ChevronRight,
  Shield,
  Clock,
  Send,
  Copy,
  Swords,
  Check,
  Lock,
  Unlock,
  Sparkles,
  Key,
  Eye,
  EyeOff,
  User,
  XCircle,
} from 'lucide-react';
import {
  WargameMapState,
  SupabaseMapRecord,
  TerrainCategory,
  Unit,
  UnitFaction,
  UnitStatus,
  GridSettings,
  TurnLogEntry,
} from '../types';
import { TERRAIN_LIST, TERRAIN_DEFS } from '../data/terrainDefs';

interface SidebarProps {
  mapState: WargameMapState;
  setMapState: React.Dispatch<React.SetStateAction<WargameMapState>>;
  savedMaps: SupabaseMapRecord[];
  currentMapId: string | null;
  onSelectMapRecord: (record: SupabaseMapRecord) => void;
  onNewMap: () => void;
  onLoadPreset: (presetKey: string) => void;
  selectedTerrain: TerrainCategory | 'custom';
  setSelectedTerrain: (t: TerrainCategory | 'custom') => void;
  customTerrainConfig: { name: string; color: string; symbol: string };
  setCustomTerrainConfig: React.Dispatch<React.SetStateAction<{ name: string; color: string; symbol: string }>>;
  isGmUnlocked: boolean;
  setIsGmUnlocked: (u: boolean) => void;
  onPromptGmUnlock: () => void;
  brushRadius: number;
  setBrushRadius: (r: number) => void;
  onSpawnUnit: (unitData: Omit<Unit, 'id' | 'q' | 'r'>) => void;
  selectedUnit: Unit | null;
  onSelectUnitOnMap: (unit: Unit | null) => void;
  onOpenUnitEditModal?: () => void;
  onDeleteUnit: (id: string) => void;
  onOpenSupabaseModal: () => void;
  supabaseSource: 'supabase' | 'local';
  onClearAllTerrain: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  mapState,
  setMapState,
  savedMaps,
  currentMapId,
  onSelectMapRecord,
  onNewMap,
  onLoadPreset,
  selectedTerrain,
  setSelectedTerrain,
  customTerrainConfig,
  setCustomTerrainConfig,
  isGmUnlocked,
  setIsGmUnlocked,
  onPromptGmUnlock,
  brushRadius,
  setBrushRadius,
  onSpawnUnit,
  selectedUnit,
  onSelectUnitOnMap,
  onOpenUnitEditModal,
  onDeleteUnit,
  onOpenSupabaseModal,
  supabaseSource,
  onClearAllTerrain,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaign' | 'map' | 'terrain' | 'units' | 'settings'>('campaign');

  // New Unit Form State
  const [newUnitName, setNewUnitName] = useState('Alpha Platoon');
  const [newUnitFaction, setNewUnitFaction] = useState<UnitFaction>('Player');
  const [newUnitColor, setNewUnitColor] = useState('#2563eb');
  const [newUnitLabel, setNewUnitLabel] = useState('A1');
  const [newUnitSymbol, setNewUnitSymbol] = useState('Infantry');
  const [newUnitStatus, setNewUnitStatus] = useState<UnitStatus>('Active');

  // Turn Log Form State
  const [logAuthor, setLogAuthor] = useState('Game Master');
  const [logText, setLogText] = useState('');
  const [codeCopiedToast, setCodeCopiedToast] = useState(false);

  // Quick emoji options for custom terrain
  const EMOJI_SWATCHES = ['🌋', '🏰', '☢️', '💥', '⚡', '🚩', '🏆', '🔮', '🌲', '🌊', '⛺', '💣', '💎', '🛡️', '⚔️', '🚨'];
  const COLOR_SWATCHES = ['#dc2626', '#7c3aed', '#0891b2', '#d97706', '#db2777', '#65a30d', '#4c1d95', '#ca8a04', '#1e293b'];

  const factionColors: Record<UnitFaction, string> = {
    Player: '#2563eb', // Blue
    Enemy: '#dc2626', // Red
    NPC: '#16a34a', // Green
    Neutral: '#d97706', // Yellow/Orange
  };

  const symbols = ['Infantry', 'Armor', 'Artillery', 'Recon', 'HQ', 'Air', 'Special', 'Naval', 'Supply'];

  const handleCreateUnitSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSpawnUnit({
      name: newUnitName,
      faction: newUnitFaction,
      color: newUnitColor,
      label: newUnitLabel,
      symbol: newUnitSymbol,
      status: newUnitStatus,
      hp: 100,
      maxHp: 100,
    });
  };

  const handleAddTurnLog = (e: React.FormEvent) => {
    e.preventDefault();
    if (!logText.trim()) return;

    const newLog: TurnLogEntry = {
      id: 'log_' + Date.now(),
      turn: mapState.currentTurn || 1,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      author: logAuthor || 'Commander',
      text: logText.trim(),
    };

    setMapState((prev) => ({
      ...prev,
      turnLogs: [newLog, ...(prev.turnLogs || [])],
    }));
    setLogText('');
  };

  const handleNextTurn = () => {
    setMapState((prev) => {
      const nextTurn = (prev.currentTurn || 1) + 1;
      const turnMsg: TurnLogEntry = {
        id: 'log_turn_' + Date.now(),
        turn: nextTurn,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        author: 'System',
        text: `--- Advanced to Turn ${nextTurn} ---`,
      };
      return {
        ...prev,
        currentTurn: nextTurn,
        turnLogs: [turnMsg, ...(prev.turnLogs || [])],
      };
    });
  };

  const handleCopyGameCode = () => {
    const code = mapState.gameCode || 'GAME-' + Math.floor(1000 + Math.random() * 9000);
    navigator.clipboard.writeText(code);
    setCodeCopiedToast(true);
    setTimeout(() => setCodeCopiedToast(false), 2000);
  };

  const updateGridSettings = (key: keyof GridSettings, value: any) => {
    setMapState((prev) => ({
      ...prev,
      gridSettings: {
        ...prev.gridSettings,
        [key]: value,
      },
    }));
  };

  const updateGridBounds = (key: keyof GridSettings['bounds'], val: number) => {
    setMapState((prev) => ({
      ...prev,
      gridSettings: {
        ...prev.gridSettings,
        bounds: {
          ...prev.gridSettings.bounds,
          [key]: val,
        },
      },
    }));
  };

  if (collapsed) {
    return (
      <aside className="w-12 bg-slate-900 border-r border-slate-800 flex flex-col items-center py-4 gap-4 z-10 select-none">
        <button
          onClick={() => setCollapsed(false)}
          className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg cursor-pointer"
          title="Expand Panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>

        <div className="flex flex-col gap-2">
          <button
            onClick={() => {
              setActiveTab('campaign');
              setCollapsed(false);
            }}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Campaign & Game Room"
          >
            <Swords className="w-5 h-5 text-emerald-400" />
          </button>
          <button
            onClick={() => {
              setActiveTab('map');
              setCollapsed(false);
            }}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Map Manager"
          >
            <Map className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setActiveTab('terrain');
              setCollapsed(false);
            }}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Terrain Painter"
          >
            <Layers className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setActiveTab('units');
              setCollapsed(false);
            }}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Unit Manager"
          >
            <Users className="w-5 h-5" />
          </button>
          <button
            onClick={() => {
              setActiveTab('settings');
              setCollapsed(false);
            }}
            className="p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800 rounded-lg cursor-pointer"
            title="Grid Settings"
          >
            <Settings className="w-5 h-5" />
          </button>
        </div>
      </aside>
    );
  }

  return (
    <aside className="w-80 bg-slate-900/95 backdrop-blur border-r border-slate-800 flex flex-col z-10 select-none overflow-hidden text-slate-200">
      {/* Sidebar Header & Tab Selectors */}
      <div className="p-2.5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
        <div className="flex items-center gap-1 bg-slate-900 p-0.5 rounded-lg border border-slate-800 text-[11px] overflow-x-auto">
          <button
            onClick={() => setActiveTab('campaign')}
            className={`px-2 py-1 rounded-md font-medium cursor-pointer transition-all flex items-center gap-1 shrink-0 ${
              activeTab === 'campaign' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Swords className="w-3 h-3" />
            Game
          </button>
          <button
            onClick={() => setActiveTab('map')}
            className={`px-2 py-1 rounded-md font-medium cursor-pointer transition-all shrink-0 ${
              activeTab === 'map' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Maps
          </button>
          <button
            onClick={() => setActiveTab('terrain')}
            className={`px-2 py-1 rounded-md font-medium cursor-pointer transition-all shrink-0 ${
              activeTab === 'terrain' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Terrain
          </button>
          <button
            onClick={() => setActiveTab('units')}
            className={`px-2 py-1 rounded-md font-medium cursor-pointer transition-all shrink-0 ${
              activeTab === 'units' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Units ({mapState.units.length})
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-2 py-1 rounded-md font-medium cursor-pointer transition-all shrink-0 ${
              activeTab === 'settings' ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Grid
          </button>
        </div>

        <button
          onClick={() => setCollapsed(true)}
          className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg cursor-pointer shrink-0 ml-1"
          title="Collapse Panel"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5">
        {/* TAB 0: CAMPAIGN & TURN TRACKER (MULTI-GAME MANAGEMENT) */}
        {activeTab === 'campaign' && (
          <div className="space-y-4">
            {/* Active Game Room Header & Code */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span className="flex items-center gap-1 text-emerald-400">
                  <Shield className="w-3.5 h-3.5" />
                  Active Game Room
                </span>
                <span className="text-[10px] font-mono text-slate-400 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  {mapState.gameCode || 'ROOM-01'}
                </span>
              </div>

              <div>
                <input
                  type="text"
                  value={mapState.gameName || mapState.title}
                  onChange={(e) =>
                    setMapState((prev) => ({
                      ...prev,
                      gameName: e.target.value,
                      title: e.target.value,
                    }))
                  }
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs font-semibold text-slate-100 focus:outline-none focus:border-emerald-500"
                  placeholder="Campaign Title"
                />
              </div>

              <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800/80 text-xs">
                <span className="text-[11px] text-slate-400">Play-by-Post Code:</span>
                <button
                  onClick={handleCopyGameCode}
                  className="flex items-center gap-1 px-2 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded text-[11px] text-emerald-400 font-mono cursor-pointer transition"
                >
                  {codeCopiedToast ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                  <span>{codeCopiedToast ? 'Copied Code!' : mapState.gameCode || 'Copy Code'}</span>
                </button>
              </div>
            </div>

            {/* Game Master Security & Anti-Cheat Lock */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-2.5">
              <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
                <span className="flex items-center gap-1.5 text-amber-400">
                  <User className="w-3.5 h-3.5" />
                  GM Credentials & Protection
                </span>
                <span
                  className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    !isGmUnlocked
                      ? 'bg-rose-950/80 border-rose-800 text-rose-300'
                      : mapState.accessPassword || mapState.gmPasscode
                      ? 'bg-emerald-950/80 border-emerald-800 text-emerald-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400'
                  }`}
                >
                  {!isGmUnlocked ? '🔒 Locked' : '🔓 Unlocked'}
                </span>
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                  GM Username
                </label>
                <input
                  type="text"
                  value={mapState.ownerName || ''}
                  onChange={(e) => setMapState((prev) => ({ ...prev, ownerName: e.target.value }))}
                  placeholder="e.g. GM Dave"
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-medium focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                  GM Access Password
                </label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type="password"
                      value={mapState.accessPassword || mapState.gmPasscode || ''}
                      onChange={(e) =>
                        setMapState((prev) => ({
                          ...prev,
                          accessPassword: e.target.value,
                          gmPasscode: e.target.value,
                        }))
                      }
                      placeholder="e.g. coGMPass123"
                      className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-amber-500"
                    />
                    <Key className="w-3 h-3 text-slate-500 absolute right-2.5 top-2 pointer-events-none" />
                  </div>

                  <button
                    onClick={() => {
                      if (isGmUnlocked) {
                        setIsGmUnlocked(false);
                      } else {
                        onPromptGmUnlock();
                      }
                    }}
                    className={`px-2.5 py-1 rounded-lg text-xs font-medium cursor-pointer transition flex items-center gap-1 border ${
                      !isGmUnlocked
                        ? 'bg-amber-600 hover:bg-amber-500 text-white border-amber-500'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                    }`}
                  >
                    {!isGmUnlocked ? <Unlock className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                    <span>{!isGmUnlocked ? 'Unlock' : 'Lock'}</span>
                  </button>
                </div>
                <div className="text-[10px] text-slate-500 mt-1">
                  Identifies your map in map list. Share password with co-GMs for edit access.
                </div>
              </div>
            </div>

            {/* Turn Tracker */}
            <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5 text-emerald-400" />
                  Turn Tracker
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono bg-emerald-950/60 px-2.5 py-0.5 rounded-full border border-emerald-800/60">
                  Turn {mapState.currentTurn || 1}
                </span>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setMapState((prev) => ({
                      ...prev,
                      currentTurn: Math.max(1, (prev.currentTurn || 1) - 1),
                    }))
                  }
                  className="px-2.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs text-slate-300 cursor-pointer font-mono"
                >
                  - Turn
                </button>
                <button
                  onClick={handleNextTurn}
                  className="flex-1 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg text-xs cursor-pointer transition shadow text-center"
                >
                  Advance Turn +1
                </button>
              </div>
            </div>

            {/* Turn Log & Play-by-Post Actions */}
            <div className="space-y-3 pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between">
                <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                  Campaign Log & Moves
                </label>
                <span className="text-[10px] text-slate-500 font-mono">
                  {(mapState.turnLogs || []).length} logs
                </span>
              </div>

              {/* Add Log Form */}
              <form onSubmit={handleAddTurnLog} className="space-y-2 bg-slate-950 p-2.5 rounded-xl border border-slate-800">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={logAuthor}
                    onChange={(e) => setLogAuthor(e.target.value)}
                    className="w-1/2 bg-slate-900 border border-slate-800 rounded px-2 py-1 text-[11px] text-slate-200 font-medium"
                    placeholder="Author (e.g. Blue)"
                  />
                  <span className="text-[10px] text-slate-500 self-center font-mono">
                    Turn {mapState.currentTurn || 1}
                  </span>
                </div>

                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={logText}
                    onChange={(e) => setLogText(e.target.value)}
                    className="flex-1 bg-slate-900 border border-slate-800 rounded px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                    placeholder="Log orders, rolls, or results..."
                  />
                  <button
                    type="submit"
                    className="p-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded cursor-pointer transition shrink-0"
                    title="Post Move to Log"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>
              </form>

              {/* Log Feed */}
              <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                {(mapState.turnLogs || []).length === 0 ? (
                  <p className="text-xs text-slate-500 italic p-2">No campaign logs recorded yet.</p>
                ) : (
                  (mapState.turnLogs || []).map((log) => (
                    <div
                      key={log.id}
                      className="p-2 bg-slate-950/70 border border-slate-800/80 rounded-lg text-xs space-y-0.5"
                    >
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span className="font-semibold text-emerald-400">{log.author}</span>
                        <span>
                          Turn {log.turn} • {log.timestamp}
                        </span>
                      </div>
                      <div className="text-slate-200 text-[11px] leading-snug">{log.text}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Quick Switch Game List */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                All Active Games ({savedMaps.length})
              </label>
              <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                {savedMaps.map((record) => {
                  const isCurrent = currentMapId === record.id;
                  return (
                    <button
                      key={record.id}
                      onClick={() => onSelectMapRecord(record)}
                      className={`w-full text-left p-2 rounded-lg border text-xs flex items-center justify-between gap-2 transition cursor-pointer ${
                        isCurrent
                          ? 'border-emerald-500 bg-emerald-950/40 text-slate-100 font-semibold'
                          : 'border-slate-800/80 bg-slate-950/50 hover:bg-slate-800 text-slate-300'
                      }`}
                    >
                      <div className="truncate min-w-0">
                        <div className="truncate font-medium">{record.name}</div>
                        <div className="text-[10px] text-slate-500 font-mono">
                          Turn {record.state_json.currentTurn || 1} • {new Date(record.updated_at).toLocaleDateString()}
                        </div>
                      </div>
                      {isCurrent && <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 1: MAP MANAGER */}
        {activeTab === 'map' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1.5">
                Saved Maps ({savedMaps.length})
              </label>
              <select
                value={currentMapId || ''}
                onChange={(e) => {
                  const found = savedMaps.find((m) => m.id === e.target.value);
                  if (found) onSelectMapRecord(found);
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="" disabled>
                  -- Select a Map --
                </option>
                {savedMaps.map((m) => {
                  const owner = m.state_json?.ownerName;
                  return (
                    <option key={m.id} value={m.id}>
                      {m.name} {owner ? `[GM: ${owner}]` : ''} ({new Date(m.updated_at).toLocaleDateString()})
                    </option>
                  );
                })}
              </select>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={onNewMap}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5 text-emerald-400" />
                <span>New Map</span>
              </button>

              <button
                onClick={onOpenSupabaseModal}
                className="flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 cursor-pointer"
              >
                <Database className="w-3.5 h-3.5 text-amber-400" />
                <span>Supabase SQL</span>
              </button>
            </div>

            {/* Preset Scenarios */}
            <div className="pt-2 border-t border-slate-800/80">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
                Preset Scenarios
              </label>
              <div className="space-y-2">
                <button
                  onClick={() => onLoadPreset('crossroads')}
                  className="w-full text-left p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 rounded-lg transition cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-slate-200 group-hover:text-emerald-400">
                    Operation Crossroads
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    Central village junction with roads and dense flank woods.
                  </div>
                </button>

                <button
                  onClick={() => onLoadPreset('mountain_pass')}
                  className="w-full text-left p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 rounded-lg transition cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-slate-200 group-hover:text-emerald-400">
                    Iron Ridge Pass
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5 line-clamp-1">
                    Narrow mountain pass with entrenched defensive artillery.
                  </div>
                </button>

                <button
                  onClick={() => onLoadPreset('empty')}
                  className="w-full text-left p-2.5 bg-slate-950/60 hover:bg-slate-800 border border-slate-800/80 rounded-lg transition cursor-pointer group"
                >
                  <div className="font-semibold text-xs text-slate-200 group-hover:text-emerald-400">
                    Blank 15x15 Hex Canvas
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">
                    Clear axial grid ready for custom painting.
                  </div>
                </button>
              </div>
            </div>

            {/* Map Title / Details Editing */}
            <div className="pt-2 border-t border-slate-800/80 space-y-3">
              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Map Title</label>
                <input
                  type="text"
                  value={mapState.title}
                  onChange={(e) => setMapState((prev) => ({ ...prev, title: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-400 block mb-1">Description / Briefing</label>
                <textarea
                  rows={2}
                  value={mapState.description || ''}
                  onChange={(e) => setMapState((prev) => ({ ...prev, description: e.target.value }))}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: TERRAIN PALETTE */}
        {activeTab === 'terrain' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                Terrain Painter
              </label>
              <button
                onClick={onClearAllTerrain}
                className="text-[11px] text-rose-400 hover:text-rose-300 flex items-center gap-1 cursor-pointer"
                title="Reset all painted terrain back to clear"
              >
                <Trash2 className="w-3 h-3" />
                Clear Map
              </button>
            </div>

            {/* Custom Terrain Toggle Button */}
            <button
              onClick={() => setSelectedTerrain('custom')}
              className={`w-full p-2.5 rounded-xl border flex items-center justify-between transition-all cursor-pointer ${
                selectedTerrain === 'custom'
                  ? 'border-purple-500 bg-purple-950/60 ring-2 ring-purple-500/50 text-white shadow-lg'
                  : 'border-slate-800 bg-slate-950 hover:border-slate-700 hover:bg-slate-900 text-slate-300'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-inner border border-white/20"
                  style={{ backgroundColor: customTerrainConfig.color }}
                >
                  {customTerrainConfig.symbol || '✨'}
                </div>
                <div className="text-left">
                  <div className="text-xs font-semibold flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-purple-400" />
                    <span>{customTerrainConfig.name || 'Custom Terrain'}</span>
                  </div>
                  <div className="text-[10px] text-slate-400">Set custom hex color & icon symbol</div>
                </div>
              </div>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-purple-900/60 text-purple-300 border border-purple-700">
                Custom Mode
              </span>
            </button>

            {/* Custom Terrain Settings Panel */}
            {selectedTerrain === 'custom' && (
              <div className="p-3 bg-slate-950 rounded-xl border border-purple-900/60 space-y-3 animate-in fade-in duration-150">
                <div className="text-xs font-semibold text-purple-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  Configure Custom Terrain
                </div>

                <div>
                  <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                    Terrain Name
                  </label>
                  <input
                    type="text"
                    value={customTerrainConfig.name}
                    onChange={(e) => setCustomTerrainConfig((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                    placeholder="e.g. Acid Trench, Volcano, Minefield"
                  />
                </div>

                {/* Color Selector */}
                <div>
                  <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                    Terrain Color
                  </label>
                  <div className="flex items-center gap-2 mb-2">
                    <input
                      type="color"
                      value={customTerrainConfig.color}
                      onChange={(e) => setCustomTerrainConfig((prev) => ({ ...prev, color: e.target.value }))}
                      className="w-8 h-8 rounded border border-slate-700 bg-transparent cursor-pointer"
                    />
                    <input
                      type="text"
                      value={customTerrainConfig.color}
                      onChange={(e) => setCustomTerrainConfig((prev) => ({ ...prev, color: e.target.value }))}
                      className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 font-mono focus:outline-none focus:border-purple-500"
                    />
                  </div>
                  {/* Color Swatches */}
                  <div className="flex flex-wrap gap-1">
                    {COLOR_SWATCHES.map((hex) => (
                      <button
                        key={hex}
                        onClick={() => setCustomTerrainConfig((prev) => ({ ...prev, color: hex }))}
                        className={`w-5 h-5 rounded-full border cursor-pointer transition-transform hover:scale-110 ${
                          customTerrainConfig.color === hex ? 'ring-2 ring-white border-transparent' : 'border-slate-800'
                        }`}
                        style={{ backgroundColor: hex }}
                      />
                    ))}
                  </div>
                </div>

                {/* Symbol / Icon Selector */}
                <div>
                  <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-1">
                    Icon / Symbol
                  </label>
                  <input
                    type="text"
                    value={customTerrainConfig.symbol}
                    onChange={(e) => setCustomTerrainConfig((prev) => ({ ...prev, symbol: e.target.value }))}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 mb-2 focus:outline-none focus:border-purple-500"
                    placeholder="Enter emoji or icon symbol..."
                  />
                  {/* Emoji Quick Picker */}
                  <div className="grid grid-cols-8 gap-1">
                    {EMOJI_SWATCHES.map((emoji) => (
                      <button
                        key={emoji}
                        onClick={() => setCustomTerrainConfig((prev) => ({ ...prev, symbol: emoji }))}
                        className={`p-1 text-sm rounded hover:bg-slate-800 transition cursor-pointer text-center ${
                          customTerrainConfig.symbol === emoji ? 'bg-purple-900/80 border border-purple-500' : ''
                        }`}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Premade Quick Access Terrains */}
            <div>
              <label className="text-[10px] font-semibold uppercase text-slate-400 block mb-2">
                Premade Terrains
              </label>
              <div className="grid grid-cols-3 gap-2">
                {TERRAIN_LIST.map((t) => {
                  const isSelected = selectedTerrain === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setSelectedTerrain(t.id)}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                        isSelected
                          ? 'border-emerald-500 bg-emerald-950/40 ring-1 ring-emerald-500/50 shadow'
                          : 'border-slate-800 bg-slate-950/80 hover:border-slate-700 hover:bg-slate-800/50'
                      }`}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-sm shadow-inner"
                        style={{ backgroundColor: t.color, color: t.textColor }}
                      >
                        {t.symbol}
                      </div>
                      <span className="text-[11px] font-medium text-slate-200 text-center leading-tight truncate w-full">
                        {t.name.split('/')[0]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Terrain Info Card */}
            {selectedTerrain !== 'custom' && TERRAIN_DEFS[selectedTerrain] && (
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 text-xs space-y-1.5">
                <div className="flex items-center gap-2 font-semibold text-slate-100">
                  <span>{TERRAIN_DEFS[selectedTerrain].symbol}</span>
                  <span>{TERRAIN_DEFS[selectedTerrain].name}</span>
                </div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  {TERRAIN_DEFS[selectedTerrain].description}
                </p>
              </div>
            )}

            {/* Brush Settings */}
            <div className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                Paint Brush Size
              </label>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <button
                  onClick={() => setBrushRadius(0)}
                  className={`p-2 rounded-lg border font-medium cursor-pointer transition ${
                    brushRadius === 0
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Single Hex (1)
                </button>
                <button
                  onClick={() => setBrushRadius(1)}
                  className={`p-2 rounded-lg border font-medium cursor-pointer transition ${
                    brushRadius === 1
                      ? 'bg-emerald-600 text-white border-emerald-500'
                      : 'bg-slate-950 text-slate-400 border-slate-800 hover:bg-slate-800'
                  }`}
                >
                  Cluster (7 Hexes)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: UNIT CREATOR & MANAGER */}
        {activeTab === 'units' && (
          <div className="space-y-4">
            {/* Selected Unit Banner & Quick Controls */}
            {selectedUnit && (
              <div className="p-3 bg-amber-950/40 border border-amber-500/50 rounded-xl space-y-2.5 shadow-lg animate-in fade-in duration-150">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-4 h-4 rounded-full border border-white/40 shadow-inner shrink-0"
                      style={{ backgroundColor: selectedUnit.color }}
                    />
                    <span className="font-bold text-slate-100 truncate max-w-[120px]">{selectedUnit.name}</span>
                    <span className="text-[10px] text-amber-300 font-mono">({selectedUnit.q},{selectedUnit.r})</span>
                  </div>
                  <button
                    onClick={() => onSelectUnitOnMap(null)}
                    className="flex items-center gap-1 text-[11px] text-rose-300 hover:text-white bg-rose-950/80 px-2 py-0.5 rounded-md border border-rose-800 cursor-pointer transition"
                    title="Deselect unit (Esc)"
                  >
                    <XCircle className="w-3.5 h-3.5 text-rose-400" />
                    <span>Deselect</span>
                  </button>
                </div>

                <div className="flex items-center justify-between text-[11px] text-slate-300 pt-1.5 border-t border-amber-500/20">
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-amber-400">{selectedUnit.faction}</span>
                    <span>•</span>
                    <span className="text-slate-400">HP {selectedUnit.hp ?? 100}/{selectedUnit.maxHp ?? 100}</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {onOpenUnitEditModal && (
                      <button
                        onClick={onOpenUnitEditModal}
                        className="px-2 py-0.5 rounded border border-slate-700 bg-slate-900 hover:bg-slate-800 text-[10px] text-slate-300 font-medium cursor-pointer transition"
                      >
                        Edit Details
                      </button>
                    )}

                    {/* Toggle Hidden state directly */}
                    <button
                      onClick={() => {
                        const updated = { ...selectedUnit, isHidden: !selectedUnit.isHidden };
                        setMapState((prev) => ({
                          ...prev,
                          units: prev.units.map((u) => (u.id === selectedUnit.id ? updated : u)),
                        }));
                        onSelectUnitOnMap(updated);
                      }}
                      className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-semibold cursor-pointer transition ${
                        selectedUnit.isHidden
                          ? 'bg-purple-950/80 border-purple-800 text-purple-300 hover:bg-purple-900'
                          : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                      title={selectedUnit.isHidden ? 'Hidden from export' : 'Visible on export'}
                    >
                      {selectedUnit.isHidden ? <EyeOff className="w-3 h-3 text-purple-400" /> : <Eye className="w-3 h-3" />}
                      <span>{selectedUnit.isHidden ? 'Hidden' : 'Visible'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Create Unit Form */}
            <form onSubmit={handleCreateUnitSubmit} className="p-3 bg-slate-950 rounded-xl border border-slate-800 space-y-3">
              <div className="text-xs font-semibold text-slate-200 flex items-center justify-between">
                <span>Add New Unit Token</span>
                <span className="text-[10px] text-emerald-400 font-mono">Ready to Spawn</span>
              </div>

              <div>
                <label className="text-[11px] text-slate-400 block mb-1">Unit / Platoon Name</label>
                <input
                  type="text"
                  required
                  value={newUnitName}
                  onChange={(e) => setNewUnitName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Faction</label>
                  <select
                    value={newUnitFaction}
                    onChange={(e) => {
                      const f = e.target.value as UnitFaction;
                      setNewUnitFaction(f);
                      setNewUnitColor(factionColors[f]);
                    }}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    <option value="Player">Player (Blue)</option>
                    <option value="Enemy">Enemy (Red)</option>
                    <option value="NPC">NPC (Green)</option>
                    <option value="Neutral">Neutral (Amber)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Label Code</label>
                  <input
                    type="text"
                    value={newUnitLabel}
                    maxLength={5}
                    onChange={(e) => setNewUnitLabel(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-center"
                    placeholder="A1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Symbol / Type</label>
                  <select
                    value={newUnitSymbol}
                    onChange={(e) => setNewUnitSymbol(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 rounded-lg px-2 py-1 text-xs text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {symbols.map((sym) => (
                      <option key={sym} value={sym}>
                        {sym}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[11px] text-slate-400 block mb-1">Token Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newUnitColor}
                      onChange={(e) => setNewUnitColor(e.target.value)}
                      className="w-8 h-7 bg-transparent rounded cursor-pointer border border-slate-800"
                    />
                    <span className="text-[10px] font-mono text-slate-400 uppercase">{newUnitColor}</span>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow transition"
              >
                + Spawn Unit on Map
              </button>
            </form>

            {/* Placed Units List */}
            <div className="space-y-2 pt-2 border-t border-slate-800">
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block">
                Placed Units ({mapState.units.length})
              </label>

              {mapState.units.length === 0 ? (
                <p className="text-xs text-slate-500 italic p-2">No units deployed on grid yet.</p>
              ) : (
                <div className="space-y-1.5 max-h-60 overflow-y-auto pr-1">
                  {mapState.units.map((u) => {
                    const isSelected = selectedUnit?.id === u.id;
                    return (
                      <div
                        key={u.id}
                        onClick={() => onSelectUnitOnMap(u)}
                        className={`p-2 rounded-lg border flex items-center justify-between gap-2 text-xs transition cursor-pointer ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-950/40 text-slate-100'
                            : 'border-slate-800 bg-slate-950/60 hover:bg-slate-800/80 text-slate-300'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-5 h-5 rounded-full flex items-center justify-center font-bold text-[9px] text-white shrink-0 shadow-inner"
                            style={{ backgroundColor: u.color }}
                          >
                            {u.label || u.name.substring(0, 2)}
                          </div>
                          <div className="min-w-0">
                            <div className="font-semibold truncate text-[11px]">{u.name}</div>
                            <div className="text-[10px] text-slate-400 font-mono">
                              Hex: ({u.q},{u.r}) • {u.faction}
                            </div>
                          </div>
                        </div>

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onDeleteUnit(u.id);
                          }}
                          className="p-1 text-slate-500 hover:text-rose-400 rounded cursor-pointer"
                          title="Remove Unit"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 4: GRID SETTINGS */}
        {activeTab === 'settings' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-2">
                Grid Radius & Size
              </label>
              <div className="space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
                <div>
                  <div className="flex justify-between text-slate-300 mb-1">
                    <span>Hex Pixel Radius:</span>
                    <span className="font-mono text-emerald-400">{mapState.gridSettings.radius}px</span>
                  </div>
                  <input
                    type="range"
                    min="20"
                    max="60"
                    value={mapState.gridSettings.radius}
                    onChange={(e) => updateGridSettings('radius', Number(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="pt-2 border-t border-slate-800 space-y-2">
                  <span className="text-slate-400 block">Axial Grid Bounds (-q/r to +q/r)</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-slate-400 block">Min Q/R</label>
                      <input
                        type="number"
                        value={mapState.gridSettings.bounds.minQ}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateGridBounds('minQ', val);
                          updateGridBounds('minR', val);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-slate-400 block">Max Q/R</label>
                      <input
                        type="number"
                        value={mapState.gridSettings.bounds.maxQ}
                        onChange={(e) => {
                          const val = Number(e.target.value);
                          updateGridBounds('maxQ', val);
                          updateGridBounds('maxR', val);
                        }}
                        className="w-full bg-slate-900 border border-slate-800 rounded px-2 py-1 text-xs text-slate-100 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
                  <span className="text-slate-300">Show Coordinates</span>
                  <input
                    type="checkbox"
                    checked={mapState.gridSettings.showCoordinates}
                    onChange={(e) => updateGridSettings('showCoordinates', e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between pt-1">
                  <span className="text-slate-300">Grid Line Color</span>
                  <input
                    type="color"
                    value={mapState.gridSettings.gridColor}
                    onChange={(e) => updateGridSettings('gridColor', e.target.value)}
                    className="w-7 h-6 bg-transparent cursor-pointer rounded border border-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
