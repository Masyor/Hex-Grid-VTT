import React from 'react';
import { AlertTriangle, Save, Trash2, X } from 'lucide-react';

interface UnsavedChangesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDiscard: () => void;
  onSaveAndProceed: () => void;
}

export const UnsavedChangesModal: React.FC<UnsavedChangesModalProps> = ({
  isOpen,
  onClose,
  onDiscard,
  onSaveAndProceed,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-slate-900 border border-amber-800/80 rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-amber-400 font-bold text-sm">
            <div className="p-1.5 bg-amber-950/80 border border-amber-800/80 rounded-lg">
              <AlertTriangle className="w-4 h-4" />
            </div>
            <span>Unsaved Changes Detected</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 space-y-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            There are unsaved changes on your current map sector. If you navigate away or load a new scenario without saving, your recent edits will be lost.
          </p>

          <p className="text-xs font-semibold text-amber-300">
            Are you sure you want to proceed?
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-2">
            <button
              onClick={onSaveAndProceed}
              className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition cursor-pointer shadow flex items-center justify-center gap-1.5"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Save & Proceed</span>
            </button>

            <button
              onClick={onDiscard}
              className="flex-1 py-2 px-3 bg-rose-950/80 hover:bg-rose-900 border border-rose-800 text-rose-200 rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Discard Changes</span>
            </button>

            <button
              onClick={onClose}
              className="py-2 px-3 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-medium transition cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
