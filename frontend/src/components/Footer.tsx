'use client';

import React from 'react';
import Link from 'next/link';
import { Mic, ShieldCheck, Cpu, Cloud, Terminal } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-950 border-t border-slate-900 text-slate-400 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center">
                <Mic className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-white text-base">E-MIS@RIO SAS</span>
            </div>
            <p className="text-xs text-slate-500 leading-relaxed">
              Plataforma SaaS multi-tenant empresarial de Voz con Inteligencia Artificial,
              TTS ultra-realista y clonación de voz personalizada potenciada por VoiceStudio.
            </p>
            <div className="flex items-center space-x-2 text-xs text-emerald-400 font-mono">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>voice.e-misario.com activo</span>
            </div>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Producto</h4>
            <ul className="space-y-2 text-xs">
              <li><Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Clonación de Voz</Link></li>
              <li><Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Estudio Text-to-Speech</Link></li>
              <li><Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Reuniones Bilingües en Vivo</Link></li>
              <li><Link href="/dashboard" className="hover:text-cyan-400 transition-colors">Transcripción ASR</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Integraciones</h4>
            <ul className="space-y-2 text-xs">
              <li><span className="text-slate-300">OpenAI / Claude / Gemini</span></li>
              <li><span className="text-slate-300">WhatsApp Cloud API</span></li>
              <li><span className="text-slate-300">Telegram Bot</span></li>
              <li><span className="text-slate-300">Pasarelas: Wompi / Stripe / MP</span></li>
            </ul>
          </div>

          <div>
            <h4 className="text-white font-semibold text-xs tracking-wider uppercase mb-3">Infraestructura</h4>
            <div className="space-y-2 text-xs text-slate-400">
              <div className="flex items-center space-x-2">
                <Cloud className="w-3.5 h-3.5 text-orange-400" />
                <span>Cloudflare Tunnel Protegido</span>
              </div>
              <div className="flex items-center space-x-2">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>VoiceStudio Engine v1.0</span>
              </div>
              <div className="flex items-center space-x-2">
                <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                <span>Aislamiento Multi-Tenant Estricto</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-slate-900 mt-8 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600">
          <p>© 2026 E-MIS@RIO SAS. Todos los derechos reservados.</p>
          <p className="mt-2 sm:mt-0 font-mono text-[11px]">Desplegado en ~/voice · Servidor VPS 192.168.2.25:2210</p>
        </div>
      </div>
    </footer>
  );
};
