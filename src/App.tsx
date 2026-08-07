import React, { useState, useEffect, useCallback } from 'react';
import {
  WargameMapState,
  ToolMode,
  AxialCoord,
  Unit,
  TerrainCategory,
  SupabaseMapRecord,
  Orientation,
} from './types';
import { PRESET_MAPS } from './data/presets';
import {
  fetchAllMaps,
  saveMapToBackend,
} from './lib/supabaseClient';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { HexCanvas } from './components/HexCanvas';
import { StackModal } from './components/StackModal';
import { ExportModal } from './components/ExportModal';
import { UnitEditModal } from './components/UnitEditModal';
import { GmPasscodeModal } from './components/GmPasscodeModal';
import { MainMenuModal } from './components/MainMenuModal';
import { copyMapImageToClipboard } from './lib/exportEngine';

// Local Memory Helpers for Creator GM Device Ownership & Session Keys
const MY_CREATED_MAPS_KEY = 'hex_vtt_my_created_maps';
const UNLOCKED_SESSION_MAPS_KEY = 'hex_vtt_unlocked_sessions';

function getMyCreatedMapIds(): string[] {
  try {
    return JSON.parse(localStorage.getItem(MY_CREATED_MAPS_KEY) || '[]');
  } catch {
    return [];
  }
}

function registerMyCreatedMap(mapId: string) {
  const list = getMyCreatedMapIds();
  if (!list.includes(mapId)) {
    list.push(mapId);
    localStorage.setItem(MY_CREATED_MAPS_KEY, JSON.stringify(list));
  }
}

function getSessionUnlockedMapIds(): string[] {
  try {
    return JSON.parse(sessionStorage.getItem(UNLOCKED_SESSION_MAPS_KEY) || '[]');
  } catch {
    return [];
  }
}

function registerSessionUnlockedMap(mapId: string) {
  const list = getSessionUnlockedMapIds();
  if (!list.includes(mapId)) {
    list.push(mapId);
    sessionStorage.setItem(UNLOCKED_SESSION_MAPS_KEY, JSON.stringify(list));
  }
}

