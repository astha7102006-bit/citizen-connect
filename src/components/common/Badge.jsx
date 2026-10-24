import React from 'react';

export default function Badge({
  children,
  variant = 'default',
  size = 'md',
  className = '',
  dot = false,
}) {
  const sizeClasses = {
    sm: 'text-[10px] px-2 py-0.5',
    md: 'text-xs px-2.5 py-1',
    lg: 'text-sm px-3 py-1.5',
  };

  const variantClasses = {
    default:
      'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700',
    primary:
      'bg-sky-50 dark:bg-sky-950/60 text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800',
    success:
      'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800',
    warning:
      'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800',
    danger:
      'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800',
    purple:
      'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800',
    saffron:
      'bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 border border-orange-200 dark:border-orange-800',
  };

  const dotColors = {
    default: 'bg-slate-400',
    primary: 'bg-sky-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-red-500',
    purple: 'bg-purple-500',
    saffron: 'bg-orange-500',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold rounded-full select-none ${
        sizeClasses[size] || sizeClasses.md
      } ${variantClasses[variant] || variantClasses.default} ${className}`}
    >
      {dot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            dotColors[variant] || dotColors.default
          }`}
        />
      )}
      <span>{children}</span>
    </span>
  );
}
