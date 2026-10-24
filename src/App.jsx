import React from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider } from './context/AuthContext';
import { DataProvider } from './context/DataContext';
import AppRoutes from './routes/AppRoutes';

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <DataProvider>
            <AppRoutes />
          </DataProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
