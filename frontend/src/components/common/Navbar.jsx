import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { Menu, X, CheckSquare } from 'lucide-react';

export const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { label: 'Dashboard', to: '/' },
    { label: 'Employees', to: '/employees' },
    { label: 'Tasks', to: '/tasks' },
  ];

  const linkClass = ({ isActive }) =>
    `px-3 py-2 text-sm font-medium transition rounded-md ${isActive
      ? 'text-white bg-white/10 font-semibold'
      : 'text-gray-300 hover:text-white hover:bg-white/5'
    }`;

  const mobileLinkClass = ({ isActive }) =>
    `block px-3 py-2 text-base font-medium rounded-md transition ${isActive
      ? 'text-white bg-white/10 font-semibold'
      : 'text-gray-300 hover:text-white hover:bg-white/5'
    }`;

  return (
    <nav className="bg-[#1e1e24] text-white shadow-sm border-b border-neutral-800 sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-14">
          {/* Left: Brand & Navigation Links */}
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <CheckSquare className="w-5 h-5 text-red-400" />
              <span className="font-bold text-base tracking-tight text-white hidden sm:inline">
                TaskPilot
              </span>
            </div>

            <div className="hidden md:flex items-center space-x-1">
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} className={linkClass}>
                  {link.label}
                </NavLink>
              ))}
            </div>
          </div>

          {/* Center/Right Subtitle from Assignment Spec */}
          <div className="hidden sm:block text-xs md:text-sm font-medium text-gray-400 tracking-wide">
            Employee & Task Management System
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-md text-gray-300 hover:text-white hover:bg-neutral-800 focus:outline-none"
              aria-label="Toggle Navigation"
            >
              {isMobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer */}
      {isMobileMenuOpen && (
        <div className="md:hidden border-t border-neutral-800 bg-[#1e1e24] px-4 pt-2 pb-3 space-y-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setIsMobileMenuOpen(false)}
              className={mobileLinkClass}
            >
              {link.label}
            </NavLink>
          ))}
          <div className="pt-2 text-xs text-gray-400 border-t border-neutral-800 mt-2">
            Employee & Task Management System
          </div>
        </div>
      )}
    </nav>
  );
};
