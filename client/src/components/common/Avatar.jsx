import React from 'react';

export const Avatar = ({ src, name = 'User', size = 'md', isOnline = false, className = '' }) => {
  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-11 h-11 text-sm',
    lg: 'w-14 h-14 text-base font-semibold',
    xl: 'w-20 h-20 text-xl font-bold',
  };

  const badgeSizes = {
    xs: 'w-1.5 h-1.5 bottom-0 right-0',
    sm: 'w-2 h-2 bottom-0 right-0',
    md: 'w-3 h-3 bottom-0 right-0 border-2',
    lg: 'w-3.5 h-3.5 bottom-0.5 right-0.5 border-2',
    xl: 'w-4 h-4 bottom-1 right-1 border-2',
  };

  const initials = name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase();

  return (
    <div className={`relative inline-block flex-shrink-0 ${className}`}>
      {src ? (
        <img
          src={src}
          alt={name}
          className={`${sizeClasses[size]} rounded-full object-cover ring-1 ring-white/10 shadow-sm`}
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ) : (
        <div
          className={`${sizeClasses[size]} rounded-full bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center font-medium shadow-sm ring-1 ring-white/10`}
        >
          {initials || '?'}
        </div>
      )}
      {isOnline && (
        <span
          className={`absolute ${badgeSizes[size]} rounded-full bg-emerald-500 border-slate-900 shadow-sm animate-pulse-subtle`}
          title="Online"
        />
      )}
    </div>
  );
};
