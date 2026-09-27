import React from 'react';
import { Navbar } from './Navbar';

interface AppLayoutProps {
  children: React.ReactNode;
}

export const AppLayout: React.FC<AppLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-[#F7F8FA] text-fin-text flex flex-col font-sans">
      <Navbar />
      <main className="flex-1 max-w-[1600px] w-full mx-auto p-4 sm:p-6">
        {children}
      </main>
      <footer className="border-t border-fin-border bg-white py-3 px-6 text-center text-xs text-fin-subtext font-sans">
        FINTRACE — Financial Crime & Insider Risk Intelligence Platform • 2026
      </footer>
    </div>
  );
};
