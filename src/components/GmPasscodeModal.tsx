import React, { useState } from 'react';
import { Lock, Unlock, Key, X, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface GmPasscodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  requiredPasscode?: string;
  ownerName?: string;
  onSuccess: () => void;
}

export const GmPasscodeModal: React.FC<GmPasscodeModalProps> = ({
  isOpen,
  onClose,
  requiredPasscode,
  ownerName,
  onSuccess,
}) => {
  const [pinInput, setPinInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!requiredPasscode) {
      // If no passcode was configured on the map, unlock immediately
      onSuccess();
      onClose();
      return;
    }

    if (pinInput.trim() === requiredPasscode.trim()) {
      setErrorMsg('');
      setPinInput('');
      onSuccess();
      onClose();
    } else {
      setErrorMsg('Incorrect Game Master Password. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 select-none">
      <div className="w-full max-w-sm bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-150">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2 text-slate-100 font-semibold text-sm">
            <div className="p-1.5 bg-amber-950/80 border border-amber-800/60 rounded-lg text-amber-400">
              <Lock className="w-4 h-4" />
            </div>
            <span>Game Master Access Lock</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/60 p-2.5 rounded-xl border border-slate-800">
            {ownerName ? (
              <span>Map created by <strong className="text-emerald-400">{ownerName}</strong>. Enter the GM password to access map controls.</span>
            ) : (
              <span>Enter the GM password to unlock map editing and unit controls for this campaign.</span>
            )}
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 block mb-1">
              GM Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                autoFocus
                required
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value);
                  setErrorMsg('');
                }}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-sm text-slate-100 focus:outline-none focus:border-amber-500 pr-10 font-mono tracking-wider"
                placeholder="Enter GM Password..."
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-200 cursor-pointer transition"
                title={showPassword ? 'Hide Password' : 'Show Password'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {errorMsg && (
            <div className="p-2.5 bg-rose-950/60 border border-rose-800/60 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl text-xs font-semibold cursor-pointer transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow transition flex items-center justify-center gap-1.5"
            >
              <Unlock className="w-3.5 h-3.5" />
              <span>Unlock GM Mode</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
