'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Mic, Shield, Building, Lock, Mail, ArrowRight, CheckCircle, AlertCircle, Sparkles } from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { loginUser } from '@/lib/api';

export default function LoginPage() {
  const router = useRouter();
  const [roleMode, setRoleMode] = useState<'superadmin' | 'tenant'>('superadmin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [tenantSlug, setTenantSlug] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Llenar credenciales de demostración con 1 clic
  const fillDemoSuperadmin = () => {
    setRoleMode('superadmin');
    setEmail('admin@e-misario.com');
    setPassword('Emisario2026!');
  };

  const fillDemoTenant = () => {
    setRoleMode('tenant');
    setEmail('cliente@empresa.com');
    setPassword('Cliente2026!');
    setTenantSlug('empresa-demo');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const data = await loginUser(email, password);
      localStorage.setItem('emisario_auth_token', data.access_token);
      localStorage.setItem('emisario_auth_role', data.role);
      localStorage.setItem('emisario_auth_email', data.email);
      localStorage.setItem('emisario_auth_name', data.full_name);
      if (data.tenant_id) {
        localStorage.setItem('emisario_auth_tenant_id', data.tenant_id);
      }

      if (data.role === 'superadmin') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Credenciales incorrectas');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
      <Navbar />

      <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-12">
        <div className="max-w-md w-full bg-slate-900/60 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
          {/* Logo y Encabezado */}
          <div className="text-center mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-indigo-600 to-cyan-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-indigo-500/20">
              <Mic className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-black text-white">Acceso a E-MIS@RIO SAS</h2>
            <p className="text-xs text-slate-400 mt-1">Plataforma SaaS Multi-Tenant de Voz con IA</p>
          </div>

          {/* Selector de Rol */}
          <div className="grid grid-cols-2 gap-2 bg-slate-950 p-1.5 rounded-xl border border-slate-800 mb-6 text-xs font-semibold">
            <button
              type="button"
              onClick={() => {
                setRoleMode('tenant');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                roleMode === 'tenant'
                  ? 'bg-cyan-500 text-black shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Building className="w-3.5 h-3.5" />
              <span>Cliente / Tenant</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setRoleMode('superadmin');
                setErrorMsg(null);
              }}
              className={`py-2 rounded-lg flex items-center justify-center gap-1.5 transition-all ${
                roleMode === 'superadmin'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Superadmin</span>
            </button>
          </div>

          {errorMsg && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Formulario */}
          <form onSubmit={handleLogin} className="space-y-4">
            {roleMode === 'tenant' && (
              <div>
                <label className="block text-xs text-slate-400 mb-1">Subdominio de tu Empresa (Opcional)</label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus-within:border-cyan-400">
                  <span className="text-slate-500 text-xs mr-2">https://</span>
                  <input
                    type="text"
                    value={tenantSlug}
                    onChange={(e) => setTenantSlug(e.target.value)}
                    placeholder="tu-empresa"
                    className="w-full bg-transparent text-xs text-white focus:outline-none font-mono"
                  />
                  <span className="text-slate-500 text-xs">.voice...</span>
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">Correo Electrónico</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus-within:border-cyan-400">
                <Mail className="w-4 h-4 text-slate-500 mr-2.5" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder={roleMode === 'superadmin' ? 'admin@e-misario.com' : 'usuario@empresa.com'}
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Contraseña</label>
              <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3 py-2.5 focus-within:border-cyan-400">
                <Lock className="w-4 h-4 text-slate-500 mr-2.5" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-transparent text-xs text-white focus:outline-none"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full py-3 rounded-xl font-semibold text-xs shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer ${
                roleMode === 'superadmin'
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white'
                  : 'bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white'
              }`}
            >
              {loading ? (
                'Autenticando...'
              ) : (
                <>
                  <span>Ingresar al {roleMode === 'superadmin' ? 'Panel Superadmin' : 'Dashboard de Cliente'}</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Accesos rápidos de Demostración */}
          <div className="mt-6 pt-6 border-t border-slate-800/80">
            <span className="block text-[11px] text-slate-500 text-center mb-2.5 uppercase tracking-wider font-semibold">
              Accesos Rápidos de Demostración
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <button
                type="button"
                onClick={fillDemoSuperadmin}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 py-1.5 px-2 rounded-lg text-center transition-colors cursor-pointer"
              >
                Superadmin Auto-fill
              </button>
              <button
                type="button"
                onClick={fillDemoTenant}
                className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 py-1.5 px-2 rounded-lg text-center transition-colors cursor-pointer"
              >
                Cliente Demo Auto-fill
              </button>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
