import React from 'react';

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  icon: Icon,
  iconRight: IconRight,
  disabled = false,
  onClick,
  type = 'button',
  ...props
}) {
  const baseClasses =
    'inline-flex items-center justify-center font-semibold rounded-full transition-all duration-200 cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-offset-2';

  const sizeClasses = {
    sm: 'text-xs px-3.5 py-1.5 gap-1.5',
    md: 'text-sm px-5 py-2.5 gap-2',
    lg: 'text-base px-6 py-3 gap-2.5',
  };

  const variantClasses = {
    primary:
      'btn-primary-gradient text-white shadow-md hover:shadow-lg focus:ring-emerald-500',
    secondary:
      'bg-white/10 hover:bg-white/20 text-current border border-white/20 backdrop-blur-md shadow-sm focus:ring-sky-500',
    outline:
      'bg-transparent hover:bg-slate-500/10 text-current border border-slate-300 dark:border-slate-700 focus:ring-slate-500',
    danger:
      'bg-red-600 hover:bg-red-700 text-white shadow-md focus:ring-red-500',
    ghost:
      'bg-transparent hover:bg-slate-500/10 text-current focus:ring-slate-400',
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={`${baseClasses} ${sizeClasses[size] || sizeClasses.md} ${
        variantClasses[variant] || variantClasses.primary
      } ${className}`}
      {...props}
    >
      {Icon && <Icon className="w-4 h-4 flex-shrink-0" />}
      <span>{children}</span>
      {IconRight && <IconRight className="w-4 h-4 flex-shrink-0" />}
    </button>
  );
}
