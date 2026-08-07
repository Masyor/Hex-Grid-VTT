import React from 'react';
import { X, MousePointer, Shield, Trash2, ArrowUpRight } from 'lucide-react';
import { Unit, AxialCoord } from '../types';

interface StackModalProps {
  isOpen: boolean;
  onClose: () => void;
  units: Unit[];
  coord: AxialCoord | null;
  onSelectUnit: (unit: Unit) => void;
  onDeleteUnit: (id: string) => void;
}

export const StackModal: React.FC<StackModalProps> = ({
  isOpen,
  onClose,
  units,
  coord,
  onSelectUnit,
  onDeleteUnit,
}) => {
  if (!isOpen || !coord) return null;

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
              Stacked Hex Units ({units.length})
            </h3>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Location: Axial ({coord.q}, {coord.r})
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Stack Unit Cards */}
        <div className="p-4 space-y-2.5 max-h-80 overflow-y-auto">
          {units.map((unit) => (
            <div
              key={unit.id}
              className="p-3 bg-slate-950/80 border border-slate-800 rounded-xl flex items-center justify-between gap-3 hover:border-slate-700 transition"
            >
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs text-white shrink-0 shadow-md border border-white/20"
                  style={{ backgroundColor: unit.color }}
                >
                  {unit.label || unit.name.substring(0, 2)}
                </div>
                <div className="min-w-0">
                  <div className="font-semibold text-xs text-slate-100 truncate">{unit.name}</div>
                  <div className="text-[11px] text-slate-400 flex items-center gap-2 mt-0.5">
                    <span>{unit.faction}</span>
                    <span>•</span>
                    <span className="text-emerald-400">{unit.status || 'Active'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5 shrink-0">
                <button
                  onClick={() => {
                    onSelectUnit(unit);
                    onClose();
                  }}
                  className="flex items-center gap-1 px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg cursor-pointer transition shadow-sm"
                >
                  <MousePointer className="w-3.5 h-3.5" />
                  <span>Select</span>
                </button>

                <button
                  onClick={() => onDeleteUnit(unit.id)}
                  className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-slate-800 rounded-lg cursor-pointer"
                  title="Remove Unit"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 bg-slate-950 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
