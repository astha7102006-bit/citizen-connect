import React from 'react';
import { ChevronRight, Home } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PageHeader({
  title,
  subtitle,
  badge,
  breadcrumbs = [],
  action,
  isDark = false,
}) {
  return (
    <div className="mb-6 sm:mb-8">
      {/* Breadcrumb Trail */}
      <nav aria-label="Breadcrumb" className="flex items-center space-x-2 text-xs mb-3 text-slate-500 dark:text-slate-400">
        <Link
          to="/"
          className="inline-flex items-center space-x-1 hover:text-slate-900 dark:hover:text-white transition-colors"
        >
          <Home className="w-3.5 h-3.5" />
          <span>Home</span>
        </Link>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={idx}>
            <ChevronRight className="w-3 h-3 text-slate-400" />
            {crumb.to ? (
              <Link
                to={crumb.to}
                className="hover:text-slate-900 dark:hover:text-white transition-colors"
              >
                {crumb.label}
              </Link>
            ) : (
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {crumb.label}
              </span>
            )}
          </React.Fragment>
        ))}
      </nav>

      {/* Main Title Row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-3">
            <h1
              className={`text-2xl sm:text-3xl font-extrabold tracking-tight ${
                isDark ? 'text-white' : 'text-[#0E1B33]'
              }`}
            >
              {title}
            </h1>
            {badge && <div>{badge}</div>}
          </div>
          {subtitle && (
            <p
              className={`text-sm sm:text-base mt-1 max-w-2xl ${
                isDark ? 'text-slate-300' : 'text-slate-600'
              }`}
            >
              {subtitle}
            </p>
          )}
        </div>

        {action && <div className="flex-shrink-0">{action}</div>}
      </div>
    </div>
  );
}
