'use client';

import React, { useRef } from 'react';
import { Camera, UploadCloud, Loader2 } from 'lucide-react';

interface Props {
  onImageSelected: (file: File) => void;
  isLoading: boolean;
}

export function BillUploadZone({ onImageSelected, isLoading }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelected(e.target.files[0]);
    }
  };

  return (
    <div
      onClick={() => !isLoading && fileInputRef.current?.click()}
      className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center cursor-pointer transition-all ${
        isLoading
          ? 'border-blue-500/50 bg-blue-950/20 cursor-wait'
          : 'border-slate-700 hover:border-blue-500 bg-slate-900/50 hover:bg-slate-900/80'
      }`}
    >
      {/* capture="environment" triggers the rear camera on mobile phones */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        disabled={isLoading}
        onChange={handleFileChange}
      />

      <div className="w-14 h-14 rounded-full bg-blue-600/10 text-blue-400 flex items-center justify-center mb-4">
        {isLoading ? (
          <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
        ) : (
          <Camera className="w-7 h-7" />
        )}
      </div>

      <p className="text-sm font-semibold text-slate-200">
        {isLoading ? 'Scanning receipt with Gemini AI...' : 'Take a Photo or Upload Bill'}
      </p>
      <span className="text-xs text-slate-400 mt-1">
        Tap to use phone camera or select receipt image (JPG, PNG)
      </span>
    </div>
  );
}

