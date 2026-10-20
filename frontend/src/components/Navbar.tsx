'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Mic, Globe, Shield, User, Menu, X, Radio, Sparkles } from 'lucide-react';

interface NavbarProps {
  currentCountry?: string;
  onCountryChange?: (country: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentCountry = 'CO', onCountryChange }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const countries = [
    { code: 'CO', label: '🇨🇴 Colombia (COP)' },
    { code: 'MX', label: '🇲🇽 México (MXN)' },
    { code: 'US', label: '🇺🇸 EE.UU. (USD)' },
    { code: 'CA', label: '🇨🇦 Canadá (CAD)' },
    { code: 'AR', label: '🇦🇷 Argentina (ARS)' },
    { code: 'ES', label: '🇪🇸 España (EUR)' },
  ];

  return (
    <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md border-b border-slate-800 text-slate-100 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo y Marca */}
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-cyan-400 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Mic className="w-5 h-5 text-white animate-pulse" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-indigo-200 to-cyan-400 bg-clip-text text-transparent">
                E-MIS@RIO SAS
              </span>
              <span className="block text-[10px] uppercase tracking-widest text-cyan-400 font-semibold">
                Voice AI Cloud
              </span>
            </div>
          </Link>

          {/* Links Escritorio */}
          <div className="hidden md:flex items-center space-x-6 text-sm font-medium">
            <Link href="/" className="text-slate-300 hover:text-white transition-colors">
              Inicio
            </Link>
            <Link href="/dashboard" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-cyan-400" />
              Panel Cliente
            </Link>
            <Link href="/admin" className="text-slate-300 hover:text-white transition-colors flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-indigo-400" />
              Superadmin
            </Link>

            {/* Selector de Moneda / País */}
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-700/80 rounded-lg px-2.5 py-1">
              <Globe className="w-4 h-4 text-slate-400" />
              <select
                value={currentCountry}
                onChange={(e) => onCountryChange && onCountryChange(e.target.value)}
                className="bg-transparent text-xs text-slate-200 focus:outline-none cursor-pointer"
              >
                {countries.map((c) => (
                  <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                    {c.label}
                  </option>
                ))}
              </select>
            </div>

            <Link
              href="/login"
              className="text-slate-300 hover:text-white transition-colors flex items-center gap-1"
            >
              <User className="w-4 h-4 text-slate-400" />
              <span>Acceso</span>
            </Link>

            <Link
              href="/dashboard"
              className="bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-medium text-xs px-4 py-2 rounded-lg shadow-md shadow-indigo-500/25 transition-all hover:shadow-cyan-500/30"
            >
              Probar Voz IA
            </Link>
          </div>

          {/* Botón Móvil */}
          <div className="flex md:hidden items-center space-x-3">
            <select
              value={currentCountry}
              onChange={(e) => onCountryChange && onCountryChange(e.target.value)}
              className="bg-slate-900 border border-slate-700 text-[11px] text-slate-200 rounded px-1.5 py-1 focus:outline-none"
            >
              {countries.map((c) => (
                <option key={c.code} value={c.code} className="bg-slate-900 text-white">
                  {c.code}
                </option>
              ))}
            </select>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="text-slate-400 hover:text-white focus:outline-none p-1"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Menú Móvil Desplegable */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-slate-900/95 border-b border-slate-800 px-4 pt-2 pb-4 space-y-3">
          <Link
            href="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 hover:text-white py-1 text-sm font-medium"
          >
            Inicio
          </Link>
          <Link
            href="/dashboard"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 hover:text-white py-1 text-sm font-medium"
          >
            Panel Cliente / Inquilino
          </Link>
          <Link
            href="/admin"
            onClick={() => setMobileMenuOpen(false)}
            className="block text-slate-300 hover:text-white py-1 text-sm font-medium"
          >
            Panel Superadmin
          </Link>
          <div className="pt-2">
            <Link
              href="/dashboard"
              onClick={() => setMobileMenuOpen(false)}
              className="block text-center bg-gradient-to-r from-indigo-600 to-cyan-500 text-white py-2 rounded-lg text-sm font-semibold"
            >
              Comenzar Ahora
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};
