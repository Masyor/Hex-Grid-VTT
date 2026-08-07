import React, { useState, useEffect } from 'react';
import { X, Shield, Trash2, Check, User, Eye, EyeOff } from 'lucide-react';
import { Unit, UnitFaction, UnitStatus } from '../types';

interface UnitEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  unit: Unit | null;
  onSaveUnit: (updatedUnit: Unit) => void;
  onDeleteUnit: (id: string) => void;
}

export const UnitEditModal: React.FC<UnitEditModalProps> = ({
  isOpen,
  onClose,
  unit,
  onSaveUnit,
  onDeleteUnit,
}) => {
  const [formData, setFormData] = useState<Unit | null>(unit);

  useEffect(() => {
    setFormData(unit);
  }, [unit]);

  if (!isOpen || !formData) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSaveUnit(formData);
    onClose();
  };

  const statuses: UnitStatus[] = ['Active', 'Moved', 'Suppressed', 'Fortified', 'Damaged', 'Destroyed'];

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-4 h-4 rounded-full border border-white/30"
              style={{ backgroundColor: formData.color }}
            />
            <h3 className="font-bold text-sm text-slate-100">Edit Unit Details</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 space-y-3.5 text-xs">
          <div>
            <label className="text-slate-400 block mb-1">Unit Name</label>
            <input
              type="text"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">Faction</label>
              <select
                value={formData.faction}
                onChange={(e) => setFormData({ ...formData, faction: e.target.value as UnitFaction })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                <option value="Player">Player</option>
                <option value="Enemy">Enemy</option>
                <option value="NPC">NPC</option>
                <option value="Neutral">Neutral</option>
              </select>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Status Badge</label>
              <select
                value={formData.status || 'Active'}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as UnitStatus })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500 cursor-pointer"
              >
                {statuses.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">Label Code</label>
              <input
                type="text"
                value={formData.label || ''}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500 font-mono text-center"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Token Color</label>
              <input
                type="color"
                value={formData.color}
                onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                className="w-full h-8 bg-slate-950 border border-slate-800 rounded-lg cursor-pointer"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-slate-400 block mb-1">Current HP</label>
              <input
                type="number"
                value={formData.hp ?? 100}
                onChange={(e) => setFormData({ ...formData, hp: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">Max HP</label>
              <input
                type="number"
                value={formData.maxHp ?? 100}
                onChange={(e) => setFormData({ ...formData, maxHp: Number(e.target.value) })}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="text-slate-400 block mb-1">Combat / Platoon Notes</label>
            <textarea
              rows={2}
              value={formData.notes || ''}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-1.5 text-slate-100 focus:outline-none focus:border-emerald-500 resize-none"
              placeholder="e.g. Low ammunition, entrenched at ridge."
            />
          </div>

          {/* Hidden Unit Toggle */}
          <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg flex items-center justify-between">
            <div className="flex items-center gap-2">
              {formData.isHidden ? <EyeOff className="w-4 h-4 text-purple-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
              <div>
                <div className="font-semibold text-slate-200">Hidden Unit (GM Only)</div>
                <div className="text-[10px] text-slate-400">Semi-transparent on map; omitted from exported images</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={!!formData.isHidden}
              onChange={(e) => setFormData({ ...formData, isHidden: e.target.checked })}
              className="w-4 h-4 accent-purple-500 cursor-pointer"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-2 border-t border-slate-800 flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                onDeleteUnit(formData.id);
                onClose();
              }}
              className="flex items-center gap-1 px-3 py-1.5 bg-rose-950/80 hover:bg-rose-900 text-rose-300 border border-rose-800/80 rounded-lg cursor-pointer transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Delete Unit</span>
            </button>

            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-semibold cursor-pointer shadow transition"
            >
              <Check className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
