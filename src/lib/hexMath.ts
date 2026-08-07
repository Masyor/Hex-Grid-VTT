import { GridSettings } from '../types';

export interface AxialCoord {
  q: number;
  r: number;
}

export interface PixelCoord {
  x: number;
  y: number;
}

/**
 * Key representation for axial coordinates in dictionary maps ("q,r")
 */
export function coordKey(q: number, r: number): string {
  return `${q},${r}`;
}

export function parseCoordKey(key: string): AxialCoord {
  const [q, r] = key.split(',').map(Number);
  return { q, r };
}

/**
 * Calculates pixel center (x, y) for pointy-topped axial hex (q, r)
 * Formula:
 * x = R * sqrt(3) * (q + r/2)
 * y = R * (3/2 * r)
 */
export function hexToPixel(q: number, r: number, radius: number): PixelCoord {
  const x = radius * Math.sqrt(3) * (q + r / 2);
  const y = radius * 1.5 * r;
  return { x, y };
}

/**
 * Converts screen/canvas pixel (x, y) back to nearest axial (q, r)
 */
export function pixelToHex(x: number, y: number, radius: number): AxialCoord {
  const qFrac = ((Math.sqrt(3) / 3) * x - (1 / 3) * y) / radius;
  const rFrac = ((2 / 3) * y) / radius;
  return cubeRound(qFrac, -qFrac - rFrac, rFrac);
}

/**
 * Cube rounding algorithm for axial coordinates
 */
export function cubeRound(x: number, y: number, z: number): AxialCoord {
  let rx = Math.round(x);
  let ry = Math.round(y);
  let rz = Math.round(z);

  const xDiff = Math.abs(rx - x);
  const yDiff = Math.abs(ry - y);
  const zDiff = Math.abs(rz - z);

  if (xDiff > yDiff && xDiff > zDiff) {
    rx = -ry - rz;
  } else if (yDiff > zDiff) {
    ry = -rx - rz;
  } else {
    rz = -rx - ry;
  }

  return { q: rx, r: rz };
}

/**
 * Get 6 corner vertices for a pointy-topped hex centered at (cx, cy)
 */
export function getHexVertices(cx: number, cy: number, radius: number): PixelCoord[] {
  const vertices: PixelCoord[] = [];
  for (let i = 0; i < 6; i++) {
    // Pointy-topped angles: 30°, 90°, 150°, 210°, 270°, 330°
    const angleRad = (Math.PI / 180) * (60 * i - 30);
    vertices.push({
      x: cx + radius * Math.cos(angleRad),
      y: cy + radius * Math.sin(angleRad),
    });
  }
  return vertices;
}

/**
 * Axial distance between two hexes
 */
export function hexDistance(a: AxialCoord, b: AxialCoord): number {
  return (Math.abs(a.q - b.q) + Math.abs(a.q + a.r - b.q - b.r) + Math.abs(a.r - b.r)) / 2;
}

/**
 * Linear interpolation between two numbers
 */
function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/**
 * Cube coordinate linear interpolation
 */
function cubeLerp(
  a: { x: number; y: number; z: number },
  b: { x: number; y: number; z: number },
  t: number
) {
  return {
    x: lerp(a.x, b.x, t),
    y: lerp(a.y, b.y, t),
    z: lerp(a.z, b.z, t),
  };
}

/**
 * Returns line of hexes between start and end (for measurement line-of-sight)
 */
export function hexLine(start: AxialCoord, end: AxialCoord): AxialCoord[] {
  const N = hexDistance(start, end);
  if (N === 0) return [start];

  const startCube = { x: start.q, y: -start.q - start.r, z: start.r };
  const endCube = { x: end.q, y: -end.q - end.r, z: end.r };
  
  const results: AxialCoord[] = [];
  for (let i = 0; i <= N; i++) {
    const t = N === 0 ? 0 : i / N;
    // Add tiny epsilon offset to avoid exact edge ambiguity
    const interpolated = cubeLerp(
      { x: startCube.x + 1e-6, y: startCube.y + 1e-6, z: startCube.z - 2e-6 },
      endCube,
      t
    );
    results.push(cubeRound(interpolated.x, interpolated.y, interpolated.z));
  }
  return results;
}

/**
 * Generate all axial coordinates within the grid bounds
 */
export function getGridHexes(bounds: GridSettings['bounds']): AxialCoord[] {
  const hexes: AxialCoord[] = [];
  for (let q = bounds.minQ; q <= bounds.maxQ; q++) {
    for (let r = bounds.minR; r <= bounds.maxR; r++) {
      hexes.push({ q, r });
    }
  }
  return hexes;
}

/**
 * Returns neighbor hexes within brush radius (e.g. radius 0 = 1 hex, radius 1 = 7 hexes)
 */
export function getHexesInRadius(center: AxialCoord, radius: number): AxialCoord[] {
  const results: AxialCoord[] = [];
  for (let q = -radius; q <= radius; q++) {
    const r1 = Math.max(-radius, -q - radius);
    const r2 = Math.min(radius, -q + radius);
    for (let r = r1; r <= r2; r++) {
      results.push({ q: center.q + q, r: center.r + r });
    }
  }
  return results;
}
