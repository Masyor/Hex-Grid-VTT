import React, { useState, useEffect } from 'react';
import { X, Download, Copy, Check, RefreshCw, Image } from 'lucide-react';
import { WargameMapState } from '../types';
import { renderMapToOffscreenCanvas, downloadMapImage, copyMapImageToClipboard } from '../lib/exportEngine';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  mapState: WargameMapState;
}

export const ExportModal: React.FC<ExportModalProps> = ({ isOpen, onClose, mapState }) => {
  const [scaleFactor, setScaleFactor] = useState(2);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setPreviewUrl(null);
      return;
    }

    let isMounted = true;
    setIsGenerating(true);

    renderMapToOffscreenCanvas(mapState, scaleFactor)
      .then((canvas) => {
        canvas.toBlob((blob) => {
          if (blob && isMounted) {
            const url = URL.createObjectURL(blob);
            setPreviewUrl(url);
            setIsGenerating(false);
          }
        }, 'image/png');
      })
      .catch((e) => {
        console.error('Export error:', e);
        if (isMounted) setIsGenerating(false);
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, mapState, scaleFactor]);

  if (!isOpen) return null;

  const handleDownload = () => {
    downloadMapImage(mapState);
  };

  const handleCopy = async () => {
    const ok = await copyMapImageToClipboard(mapState);
    if (ok) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md flex items-center justify-center z-50 p-4 select-none">
      <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="font-bold text-sm text-slate-100 flex items-center gap-2">
              <Image className="w-4 h-4 text-emerald-400" />
              Export High-Resolution PNG Map
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Zero-cost offscreen browser renderer tuned for Discord & Play-by-Post forums.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-100 rounded-lg hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 flex-1 overflow-y-auto space-y-4">
          {/* Resolution Multiplier Controls */}
          <div className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs">
            <span className="text-slate-300 font-medium">Export Quality Multiplier:</span>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4].map((s) => (
                <button
                  key={s}
                  onClick={() => setScaleFactor(s)}
                  className={`px-3 py-1 rounded-lg font-mono font-medium transition cursor-pointer ${
                    scaleFactor === s
                      ? 'bg-emerald-600 text-white shadow'
                      : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                  }`}
                >
                  {s}x ({s * 100}%)
                </button>
              ))}
            </div>
          </div>

          {/* Image Preview Box */}
          <div className="relative bg-slate-950 rounded-xl border border-slate-800 p-2 min-h-[280px] flex items-center justify-center overflow-hidden">
            {isGenerating ? (
              <div className="flex flex-col items-center gap-2 text-slate-400 text-xs">
                <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
                <span>Rendering high-resolution vector offscreen canvas...</span>
              </div>
            ) : previewUrl ? (
              <img
                src={previewUrl}
                alt="Map Export Preview"
                className="max-h-[380px] w-auto rounded object-contain border border-slate-800 shadow-md"
              />
            ) : (
              <span className="text-xs text-slate-500">Failed to generate image preview.</span>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-slate-950 border-t border-slate-800 flex items-center justify-end gap-3">
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-100 rounded-xl text-xs font-semibold cursor-pointer border border-slate-700 transition"
          >
            {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
            <span>{copied ? 'Copied Image!' : 'Copy PNG to Clipboard'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow-lg shadow-emerald-950 border border-emerald-400/30 transition"
          >
            <Download className="w-4 h-4" />
            <span>Download PNG File</span>
          </button>
        </div>
      </div>
    </div>
  );
};
