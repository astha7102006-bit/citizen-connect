import React from 'react';

export default function GlassCard({
  children,
  className = '',
  isDark = false,
  hoverEffect = false,
  ...props
}) {
  return (
    <div
      className={`rounded-3xl p-5 sm:p-6 transition-all duration-300 relative shadow-xl ${
        isDark ? 'glass-panel-dark' : 'glass-panel-light'
      } ${
        hoverEffect
          ? 'hover:-translate-y-1 hover:shadow-2xl cursor-pointer'
          : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}
