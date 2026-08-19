import React from 'react';
import { ShieldCheck, Heart, Sparkles } from 'lucide-react';

export const CopyrightBadge = ({ floating = false, className = '' }) => {
  if (floating) {
    return (
      <div
        className={`fixed bottom-3 right-4 z-30 flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-slate-900/90 hover:bg-slate-900 border border-amber-500/30 backdrop-blur-md shadow-xl text-[11px] text-slate-300 transition-all hover:scale-105 select-none ${className}`}
      >
        <span className="flex h-2 w-2 relative">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
        </span>
        <span className="font-bold text-white tracking-wide">Vaartalaap</span>
        <span className="text-slate-600">•</span>
        <span className="flex items-center gap-1 font-semibold text-slate-200">
          Developed by <span className="text-amber-400 font-extrabold">Shubham Mishra</span>
        </span>
      </div>
    );
  }

  return (
    <div className={`text-center py-3 text-[11px] text-slate-400 select-none ${className}`}>
      <p className="flex items-center justify-center gap-1.5 flex-wrap">
        <span className="font-bold text-slate-200">© {new Date().getFullYear()} Vaartalaap.</span>
        <span>All Rights Reserved.</span>
        <span className="text-slate-600">•</span>
        <span className="inline-flex items-center gap-1 text-slate-300 font-semibold">
          Developed with <Heart className="w-3 h-3 text-red-500 fill-red-500 inline" /> by{' '}
          <span className="text-amber-400 font-bold">Shubham Mishra</span>
        </span>
      </p>
    </div>
  );
};
