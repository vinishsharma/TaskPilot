import React from 'react';
import { Outlet } from 'react-router-dom';
import { Navbar } from './Navbar.jsx';

export const Layout = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#fbfbfc]">
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-3 sm:px-6 lg:px-8 py-5">
        <Outlet />
      </main>
      <footer className="py-4 border-t border-gray-200 text-center text-xs text-gray-400">
        TaskPilot &copy; {new Date().getFullYear()} &mdash; Employee &amp; Task Management System
      </footer>
    </div>
  );
};
