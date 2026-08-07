import { WargameMapState } from '../types';
import {
  hexToPixel,
  getHexVertices,
  coordKey,
  getGridHexes,
  AxialCoord,
} from './hexMath';
import { TERRAIN_DEFS } from '../data/terrainDefs';

export async function renderMapToOffscreenCanvas(
  state: WargameMapState,
  scaleFactor: number = 2
): Promise<HTMLCanvasElement> {
  const { gridSettings, terrains, units } = state;
  const radius = gridSettings.radius;

  // Calculate pixel bounding box of all hexes
  const allHexes = getGridHexes(gridSettings.bounds);
  let minX = Infinity,
    maxX = -Infinity,
    minY = Infinity,
    maxY = -Infinity;

  allHexes.forEach((hex) => {
    const center = hexToPixel(hex.q, hex.r, radius);
    const verts = getHexVertices(center.x, center.y, radius);
    verts.forEach((v) => {
      minX = Math.min(minX, v.x);
      maxX = Math.max(maxX, v.x);
      minY = Math.min(minY, v.y);
      maxY = Math.max(maxY, v.y);
    });
  });

  const bannerHeight = 80;
  const padding = 50;

  const mapWidth = maxX - minX + padding * 2;
  const mapHeight = maxY - minY + padding * 2 + bannerHeight;

  const offscreen = document.createElement('canvas');
  offscreen.width = Math.ceil(mapWidth * scaleFactor);
  offscreen.height = Math.ceil(mapHeight * scaleFactor);

  const ctx = offscreen.getContext('2d');
  if (!ctx) throw new Error('Could not get 2D context');

  // Scale context for ultra crisp high-res output
  ctx.scale(scaleFactor, scaleFactor);

  // Background
  ctx.fillStyle = '#0f172a'; // Dark slate slate-900 background
  ctx.fillRect(0, 0, mapWidth, mapHeight);

  // Title Banner
  ctx.fillStyle = '#1e293b';
  ctx.fillRect(0, 0, mapWidth, bannerHeight);
  ctx.strokeStyle = '#334155';
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(0, bannerHeight);
  ctx.lineTo(mapWidth, bannerHeight);
  ctx.stroke();

  // Banner Text
  ctx.fillStyle = '#f8fafc';
  ctx.font = 'bold 22px system-ui, sans-serif';
  ctx.fillText(state.title || 'Wargame Map', padding, 36);

  ctx.fillStyle = '#94a3b8';
  ctx.font = '13px system-ui, sans-serif';
  const totalUnits = units.length;
  const subtext = `${state.description || 'Play-by-Post Hex Map'} • Bounds: (${gridSettings.bounds.minQ},${gridSettings.bounds.minR}) to (${gridSettings.bounds.maxQ},${gridSettings.bounds.maxR}) • Units: ${totalUnits}`;
  ctx.fillText(subtext, padding, 60);

  // Offset origin so map centers cleanly below banner
  const offsetX = padding - minX;
  const offsetY = padding - minY + bannerHeight;

  // Render Hex Terrains & Grid
  allHexes.forEach((hex) => {
    const center = hexToPixel(hex.q, hex.r, radius);
    const cx = center.x + offsetX;
    const cy = center.y + offsetY;
    const key = coordKey(hex.q, hex.r);
    const tile = terrains[key];
    const terrainDef = tile ? TERRAIN_DEFS[tile.type] : TERRAIN_DEFS.clear;

    const verts = getHexVertices(cx, cy, radius);

    // Fill Hex
    ctx.beginPath();
    ctx.moveTo(verts[0].x, verts[0].y);
    for (let i = 1; i < 6; i++) {
      ctx.lineTo(verts[i].x, verts[i].y);
    }
    ctx.closePath();

    ctx.fillStyle = terrainDef.color;
    ctx.fill();

    // Border
    ctx.strokeStyle = gridSettings.gridColor || '#475569';
    ctx.lineWidth = gridSettings.gridLineWidth || 1;
    ctx.stroke();

    // Terrain Icon / Symbol
    if (terrainDef.symbol && terrainDef.id !== 'clear') {
      ctx.fillStyle = terrainDef.textColor;
      ctx.font = `${radius * 0.55}px sans-serif`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(terrainDef.symbol, cx, cy - (gridSettings.showCoordinates ? 4 : 0));
    }

    // Coordinate Text
    if (gridSettings.showCoordinates) {
      ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
      ctx.font = '10px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'bottom';
      ctx.fillText(`${hex.q},${hex.r}`, cx, cy + radius * 0.75);
    }
  });

  // Group Units by Stack (Excluding Hidden Units for exported images)
  const visibleUnits = units.filter((u) => !u.isHidden);
  const unitStacks: Record<string, typeof units> = {};
  visibleUnits.forEach((u) => {
    const k = coordKey(u.q, u.r);
    if (!unitStacks[k]) unitStacks[k] = [];
    unitStacks[k].push(u);
  });

  // Draw Unit Tokens
  Object.entries(unitStacks).forEach(([key, stack]) => {
    const [q, r] = key.split(',').map(Number);
    const center = hexToPixel(q, r, radius);
    const cx = center.x + offsetX;
    const cy = center.y + offsetY;

    const topUnit = stack[0];
    const tokenRadius = radius * 0.55;

    // Draw main token
    ctx.beginPath();
    ctx.arc(cx, cy, tokenRadius, 0, Math.PI * 2);
    ctx.fillStyle = topUnit.color || '#2563eb';
    ctx.fill();
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2.5;
    ctx.stroke();

    // Unit Label / Symbol
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 12px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(topUnit.label || topUnit.name.substring(0, 3), cx, cy);

    // Unit Name below token
    ctx.fillStyle = '#f8fafc';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText(topUnit.name, cx, cy + tokenRadius + 12);

    // Stacking Badge
    if (stack.length > 1) {
      const badgeX = cx + tokenRadius * 0.65;
      const badgeY = cy - tokenRadius * 0.65;
      const badgeRadius = 10;

      ctx.beginPath();
      ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
      ctx.fillStyle = '#dc2626';
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 10px sans-serif';
      ctx.fillText(`+${stack.length - 1}`, badgeX, badgeY);
    }
  });

  return offscreen;
}

export async function downloadMapImage(state: WargameMapState) {
  const canvas = await renderMapToOffscreenCanvas(state, 2);
  canvas.toBlob((blob) => {
    if (!blob) return;
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    const filename = `${state.title.toLowerCase().replace(/[^a-z0-9]/g, '_')}_grid.png`;
    link.download = filename;
    link.href = url;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }, 'image/png');
}

export async function copyMapImageToClipboard(state: WargameMapState): Promise<boolean> {
  try {
    const canvas = await renderMapToOffscreenCanvas(state, 2);
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (!blob) return resolve(false);
        try {
          await navigator.clipboard.write([
            new ClipboardItem({ 'image/png': blob }),
          ]);
          resolve(true);
        } catch (err) {
          console.error('Failed to write image to clipboard:', err);
          resolve(false);
        }
      }, 'image/png');
    });
  } catch (e) {
    console.error('Export error:', e);
    return false;
  }
}
