import React from 'react';
import {
  MousePointer,
  Paintbrush,
  Eraser,
  UserPlus,
  Ruler,
  Hand,
  Download,
  Copy,
  Database,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Save,
  Check,
  Lock,
  Unlock,
  Menu,
} from 'lucide-react';
import { ToolMode, AxialCoord } from '../types';

interface NavbarProps {
  mapTitle: string;
  ownerName?: string;
  toolMode: ToolMode;
  setToolMode: (mode: ToolMode) => void;
  hoveredHex: AxialCoord | null;
  zoomLevel: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetView: () => void;
  onSaveMap: () => void;
  onOpenExport: () => void;
  onOpenSupabaseModal: () => void;
  onOpenMainMenu: () => void;
  supabaseSource: 'supabase' | 'local';
  isSaving: boolean;
  saveSuccessToast: boolean;
  onQuickCopyPNG: () => void;
  copySuccessToast: boolean;
  isGmUnlocked: boolean;
  onToggleGmLock: () => void;
  hasGmPasscode: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  mapTitle,
  ownerName,
  toolMode,
  setToolMode,
  hoveredHex,
  zoomLevel,
  onZoomIn,
  onZoomOut,
  onResetView,
  onSaveMap,
  onOpenExport,
  onOpenSupabaseModal,
  onOpenMainMenu,
  supabaseSource,
  isSaving,
  saveSuccessToast,
  onQuickCopyPNG,
  copySuccessToast,
  isGmUnlocked,
  onToggleGmLock,
  hasGmPasscode,
}) => {
  const tools: { id: ToolMode; label: string; icon: React.ReactNode; shortcut: string }[] = [
    { id: 'select', label: 'Select / Move Unit', icon: <MousePointer className="w-4 h-4" />, shortcut: 'V' },
    { id: 'paint', label: 'Paint Terrain', icon: <Paintbrush className="w-4 h-4" />, shortcut: 'B' },
    { id: 'erase', label: 'Clear Hex', icon: <Eraser className="w-4 h-4" />, shortcut: 'E' },
    { id: 'unit_spawn', label: 'Spawn Unit', icon: <UserPlus className="w-4 h-4" />, shortcut: 'U' },
    { id: 'measure', label: 'Measure Distance', icon: <Ruler className="w-4 h-4" />, shortcut: 'M' },
    { id: 'pan', label: 'Pan Viewport', icon: <Hand className="w-4 h-4" />, shortcut: 'H' },
  ];

  return (
    <header className="h-14 bg-slate-900 border-b border-slate-800 px-4 flex items-center justify-between gap-4 select-none z-20">
      {/* Title & Storage Indicator */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenMainMenu}
          className="p-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-100 font-bold text-xs rounded-lg flex items-center gap-2 cursor-pointer transition shadow-sm hover:border-emerald-500"
          title="Open Main Menu & Map Manager"
        >
          <Menu className="w-4 h-4 text-emerald-400" />
          <span className="hidden md:inline font-semibold">Main Menu</span>
        </button>

        <div className="p-2 bg-emerald-950/80 border border-emerald-800/60 rounded-lg text-emerald-400 font-bold text-sm tracking-wider flex items-center gap-1.5 shadow-sm">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
          HEX VTT
        </div>
        <div className="hidden sm:block">
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-slate-100 max-w-[180px] truncate">{mapTitle}</h1>
            
            {/* GM Lock Status Badge */}
            <button
              onClick={onToggleGmLock}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border cursor-pointer transition ${
                !isGmUnlocked
                  ? 'bg-rose-950/80 border-rose-800/80 text-rose-300 hover:bg-rose-900'
                  : hasGmPasscode
                  ? 'bg-amber-950/80 border-amber-800/80 text-amber-300 hover:bg-amber-900'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
              }`}
              title={!isGmUnlocked ? 'GM Locked - Click to unlock' : 'GM Mode Active - Click to lock'}
            >
              {!isGmUnlocked ? <Lock className="w-3 h-3 text-rose-400" /> : <Unlock className="w-3 h-3 text-emerald-400" />}
              <span>{!isGmUnlocked ? 'GM Locked' : ownerName ? `GM: ${ownerName}` : 'GM Mode'}</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <button
              onClick={onOpenSupabaseModal}
              className={`flex items-center gap-1 hover:underline cursor-pointer ${
                supabaseSource === 'supabase' ? 'text-emerald-400 font-medium' : 'text-amber-400 font-medium'
              }`}
            >
              <Database className="w-3 h-3" />
              {supabaseSource === 'supabase' ? 'Supabase Connected' : 'Local Storage Mode'}
            </button>
          </div>
        </div>
      </div>

      {/* Tool Selector Buttons */}
      <div className="flex items-center gap-1 bg-slate-950/80 p-1 rounded-xl border border-slate-800/80">
        {tools.map((t) => {
          const isActive = toolMode === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setToolMode(t.id)}
              title={`${t.label} (${t.shortcut})`}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-950 border border-emerald-500/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              }`}
            >
              {t.icon}
              <span className="hidden lg:inline">{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Right Controls: Hover HUD, Zoom, Save, Export */}
      <div className="flex items-center gap-2">
        {/* Hover Coordinate HUD */}
        {hoveredHex && (
          <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 bg-slate-950 rounded-lg border border-slate-800 text-xs font-mono text-emerald-400">
            <span className="text-slate-500">Axial:</span>
            <span>
              q:{hoveredHex.q}, r:{hoveredHex.r}
            </span>
          </div>
        )}

        {/* Zoom Buttons */}
        <div className="hidden sm:flex items-center gap-0.5 bg-slate-950 rounded-lg p-0.5 border border-slate-800 text-slate-300 text-xs">
          <button
            onClick={onZoomOut}
            className="p-1.5 hover:bg-slate-800 rounded hover:text-white cursor-pointer"
            title="Zoom Out"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <span className="px-1.5 font-mono text-[11px] text-slate-400">{Math.round(zoomLevel * 100)}%</span>
          <button
            onClick={onZoomIn}
            className="p-1.5 hover:bg-slate-800 rounded hover:text-white cursor-pointer"
            title="Zoom In"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onResetView}
            className="p-1.5 hover:bg-slate-800 rounded hover:text-white cursor-pointer border-l border-slate-800"
            title="Reset Zoom & Pan"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Save Map */}
        <button
          onClick={onSaveMap}
          disabled={isSaving}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer border ${
            saveSuccessToast
              ? 'bg-emerald-600 text-white border-emerald-500'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-100 border-slate-700'
          }`}
        >
          {saveSuccessToast ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
          <span className="hidden sm:inline">{saveSuccessToast ? 'Saved!' : 'Save'}</span>
        </button>

        {/* Quick Copy PNG */}
        <button
          onClick={onQuickCopyPNG}
          title="Copy High-Res PNG to Clipboard"
          className="hidden md:flex items-center gap-1.5 px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-xs font-medium text-slate-200 cursor-pointer"
        >
          {copySuccessToast ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
          <span>{copySuccessToast ? 'Copied!' : 'Copy PNG'}</span>
        </button>

        {/* Export High-Res Modal Trigger */}
        <button
          onClick={onOpenExport}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-sm shadow-emerald-950 border border-emerald-400/30"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export</span>
        </button>
      </div>
    </header>
  );
};
