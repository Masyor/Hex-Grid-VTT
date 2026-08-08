import React, { useRef, useEffect, useState, useCallback } from 'react';
import { WargameMapState, ToolMode, AxialCoord, Unit, TerrainCategory } from '../types';
import {
  pixelToHex,
  hexToPixel,
  getHexVertices,
  coordKey,
  getGridHexes,
  getHexesInRadius,
  hexDistance,
  hexLine,
} from '../lib/hexMath';
import { TERRAIN_DEFS } from '../data/terrainDefs';

interface HexCanvasProps {
  mapState: WargameMapState;
  setMapState: React.Dispatch<React.SetStateAction<WargameMapState>>;
  toolMode: ToolMode;
  selectedTerrain: TerrainCategory | 'custom';
  customTerrainConfig?: {
    name: string;
    color: string;
    symbol: string;
  };
  isGmLocked?: boolean;
  onPromptGmUnlock?: () => void;
  brushRadius: number;
  selectedUnit: Unit | null;
  setSelectedUnit: (u: Unit | null) => void;
  hoveredHex: AxialCoord | null;
  setHoveredHex: (h: AxialCoord | null) => void;
  zoomLevel: number;
  setZoomLevel: React.Dispatch<React.SetStateAction<number>>;
  panOffset: { x: number; y: number };
  setPanOffset: React.Dispatch<React.SetStateAction<{ x: number; y: number }>>;
  onOpenStackModal: (units: Unit[], coord: AxialCoord) => void;
  pendingSpawnUnit: Omit<Unit, 'id' | 'q' | 'r'> | null;
  setPendingSpawnUnit: (u: Omit<Unit, 'id' | 'q' | 'r'> | null) => void;
}

