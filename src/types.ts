export interface AxialCoord {
  q: number;
  r: number;
}

export type Orientation = 'pointy' | 'flat';

export type ToolMode = 'select' | 'paint' | 'erase' | 'unit_spawn' | 'measure' | 'pan';

export type TerrainCategory = 
  | 'clear' 
  | 'forest' 
  | 'mountain' 
  | 'water' 
  | 'urban' 
  | 'fortification' 
  | 'marsh' 
  | 'desert' 
  | 'road';

export interface TerrainDef {
  id: TerrainCategory;
  name: string;
  color: string;
  borderColor: string;
  textColor: string;
  symbol: string;
  description: string;
}

export interface TerrainTile {
  type: TerrainCategory | 'custom';
  color?: string;
  customName?: string;
  customSymbol?: string;
  elevation?: number;
  notes?: string;
}

export type UnitFaction = 'Player' | 'Enemy' | 'NPC' | 'Neutral';

export type UnitStatus = 'Active' | 'Moved' | 'Suppressed' | 'Fortified' | 'Damaged' | 'Destroyed';

export interface Unit {
  id: string;
  name: string;
  faction: UnitFaction;
  color: string;
  q: number;
  r: number;
  label: string; // e.g. "A1", "1st Platoon"
  symbol?: string; // NATO icon or tactical symbol
  status?: UnitStatus;
  hp?: number;
  maxHp?: number;
  notes?: string;
  isHidden?: boolean; // GM Fog of War / Hidden unit
}

export interface GridSettings {
  radius: number; // Hex radius in pixels (e.g. 35)
  orientation: Orientation;
  bounds: {
    minQ: number;
    maxQ: number;
    minR: number;
    maxR: number;
  };
  showCoordinates: boolean;
  gridColor: string;
  gridLineWidth: number;
}

export interface TurnLogEntry {
  id: string;
  turn: number;
  timestamp: string;
  author: string;
  text: string;
}

export interface WargameMapState {
  version: string;
  gameId?: string;
  gameCode?: string; // Room / Join Code for play-by-post
  gameName?: string;
  ownerName?: string; // GM / Creator Username (e.g. "GM Matt")
  accessPassword?: string; // GM Password for co-GMs & edit protection
  gmPasscode?: string; // Legacy field alias
  title: string;
  description?: string;
  currentTurn?: number;
  turnLogs?: TurnLogEntry[];
  gridSettings: GridSettings;
  terrains: Record<string, TerrainTile>; // key is "q,r"
  units: Unit[];
  updatedAt?: string;
}

export interface SupabaseMapRecord {
  id: string;
  name: string;
  updated_at: string;
  state_json: WargameMapState;
}
