import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

export const NotFoundPage = () => {
  return (
    <div className="min-h-screen w-full flex items-center justify-center p-4 bg-theme-obsidian text-center">
      <div className="bg-slate-900 border border-white/10 rounded-3xl p-8 max-w-sm w-full shadow-2xl">
        <ShieldAlert className="w-12 h-12 text-indigo-400 mx-auto mb-3" />
        <h1 className="text-2xl font-black text-white">404 - Page Not Found</h1>
        <p className="text-xs text-slate-400 mt-2 mb-6">
          The page or conversation you requested does not exist.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Chat
        </Link>
      </div>
    </div>
  );
};