export const HexCanvas: React.FC<HexCanvasProps> = ({
  mapState,
  setMapState,
  toolMode,
  selectedTerrain,
  customTerrainConfig,
  isGmLocked = false,
  onPromptGmUnlock,
  brushRadius,
  selectedUnit,
  setSelectedUnit,
  hoveredHex,
  setHoveredHex,
  zoomLevel,
  setZoomLevel,
  panOffset,
  setPanOffset,
  onOpenStackModal,
  pendingSpawnUnit,
  setPendingSpawnUnit,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [isPainting, setIsPainting] = useState(false);

  // Touch gesture refs
  const touchPinchDistRef = useRef<number | null>(null);
  const touchPinchZoomRef = useRef<number>(zoomLevel);
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null);

  // Measurement tool state
  const [measureStart, setMeasureStart] = useState<AxialCoord | null>(null);

  // Transform helpers: screen pixel -> world canvas pixel -> axial hex
  const screenToWorld = useCallback(
    (screenX: number, screenY: number) => {
      const worldX = (screenX - panOffset.x) / zoomLevel;
      const worldY = (screenY - panOffset.y) / zoomLevel;
      return { x: worldX, y: worldY };
    },
    [panOffset, zoomLevel]
  );

  const getAxialFromMouseEvent = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (!canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;
      const world = screenToWorld(mouseX, mouseY);
      return pixelToHex(world.x, world.y, mapState.gridSettings.radius);
    },
    [screenToWorld, mapState.gridSettings.radius]
  );

  const getAxialFromTouch = useCallback(
    (touch: React.Touch) => {
      if (!canvasRef.current) return null;
      const rect = canvasRef.current.getBoundingClientRect();
      const mouseX = touch.clientX - rect.left;
      const mouseY = touch.clientY - rect.top;
      const world = screenToWorld(mouseX, mouseY);
      return pixelToHex(world.x, world.y, mapState.gridSettings.radius);
    },
    [screenToWorld, mapState.gridSettings.radius]
  );

  // Paint terrain helper
  const paintTerrainAt = useCallback(
    (centerCoord: AxialCoord, type: TerrainCategory | 'custom' | null) => {
      if (isGmLocked) {
        onPromptGmUnlock?.();
        return;
      }

      const hexesToPaint = getHexesInRadius(centerCoord, brushRadius);
      setMapState((prev) => {
        const nextTerrains = { ...prev.terrains };
        hexesToPaint.forEach((h) => {
          const k = coordKey(h.q, h.r);
          if (type) {
            if (type === 'custom' && customTerrainConfig) {
              nextTerrains[k] = {
                type: 'custom',
                color: customTerrainConfig.color,
                customName: customTerrainConfig.name,
                customSymbol: customTerrainConfig.symbol,
              };
            } else if (type !== 'custom') {
              nextTerrains[k] = { type };
            }
          } else {
            delete nextTerrains[k];
          }
        });
        return { ...prev, terrains: nextTerrains };
      });
    },
    [brushRadius, isGmLocked, onPromptGmUnlock, customTerrainConfig, setMapState]
  );

  // Move unit helper
  const moveUnitToHex = useCallback(
    (unit: Unit, target: AxialCoord) => {
      if (isGmLocked) {
        onPromptGmUnlock?.();
        return;
      }

      setMapState((prev) => ({
        ...prev,
        units: prev.units.map((u) => (u.id === unit.id ? { ...u, q: target.q, r: target.r, status: 'Moved' } : u)),
      }));
      setSelectedUnit({ ...unit, q: target.q, r: target.r, status: 'Moved' });
    },
    [isGmLocked, onPromptGmUnlock, setMapState, setSelectedUnit]
  );

  // Render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

    ctx.save();
    ctx.scale(dpr, dpr);

    // Dark canvas background
    ctx.fillStyle = '#0f172a'; // slate-900
    ctx.fillRect(0, 0, rect.width, rect.height);

    // Apply viewport transform (Pan & Zoom)
    ctx.save();
    ctx.translate(panOffset.x, panOffset.y);
    ctx.scale(zoomLevel, zoomLevel);

    const { gridSettings, terrains, units } = mapState;
    const radius = gridSettings.radius;

    // 1. Draw Grid Hexes & Terrains
    const allGridHexes = getGridHexes(gridSettings.bounds);

    allGridHexes.forEach((hex) => {
      const center = hexToPixel(hex.q, hex.r, radius);
      const key = coordKey(hex.q, hex.r);
      const tile = terrains[key];

      let fillColor = TERRAIN_DEFS.clear.color;
      let symbol = '';
      let textColor = '#ffffff';

      if (tile) {
        if (tile.type === 'custom' || tile.color) {
          fillColor = tile.color || '#475569';
          symbol = tile.customSymbol || '🚩';
          textColor = '#ffffff';
        } else if (TERRAIN_DEFS[tile.type as TerrainCategory]) {
          const def = TERRAIN_DEFS[tile.type as TerrainCategory];
          fillColor = def.color;
          symbol = def.symbol;
          textColor = def.textColor;
        }
      }

      const verts = getHexVertices(center.x, center.y, radius);

      // Fill
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < 6; i++) {
        ctx.lineTo(verts[i].x, verts[i].y);
      }
      ctx.closePath();

      ctx.fillStyle = fillColor;
      ctx.fill();

      // Border
      ctx.strokeStyle = gridSettings.gridColor || '#475569';
      ctx.lineWidth = gridSettings.gridLineWidth || 1;
      ctx.stroke();

      // Terrain Symbol
      if (symbol && symbol !== '🌾') {
        ctx.fillStyle = textColor;
        ctx.font = `${radius * 0.55}px sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(symbol, center.x, center.y - (gridSettings.showCoordinates ? 4 : 0));
      }

      // Coordinate Label
      if (gridSettings.showCoordinates) {
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.font = `${Math.max(9, Math.round(radius * 0.28))}px monospace`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'bottom';
        ctx.fillText(`${hex.q},${hex.r}`, center.x, center.y + radius * 0.78);
      }
    });

    // 2. Hovered Hex Glow / Brush Preview
    if (hoveredHex) {
      const brushHexes = getHexesInRadius(hoveredHex, brushRadius);
      brushHexes.forEach((bh) => {
        const center = hexToPixel(bh.q, bh.r, radius);
        const verts = getHexVertices(center.x, center.y, radius);

        ctx.beginPath();
        ctx.moveTo(verts[0].x, verts[0].y);
        for (let i = 1; i < 6; i++) {
          ctx.lineTo(verts[i].x, verts[i].y);
        }
        ctx.closePath();

        ctx.fillStyle = 'rgba(16, 185, 129, 0.25)'; // Emerald hover overlay
        ctx.fill();
        ctx.strokeStyle = '#10b981';
        ctx.lineWidth = 2;
        ctx.stroke();
      });
    }

    // 3. Selected Unit Highlight & Target Movement Indicator
    if (selectedUnit) {
      const unitCenter = hexToPixel(selectedUnit.q, selectedUnit.r, radius);

      // Pulse ring on unit's hex
      const verts = getHexVertices(unitCenter.x, unitCenter.y, radius);
      ctx.beginPath();
      ctx.moveTo(verts[0].x, verts[0].y);
      for (let i = 1; i < 6; i++) {
        ctx.lineTo(verts[i].x, verts[i].y);
      }
      ctx.closePath();
      ctx.strokeStyle = '#f59e0b'; // Amber selection ring
      ctx.lineWidth = 3;
      ctx.stroke();

      // Dashed line to hovered target hex
      if (hoveredHex && (hoveredHex.q !== selectedUnit.q || hoveredHex.r !== selectedUnit.r)) {
        const targetCenter = hexToPixel(hoveredHex.q, hoveredHex.r, radius);
        const dist = hexDistance({ q: selectedUnit.q, r: selectedUnit.r }, hoveredHex);

        ctx.beginPath();
        ctx.setLineDash([6, 6]);
        ctx.moveTo(unitCenter.x, unitCenter.y);
        ctx.lineTo(targetCenter.x, targetCenter.y);
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 2;
        ctx.stroke();
        ctx.setLineDash([]);

        // Distance badge at midpoint
        const midX = (unitCenter.x + targetCenter.x) / 2;
        const midY = (unitCenter.y + targetCenter.y) / 2;

        ctx.fillStyle = '#1e293b';
        ctx.beginPath();
        ctx.arc(midX, midY, 14, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#f59e0b';
        ctx.lineWidth = 1.5;
        ctx.stroke();

        ctx.fillStyle = '#fbbf24';
        ctx.font = 'bold 11px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`${dist}H`, midX, midY);
      }
    }

    // 4. Measure Tool Vector Line & Path
    if (toolMode === 'measure' && measureStart && hoveredHex) {
      const lineHexes = hexLine(measureStart, hoveredHex);
      const startPixel = hexToPixel(measureStart.q, measureStart.r, radius);
      const endPixel = hexToPixel(hoveredHex.q, hoveredHex.r, radius);
      const dist = hexDistance(measureStart, hoveredHex);

      // Highlight hexes along line
      lineHexes.forEach((lh) => {
        const c = hexToPixel(lh.q, lh.r, radius);
        const v = getHexVertices(c.x, c.y, radius);
        ctx.beginPath();
        ctx.moveTo(v[0].x, v[0].y);
        for (let i = 1; i < 6; i++) {
          ctx.lineTo(v[i].x, v[i].y);
        }
        ctx.closePath();
        ctx.fillStyle = 'rgba(59, 130, 246, 0.3)'; // Blue measurement overlay
        ctx.fill();
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = 1.5;
        ctx.stroke();
      });

      // Vector arrow line
      ctx.beginPath();
      ctx.moveTo(startPixel.x, startPixel.y);
      ctx.lineTo(endPixel.x, endPixel.y);
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 3;
      ctx.stroke();

      // Start circle
      ctx.beginPath();
      ctx.arc(startPixel.x, startPixel.y, 6, 0, Math.PI * 2);
      ctx.fillStyle = '#3b82f6';
      ctx.fill();

      // End distance badge
      ctx.fillStyle = '#0f172a';
      ctx.beginPath();
      ctx.roundRect(endPixel.x - 30, endPixel.y - 30, 60, 22, 6);
      ctx.fill();
      ctx.strokeStyle = '#60a5fa';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      ctx.fillStyle = '#60a5fa';
      ctx.font = 'bold 11px monospace';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(`${dist} Hexes`, endPixel.x, endPixel.y - 19);
    }

    // 5. Draw Unit Tokens & Stack Badges
    const unitStacks: Record<string, Unit[]> = {};
    units.forEach((u) => {
      const k = coordKey(u.q, u.r);
      if (!unitStacks[k]) unitStacks[k] = [];
      unitStacks[k].push(u);
    });

    Object.entries(unitStacks).forEach(([k, stack]) => {
      const [q, r] = k.split(',').map(Number);
      const center = hexToPixel(q, r, radius);
      const topUnit = stack[0];
      const tokenRadius = radius * 0.58;

      ctx.save();
      if (topUnit.isHidden) {
        ctx.globalAlpha = 0.42;
      }

      // Draw token body
      ctx.beginPath();
      ctx.arc(center.x, center.y, tokenRadius, 0, Math.PI * 2);
      ctx.fillStyle = topUnit.color || '#2563eb';
      ctx.fill();

      // Border
      ctx.strokeStyle = selectedUnit?.id === topUnit.id ? '#fbbf24' : topUnit.isHidden ? '#c084fc' : '#ffffff';
      ctx.lineWidth = selectedUnit?.id === topUnit.id ? 3 : 2;
      if (topUnit.isHidden) {
        ctx.setLineDash([4, 4]);
      }
      ctx.stroke();
      ctx.setLineDash([]);

      // Label / Symbol Text
      ctx.fillStyle = '#ffffff';
      ctx.font = 'bold 12px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(topUnit.label || topUnit.name.substring(0, 3), center.x, center.y);

      // Hidden indicator badge
      if (topUnit.isHidden) {
        ctx.fillStyle = '#e9d5ff';
        ctx.font = 'bold 10px sans-serif';
        ctx.fillText('👁️', center.x - tokenRadius * 0.6, center.y - tokenRadius * 0.6);
      }

      // Stacking Badge (If multiple units on same hex)
      if (stack.length > 1) {
        const badgeX = center.x + tokenRadius * 0.65;
        const badgeY = center.y - tokenRadius * 0.65;
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
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(`+${stack.length - 1}`, badgeX, badgeY);
      }

      ctx.restore();
    });

    ctx.restore();
    ctx.restore();
  }, [
    mapState,
    zoomLevel,
    panOffset,
    hoveredHex,
    brushRadius,
    selectedUnit,
    toolMode,
    measureStart,
  ]);

  // Window Resize & Keyboard Event Listener (Escape key deselects unit)
  useEffect(() => {
    const handleResize = () => {
      if (canvasRef.current) {
        setZoomLevel((z) => z);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedUnit(null);
        setMeasureStart(null);
      }
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [setZoomLevel, setSelectedUnit]);

  // Canvas Mouse Down
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coord = getAxialFromMouseEvent(e);
    if (!coord) return;

    // Right click -> Deselect unit or cancel measure
    if (e.button === 2) {
      e.preventDefault();
      if (selectedUnit) {
        setSelectedUnit(null);
        return;
      }
      if (measureStart) {
        setMeasureStart(null);
        return;
      }
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    // Middle click or space bar -> pan viewport
    if (e.button === 1 || toolMode === 'pan') {
      setIsPanning(true);
      setPanStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
      return;
    }

    if (e.button === 0) {
      if (toolMode === 'paint') {
        setIsPainting(true);
        paintTerrainAt(coord, selectedTerrain);
      } else if (toolMode === 'erase') {
        setIsPainting(true);
        paintTerrainAt(coord, null);
      } else if (toolMode === 'unit_spawn') {
        if (isGmLocked) {
          onPromptGmUnlock?.();
          return;
        }
        if (pendingSpawnUnit) {
          const newUnit: Unit = {
            ...pendingSpawnUnit,
            id: `u_${Date.now()}`,
            q: coord.q,
            r: coord.r,
          };
          setMapState((prev) => ({
            ...prev,
            units: [...prev.units, newUnit],
          }));
          setSelectedUnit(newUnit);
          setPendingSpawnUnit(null);
        }
      } else if (toolMode === 'measure') {
        if (!measureStart) {
          setMeasureStart(coord);
        } else {
          setMeasureStart(null);
        }
      } else if (toolMode === 'select') {
        const stackAtHex = mapState.units.filter((u) => u.q === coord.q && u.r === coord.r);

        if (stackAtHex.length > 1) {
          onOpenStackModal(stackAtHex, coord);
        } else if (stackAtHex.length === 1) {
          if (selectedUnit?.id === stackAtHex[0].id) {
            // Clicking selected unit again deselects it
            setSelectedUnit(null);
          } else {
            setSelectedUnit(stackAtHex[0]);
          }
        } else {
          // Clicked empty target hex
          if (selectedUnit) {
            moveUnitToHex(selectedUnit, coord);
          } else {
            setSelectedUnit(null);
          }
        }
      }
    }
  };

  // Canvas Mouse Move
  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const coord = getAxialFromMouseEvent(e);
    if (coord) {
      setHoveredHex(coord);
    }

    if (isPanning) {
      setPanOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
      return;
    }

    if (isPainting && coord) {
      if (toolMode === 'paint') {
        paintTerrainAt(coord, selectedTerrain);
      } else if (toolMode === 'erase') {
        paintTerrainAt(coord, null);
      }
    }
  };

  // Canvas Mouse Up
  const handleMouseUp = () => {
    setIsPanning(false);
    setIsPainting(false);
  };

  // Wheel Zoom Listener
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.88;
    const newZoom = Math.max(0.3, Math.min(3.5, zoomLevel * zoomFactor));

    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Zoom towards mouse position
    const newPanX = mouseX - (mouseX - panOffset.x) * (newZoom / zoomLevel);
    const newPanY = mouseY - (mouseY - panOffset.y) * (newZoom / zoomLevel);

    setZoomLevel(newZoom);
    setPanOffset({ x: newPanX, y: newPanY });
  };

  // Touch Start Handler
  const handleTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2) {
      // Two fingers -> Pinch Zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      touchPinchDistRef.current = dist;
      touchPinchZoomRef.current = zoomLevel;
      setIsPanning(false);
      setIsPainting(false);
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      touchStartPosRef.current = { x: touch.clientX, y: touch.clientY };
      const coord = getAxialFromTouch(touch);
      if (!coord) return;
      setHoveredHex(coord);

      if (toolMode === 'pan') {
        setIsPanning(true);
        setPanStart({ x: touch.clientX - panOffset.x, y: touch.clientY - panOffset.y });
      } else if (toolMode === 'paint') {
        setIsPainting(true);
        paintTerrainAt(coord, selectedTerrain);
      } else if (toolMode === 'erase') {
        setIsPainting(true);
        paintTerrainAt(coord, null);
      }
    }
  };

  // Touch Move Handler
  const handleTouchMove = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 2 && touchPinchDistRef.current !== null) {
      // Handle Pinch Zoom
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const currentDist = Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);
      if (touchPinchDistRef.current > 0) {
        const ratio = currentDist / touchPinchDistRef.current;
        const newZoom = Math.max(0.3, Math.min(3.5, touchPinchZoomRef.current * ratio));
        setZoomLevel(newZoom);
      }
      return;
    }

    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const coord = getAxialFromTouch(touch);
      if (coord) {
        setHoveredHex(coord);
      }

      if (isPanning) {
        setPanOffset({
          x: touch.clientX - panStart.x,
          y: touch.clientY - panStart.y,
        });
        return;
      }

      if (isPainting && coord) {
        if (toolMode === 'paint') {
          paintTerrainAt(coord, selectedTerrain);
        } else if (toolMode === 'erase') {
          paintTerrainAt(coord, null);
        }
      }
    }
  };

  // Touch End Handler
  const handleTouchEnd = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) {
      // Check if it was a quick tap rather than a drag
      if (touchStartPosRef.current && e.changedTouches.length > 0) {
        const touch = e.changedTouches[0];
        const dx = Math.abs(touch.clientX - touchStartPosRef.current.x);
        const dy = Math.abs(touch.clientY - touchStartPosRef.current.y);

        // If finger moved less than 8px, handle as a tap click
        if (dx < 8 && dy < 8) {
          const coord = getAxialFromTouch(touch);
          if (coord) {
            if (toolMode === 'unit_spawn') {
              if (isGmLocked) {
                onPromptGmUnlock?.();
              } else if (pendingSpawnUnit) {
                const newUnit: Unit = {
                  ...pendingSpawnUnit,
                  id: `u_${Date.now()}`,
                  q: coord.q,
                  r: coord.r,
                };
                setMapState((prev) => ({
                  ...prev,
                  units: [...prev.units, newUnit],
                }));
                setSelectedUnit(newUnit);
                setPendingSpawnUnit(null);
              }
            } else if (toolMode === 'measure') {
              if (!measureStart) {
                setMeasureStart(coord);
              } else {
                setMeasureStart(null);
              }
            } else if (toolMode === 'select') {
              const stackAtHex = mapState.units.filter((u) => u.q === coord.q && u.r === coord.r);
              if (stackAtHex.length > 1) {
                onOpenStackModal(stackAtHex, coord);
              } else if (stackAtHex.length === 1) {
                if (selectedUnit?.id === stackAtHex[0].id) {
                  setSelectedUnit(null);
                } else {
                  setSelectedUnit(stackAtHex[0]);
                }
              } else {
                if (selectedUnit) {
                  moveUnitToHex(selectedUnit, coord);
                } else {
                  setSelectedUnit(null);
                }
              }
            }
          }
        }
      }

      setIsPanning(false);
      setIsPainting(false);
      touchPinchDistRef.current = null;
      touchStartPosRef.current = null;
    }
  };

  return (
    <div ref={containerRef} className="relative flex-1 w-full h-full bg-slate-950 overflow-hidden cursor-crosshair select-none touch-none">
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
        onContextMenu={(e) => e.preventDefault()}
        className="w-full h-full block touch-none"
      />

      {/* Helper Context Hint Footer */}
      <div className="absolute bottom-3 left-3 bg-slate-900/90 border border-slate-800 text-slate-400 text-[11px] px-3 py-1.5 rounded-lg backdrop-blur flex items-center gap-3 shadow-md pointer-events-none">
        <div>
          Mode: <span className="text-emerald-400 font-semibold uppercase">{toolMode}</span>
        </div>
        <div className="hidden sm:block text-slate-500">|</div>
        <div className="hidden sm:block">Pan: Right-click Drag or Space + Drag</div>
        <div className="hidden md:block text-slate-500">|</div>
        <div className="hidden md:block">Zoom: Scroll Wheel</div>
      </div>
    </div>
  );
};
