import { TerrainDef, TerrainCategory } from '../types';

export const TERRAIN_DEFS: Record<TerrainCategory, TerrainDef> = {
  clear: {
    id: 'clear',
    name: 'Clear / Plains',
    color: '#3a4d39', // Tactical olive green-gray
    borderColor: '#4d644b',
    textColor: '#e2e8f0',
    symbol: '🌾',
    description: 'Open terrain and grassy fields.',
  },
  forest: {
    id: 'forest',
    name: 'Dense Forest',
    color: '#166534', // Deep green
    borderColor: '#22c55e',
    textColor: '#f0fdf4',
    symbol: '🌲',
    description: 'Wooded tree cover and thick foliage.',
  },
  mountain: {
    id: 'mountain',
    name: 'Alpine Mountain',
    color: '#475569', // Granite slate
    borderColor: '#94a3b8',
    textColor: '#f8fafc',
    symbol: '⛰️',
    description: 'Steep rocky peaks and high ridge lines.',
  },
  water: {
    id: 'water',
    name: 'Deep Water / River',
    color: '#1e3a8a', // Deep tactical blue
    borderColor: '#3b82f6',
    textColor: '#eff6ff',
    symbol: '🌊',
    description: 'Rivers, lakes, or open water barriers.',
  },
  urban: {
    id: 'urban',
    name: 'Urban / Ruins',
    color: '#78350f', // Industrial rust brown
    borderColor: '#f59e0b',
    textColor: '#fffbeb',
    symbol: '🏢',
    description: 'Dense masonry buildings and city structures.',
  },
  fortification: {
    id: 'fortification',
    name: 'Fortification / Trench',
    color: '#854d0e', // Steel / sandbag amber
    borderColor: '#eab308',
    textColor: '#fefce8',
    symbol: '🏰',
    description: 'Bunkers, trenches, and defensive earthworks.',
  },
  marsh: {
    id: 'marsh',
    name: 'Marsh / Swamp',
    color: '#365314', // Muddy dark olive
    borderColor: '#84cc16',
    textColor: '#f7fee7',
    symbol: '🐸',
    description: 'Boggy ground, swamps, and muddy wetlands.',
  },
  desert: {
    id: 'desert',
    name: 'Sand Dunes / Desert',
    color: '#a16207', // Warm sand gold
    borderColor: '#facc15',
    textColor: '#fefce8',
    symbol: '🏜️',
    description: 'Arid desert, sand dunes, and wasteland.',
  },
  road: {
    id: 'road',
    name: 'Paved Road / Highway',
    color: '#334155', // Dark asphalt
    borderColor: '#64748b',
    textColor: '#f8fafc',
    symbol: '',
    description: 'Paved highway or dirt transport track.',
  },
};

export const TERRAIN_LIST = Object.values(TERRAIN_DEFS);