export default function App() {
  const [mapState, setMapState] = useState<WargameMapState>(PRESET_MAPS.crossroads);
  const [savedMaps, setSavedMaps] = useState<SupabaseMapRecord[]>([]);
  const [currentMapId, setCurrentMapId] = useState<string | null>('preset_crossroads');

  // Active Tool & Canvas State
  const [toolMode, setToolMode] = useState<ToolMode>('select');
  const [selectedTerrain, setSelectedTerrain] = useState<TerrainCategory | 'custom'>('forest');
  const [customTerrainConfig, setCustomTerrainConfig] = useState<{
    name: string;
    color: string;
    symbol: string;
  }>({
    name: 'Volcanic Lava',
    color: '#dc2626',
    symbol: '🌋',
  });

  // GM Protection & Ownership State
  const [isGmUnlocked, setIsGmUnlocked] = useState<boolean>(true);
  const [gmPasscodeModalOpen, setGmPasscodeModalOpen] = useState(false);

  const [brushRadius, setBrushRadius] = useState<number>(0);
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null);
  const [hoveredHex, setHoveredHex] = useState<AxialCoord | null>(null);

  // Canvas Viewport Transform
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 250, y: 250 });

  // Unit Spawning State
  const [pendingSpawnUnit, setPendingSpawnUnit] = useState<Omit<Unit, 'id' | 'q' | 'r'> | null>(null);

  // Modals & Popovers
  const [mainMenuModalOpen, setMainMenuModalOpen] = useState(true); // Open Main Menu on initial load
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [stackModalOpen, setStackModalOpen] = useState(false);
  const [stackUnits, setStackUnits] = useState<Unit[]>([]);
  const [stackCoord, setStackCoord] = useState<AxialCoord | null>(null);
  const [unitEditModalOpen, setUnitEditModalOpen] = useState(false);

  // Toasts
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccessToast, setSaveSuccessToast] = useState(false);
  const [copySuccessToast, setCopySuccessToast] = useState(false);

  // Check GM Lock state for a map
  const checkGmAccess = useCallback((map: WargameMapState, mapId: string | null) => {
    const pass = map.accessPassword || map.gmPasscode;
    if (!pass) return true; // No password -> open map
    if (mapId && getMyCreatedMapIds().includes(mapId)) return true; // Creator device -> auto-unlocked
    if (mapId && getSessionUnlockedMapIds().includes(mapId)) return true; // Unlocked in session -> open
    return false;
  }, []);

  // Fetch maps on initial load
  const refreshMapsList = useCallback(async () => {
    const res = await fetchAllMaps();
    setSavedMaps(res.maps);
  }, []);

  useEffect(() => {
    refreshMapsList();
  }, [refreshMapsList]);

  // Keyboard Shortcuts Listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (
        document.activeElement?.tagName === 'INPUT' ||
        document.activeElement?.tagName === 'TEXTAREA' ||
        document.activeElement?.tagName === 'SELECT'
      ) {
        return;
      }

      switch (e.key.toLowerCase()) {
        case 'v':
          setToolMode('select');
          break;
        case 'b':
          setToolMode('paint');
          break;
        case 'e':
          setToolMode('erase');
          break;
        case 'u':
          setToolMode('unit_spawn');
          break;
        case 'm':
          setToolMode('measure');
          break;
        case 'h':
          setToolMode('pan');
          break;
        case 'escape':
          setSelectedUnit(null);
          setPendingSpawnUnit(null);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Save Map Handler
  const handleSaveMap = async () => {
    setIsSaving(true);
    const res = await saveMapToBackend(mapState.title, mapState, currentMapId || undefined);
    setIsSaving(false);

    if (res.record) {
      setCurrentMapId(res.record.id);
      registerMyCreatedMap(res.record.id);
      registerSessionUnlockedMap(res.record.id);
      setIsGmUnlocked(true);
      setSaveSuccessToast(true);
      setTimeout(() => setSaveSuccessToast(false), 2500);
      refreshMapsList();
    }
  };

  // Load Map Record
  const handleSelectMapRecord = (record: SupabaseMapRecord) => {
    setCurrentMapId(record.id);
    setMapState(record.state_json);
    setSelectedUnit(null);
    setIsGmUnlocked(checkGmAccess(record.state_json, record.id));
  };

  // Load Map State from Main Menu
  const handleLoadMapStateFromMenu = (newState: WargameMapState, recordId?: string) => {
    const id = recordId || 'map_' + Date.now();
    setCurrentMapId(id);
    setMapState(newState);
    setSelectedUnit(null);
    setIsGmUnlocked(checkGmAccess(newState, id));
  };

  // Create New Map Custom Config
  const handleNewCustomMap = (config: {
    title: string;
    ownerName: string;
    accessPassword?: string;
    radius: number;
    orientation: Orientation;
    presetTerrain?: string;
  }) => {
    const newId = 'map_' + Date.now();
    const bounds = {
      minQ: -config.radius,
      maxQ: config.radius,
      minR: -config.radius,
      maxR: config.radius,
    };

    const newMapState: WargameMapState = {
      version: '1.0.0',
      title: config.title,
      ownerName: config.ownerName,
      accessPassword: config.accessPassword,
      gmPasscode: config.accessPassword,
      currentTurn: 1,
      turnLogs: [
        {
          id: '1',
          turn: 1,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          author: config.ownerName,
          text: `Sector initialized by ${config.ownerName}.`,
        },
      ],
      gridSettings: {
        radius: 35,
        orientation: config.orientation,
        bounds,
        showCoordinates: true,
        gridColor: '#334155',
        gridLineWidth: 1,
      },
      terrains: {},
      units: [],
    };

    registerMyCreatedMap(newId);
    registerSessionUnlockedMap(newId);
    setCurrentMapId(newId);
    setMapState(newMapState);
    setIsGmUnlocked(true);
    setSelectedUnit(null);

    // Save to backend immediately
    saveMapToBackend(config.title, newMapState, newId).then((res) => {
      if (res.record) {
        setCurrentMapId(res.record.id);
        registerMyCreatedMap(res.record.id);
        registerSessionUnlockedMap(res.record.id);
        refreshMapsList();
      }
    });
  };

  // Create New Empty Map (legacy trigger)
  const handleNewMap = () => {
    handleNewCustomMap({
      title: 'New Wargame Sector',
      ownerName: 'Game Master',
      radius: 11,
      orientation: 'pointy',
    });
  };

  // Load Preset Template
  const handleLoadPreset = (presetKey: string) => {
    const preset = PRESET_MAPS[presetKey] || PRESET_MAPS.empty;
    const newId = 'preset_' + presetKey;
    setCurrentMapId(newId);
    setMapState(preset);
    setSelectedUnit(null);
    setIsGmUnlocked(checkGmAccess(preset, newId));
  };

  // Clear all painted terrain
  const handleClearAllTerrain = () => {
    if (window.confirm('Clear all painted terrain on this map?')) {
      setMapState((prev) => ({ ...prev, terrains: {} }));
    }
  };

  // Spawn unit setup trigger
  const handleSpawnUnit = (unitData: Omit<Unit, 'id' | 'q' | 'r'>) => {
    setPendingSpawnUnit(unitData);
    setToolMode('unit_spawn');
  };

  // Delete Unit
  const handleDeleteUnit = (id: string) => {
    setMapState((prev) => ({
      ...prev,
      units: prev.units.filter((u) => u.id !== id),
    }));
    if (selectedUnit?.id === id) {
      setSelectedUnit(null);
    }
  };

  // Edit Unit Save
  const handleSaveUnit = (updatedUnit: Unit) => {
    setMapState((prev) => ({
      ...prev,
      units: prev.units.map((u) => (u.id === updatedUnit.id ? updatedUnit : u)),
    }));
    setSelectedUnit(updatedUnit);
  };

  // Quick Copy PNG to Clipboard
  const handleQuickCopyPNG = async () => {
    const ok = await copyMapImageToClipboard(mapState);
    if (ok) {
      setCopySuccessToast(true);
      setTimeout(() => setCopySuccessToast(false), 2500);
    }
  };

  // Reset Zoom & Viewport Offset
  const handleResetView = () => {
    setZoomLevel(1.0);
    setPanOffset({ x: 300, y: 300 });
  };

  // GM Lock Toggle
  const handleToggleGmLock = () => {
    const pass = mapState.accessPassword || mapState.gmPasscode;
    if (isGmUnlocked) {
      setIsGmUnlocked(false);
    } else {
      if (!pass) {
        setIsGmUnlocked(true);
      } else {
        setGmPasscodeModalOpen(true);
      }
    }
  };

  return (
    <div className="flex flex-col h-screen w-screen bg-slate-950 font-sans text-slate-100 overflow-hidden select-none">
      {/* Top Navbar */}
      <Navbar
        mapTitle={mapState.title}
        ownerName={mapState.ownerName}
        toolMode={toolMode}
        setToolMode={setToolMode}
        hoveredHex={hoveredHex}
        zoomLevel={zoomLevel}
        onZoomIn={() => setZoomLevel((z) => Math.min(3.5, z * 1.15))}
        onZoomOut={() => setZoomLevel((z) => Math.max(0.3, z * 0.85))}
        onResetView={handleResetView}
        onSaveMap={handleSaveMap}
        onOpenExport={() => setExportModalOpen(true)}
        onOpenMainMenu={() => setMainMenuModalOpen(true)}
        isSaving={isSaving}
        saveSuccessToast={saveSuccessToast}
        onQuickCopyPNG={handleQuickCopyPNG}
        copySuccessToast={copySuccessToast}
        isGmUnlocked={isGmUnlocked}
        onToggleGmLock={handleToggleGmLock}
        hasGmPasscode={!!(mapState.accessPassword || mapState.gmPasscode)}
      />

      {/* Main App Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Sidebar Control Panel */}
        <Sidebar
          mapState={mapState}
          setMapState={setMapState}
          savedMaps={savedMaps}
          currentMapId={currentMapId}
          onSelectMapRecord={handleSelectMapRecord}
          onNewMap={handleNewMap}
          onLoadPreset={handleLoadPreset}
          selectedTerrain={selectedTerrain}
          setSelectedTerrain={(t) => {
            setSelectedTerrain(t);
            setToolMode('paint');
          }}
          customTerrainConfig={customTerrainConfig}
          setCustomTerrainConfig={setCustomTerrainConfig}
          isGmUnlocked={isGmUnlocked}
          setIsGmUnlocked={setIsGmUnlocked}
          onPromptGmUnlock={() => setGmPasscodeModalOpen(true)}
          brushRadius={brushRadius}
          setBrushRadius={setBrushRadius}
          onSpawnUnit={handleSpawnUnit}
          selectedUnit={selectedUnit}
          onSelectUnitOnMap={(u) => {
            setSelectedUnit(u);
          }}
          onOpenUnitEditModal={() => setUnitEditModalOpen(true)}
          onDeleteUnit={handleDeleteUnit}
          onClearAllTerrain={handleClearAllTerrain}
        />

        {/* Central Interactive HTML5 Hex Canvas Viewport */}
        <HexCanvas
          mapState={mapState}
          setMapState={setMapState}
          toolMode={toolMode}
          selectedTerrain={selectedTerrain}
          customTerrainConfig={customTerrainConfig}
          brushRadius={brushRadius}
          selectedUnit={selectedUnit}
          setSelectedUnit={setSelectedUnit}
          hoveredHex={hoveredHex}
          setHoveredHex={setHoveredHex}
          zoomLevel={zoomLevel}
          setZoomLevel={setZoomLevel}
          panOffset={panOffset}
          setPanOffset={setPanOffset}
          isGmLocked={!isGmUnlocked}
          onPromptGmUnlock={() => setGmPasscodeModalOpen(true)}
          onOpenStackModal={(units, coord) => {
            setStackUnits(units);
            setStackCoord(coord);
            setStackModalOpen(true);
          }}
          pendingSpawnUnit={pendingSpawnUnit}
          setPendingSpawnUnit={setPendingSpawnUnit}
        />
      </div>

      {/* MODALS */}
      {/* 0. Main Menu & Map Selector Modal */}
      <MainMenuModal
        isOpen={mainMenuModalOpen}
        onClose={() => setMainMenuModalOpen(false)}
        onLoadMapState={handleLoadMapStateFromMenu}
        onNewCustomMap={handleNewCustomMap}
        savedMaps={savedMaps}
        refreshMapsList={refreshMapsList}
      />

      {/* 1. Stack Inspector Modal */}
      <StackModal
        isOpen={stackModalOpen}
        onClose={() => setStackModalOpen(false)}
        units={stackUnits}
        coord={stackCoord}
        onSelectUnit={(u) => {
          setSelectedUnit(u);
          setUnitEditModalOpen(true);
        }}
        onDeleteUnit={handleDeleteUnit}
      />

      {/* 2. Unit Edit Modal */}
      <UnitEditModal
        isOpen={unitEditModalOpen}
        onClose={() => setUnitEditModalOpen(false)}
        unit={selectedUnit}
        onSaveUnit={handleSaveUnit}
        onDeleteUnit={handleDeleteUnit}
      />

      {/* 3. Export High-Res PNG Modal */}
      <ExportModal
        isOpen={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        mapState={mapState}
      />

      {/* 4. GM Passcode Modal */}
      <GmPasscodeModal
        isOpen={gmPasscodeModalOpen}
        onClose={() => setGmPasscodeModalOpen(false)}
        requiredPasscode={mapState.accessPassword || mapState.gmPasscode}
        ownerName={mapState.ownerName}
        onSuccess={() => {
          if (currentMapId) {
            registerSessionUnlockedMap(currentMapId);
          }
          setIsGmUnlocked(true);
          setGmPasscodeModalOpen(false);
        }}
      />
    </div>
  );
}

