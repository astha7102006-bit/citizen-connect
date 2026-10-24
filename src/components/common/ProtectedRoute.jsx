/**
 * CitizenConnect — Protected Route Guard
 *
 * Ensures protected screens (such as Citizen Dashboard) are only accessible
 * to authenticated users with an active database session.
 *
 * Behavior:
 *  - While `authLoading` is true (verifying session on refresh), shows a clean spinner.
 *  - If unauthenticated, denies access and redirects to "/" (home).
 *  - If authenticated, renders the child component.
 */

import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function ProtectedRoute({ children }) {
  const { isAuthenticated, authLoading } = useAuth();
  const location = useLocation();

  if (authLoading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <div className="w-9 h-9 border-3 border-[#0F4C81] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium tracking-wide">
          Verifying secure session...
        </span>
      </div>
    );
  }

  if (!isAuthenticated) {
    // Access denied for unauthenticated visitors — redirect to home
    return <Navigate to="/" state={{ from: location }} replace />;
  }

  return children;
}
