'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mic,
  Volume2,
  Sparkles,
  Play,
  Pause,
  Upload,
  Globe,
  CheckCircle,
  ArrowRight,
  ShieldCheck,
  Zap,
  Users,
  MessageSquare,
  Building2,
  Headphones,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { fetchGeoPricing, fetchVoices, synthesizeTTS, fetchHomeCMS, DEFAULT_HOME_CMS } from '@/lib/api';
import { GeoPricingResponse, Voice, HomeCMSConfig } from '@/types';

export default function HomePage() {
  const [selectedCountry, setSelectedCountry] = useState<string>('CO');
  const [pricingData, setPricingData] = useState<GeoPricingResponse | null>(null);
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoiceId, setSelectedVoiceId] = useState<string>('preset-valeria-es');
  const [cmsConfig, setCmsConfig] = useState<HomeCMSConfig>(DEFAULT_HOME_CMS);
  const [demoText, setDemoText] = useState<string>(DEFAULT_HOME_CMS.demo.default_text);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioPlayer, setAudioPlayer] = useState<HTMLAudioElement | null>(null);

  // Cargar datos de CMS, precios geográficos y voces
  useEffect(() => {
    async function loadData() {
      try {
        const cms = await fetchHomeCMS();
        setCmsConfig(cms);
        setDemoText(cms.demo.default_text);

        const pricing = await fetchGeoPricing(selectedCountry);
        setPricingData(pricing);

        const voiceList = await fetchVoices();
        setVoices(voiceList);
        if (voiceList.length > 0) {
          setSelectedVoiceId(voiceList[0].id);
        }
      } catch (err) {
        console.error('Error al cargar datos iniciales:', err);
      }
    }
    loadData();
  }, [selectedCountry]);

  // Manejar reproducción de audio sintetizado
  const handlePlayTTS = async () => {
    if (audioUrl) {
      if (isPlaying && audioPlayer) {
        audioPlayer.pause();
        setIsPlaying(false);
      } else {
        const audio = new Audio(audioUrl);
        setAudioPlayer(audio);
        audio.onended = () => setIsPlaying(false);
        audio.play();
        setIsPlaying(true);
      }
      return;
    }

    try {
      setIsGenerating(true);
      const res = await synthesizeTTS({
        text: demoText,
        voice_id: selectedVoiceId,
        speed: 1.0,
      });

      const url = `data:audio/${res.format};base64,${res.audio_base64}`;
      setAudioUrl(url);

      const audio = new Audio(url);
      setAudioPlayer(audio);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Error generando TTS:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  // Calcular precios para los 3 tiers
  const currency = pricingData ? pricingData.currency : 'COP';

  const tierPrices = {
    starter: pricingData ? (currency === 'COP' ? '$59.000 COP' : currency === 'MXN' ? '$290 MXN' : '$14.99 USD') : '$59.000 COP',
    pro: pricingData?.formatted_price || '$137.000 COP',
    enterprise: pricingData ? (currency === 'COP' ? '$399.000 COP' : currency === 'MXN' ? '$1.890 MXN' : '$99.00 USD') : '$399.000 COP',
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500 selection:text-black">
      <Navbar currentCountry={selectedCountry} onCountryChange={(c) => setSelectedCountry(c)} />

      {/* Hero Section Administrado por CMS */}
      <section className="relative overflow-hidden pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[350px] bg-indigo-600/20 blur-[130px] rounded-full pointer-events-none" />
        <div className="absolute top-1/3 left-1/3 -translate-x-1/2 w-[400px] h-[250px] bg-cyan-500/15 blur-[120px] rounded-full pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <div className="inline-flex items-center space-x-2 bg-slate-900/90 border border-slate-700/60 rounded-full px-3.5 py-1.5 mb-6 text-xs text-slate-300 shadow-inner">
            <span className="flex h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            <span className="font-semibold text-cyan-300">{cmsConfig.hero.badge_text}</span>
            <span className="text-slate-500">|</span>
            <span>Precios Adaptativos en {currency}</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black tracking-tight max-w-4xl mx-auto leading-tight md:leading-[1.15]">
            {cmsConfig.hero.title_main}{' '}
            <span className="bg-gradient-to-r from-indigo-400 via-purple-300 to-cyan-400 bg-clip-text text-transparent">
              {cmsConfig.hero.title_highlight}
            </span>
          </h1>

          <p className="mt-6 text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            {cmsConfig.hero.description}
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/dashboard"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-sm px-7 py-3.5 rounded-xl shadow-lg shadow-indigo-500/25 transition-all"
            >
              <span>{cmsConfig.hero.cta_primary_text}</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="/admin"
              className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 hover:text-white font-medium text-sm px-6 py-3.5 rounded-xl transition-colors"
            >
              <ShieldCheck className="w-4 h-4 text-indigo-400" />
              <span>{cmsConfig.hero.cta_secondary_text}</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Estudio Interactivo TTS en Vivo Administrado por CMS */}
      <section className="py-12 bg-slate-900/40 border-y border-slate-900">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-2">
                  <Headphones className="w-5 h-5 text-cyan-400" />
                  {cmsConfig.demo.title}
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  {cmsConfig.demo.subtitle}
                </p>
              </div>

              {/* Selector de Voz */}
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-400 font-medium">Voz:</span>
                <select
                  value={selectedVoiceId}
                  onChange={(e) => {
                    setSelectedVoiceId(e.target.value);
                    setAudioUrl(null);
                  }}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-200 rounded-lg px-3 py-2 focus:outline-none focus:border-cyan-500 cursor-pointer"
                >
                  {voices.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.name} ({v.voice_type === 'cloned' ? 'Clonada' : 'Preset'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Input de Texto */}
            <div className="mt-6">
              <textarea
                value={demoText}
                onChange={(e) => {
                  setDemoText(e.target.value);
                  setAudioUrl(null);
                }}
                rows={3}
                className="w-full bg-slate-950/70 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
                placeholder="Escribe el texto a sintetizar..."
              />
            </div>

            {/* Barra de Controles y Reproductor */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={handlePlayTTS}
                  disabled={isGenerating}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs px-5 py-2.5 rounded-lg shadow-md transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Sintetizando...</span>
                    </>
                  ) : isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" />
                      <span>Pausar Audio</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" />
                      <span>Escuchar Voz</span>
                    </>
                  )}
                </button>

                {audioUrl && (
                  <span className="text-xs text-emerald-400 flex items-center gap-1 font-mono">
                    <CheckCircle className="w-3.5 h-3.5" /> Audio WAV sintetizado
                  </span>
                )}
              </div>

              <div className="text-[11px] text-slate-500 font-mono">
                Motor: <span className="text-cyan-400 font-semibold">VoiceStudio / F5-TTS Neural</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Características Administradas por CMS */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-16">
          <h2 className="text-3xl font-extrabold text-white">{cmsConfig.features.header_title}</h2>
          <p className="mt-3 text-sm text-slate-400">
            {cmsConfig.features.header_subtitle}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {cmsConfig.features.cards.map((card, idx) => (
            <div key={idx} className="bg-slate-900/60 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-4">
                {idx === 0 ? <Mic className="w-5 h-5 text-indigo-400" /> : idx === 1 ? <Globe className="w-5 h-5 text-cyan-400" /> : <Building2 className="w-5 h-5 text-purple-400" />}
              </div>
              <h3 className="text-lg font-bold text-white mb-2">{card.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                {card.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Matriz de Precios Adaptativos por País Administrada por CMS */}
      <section className="py-20 bg-slate-900/30 border-t border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <div className="inline-flex items-center space-x-2 text-xs font-semibold text-cyan-400 mb-2">
              <Globe className="w-4 h-4" />
              <span>{cmsConfig.pricing_header.badge}</span>
            </div>
            <h2 className="text-3xl font-extrabold text-white">{cmsConfig.pricing_header.title}</h2>
            <p className="mt-2 text-sm text-slate-400">
              {cmsConfig.pricing_header.subtitle} Detectado para visitantes en <span className="text-white font-semibold">{pricingData?.detected_country || 'Colombia'}</span>.
            </p>
          </div>

          {/* Cards de Planes */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Plan Starter */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Starter</h3>
                <p className="text-xs text-slate-400 mt-1">Para creadores y pequeños negocios.</p>
                <div className="mt-6">
                  <span className="text-3xl font-black text-white">{tierPrices.starter}</span>
                  <span className="text-xs text-slate-500 ml-1">/ mes</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400" /> 100.000 caracteres TTS al mes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400" /> 1 voz clonada exclusiva
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400" /> Catálogo de presets de VoiceStudio
                  </li>
                </ul>
              </div>

              <Link
                href="/dashboard"
                className="mt-8 block text-center bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs py-3 rounded-xl transition-colors"
              >
                Comenzar con Starter
              </Link>
            </div>

            {/* Plan Pro (Destacado) */}
            <div className="bg-gradient-to-b from-indigo-950/60 to-slate-900 border-2 border-indigo-500 rounded-2xl p-8 flex flex-col justify-between shadow-xl shadow-indigo-500/10 relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-gradient-to-r from-indigo-500 to-cyan-400 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full shadow">
                Más Popular
              </div>

              <div>
                <h3 className="text-lg font-bold text-white">Pro Empresarial</h3>
                <p className="text-xs text-slate-300 mt-1">Para equipos con alto volumen de audio y soporte.</p>
                <div className="mt-6">
                  <span className="text-4xl font-black text-white">{tierPrices.pro}</span>
                  <span className="text-xs text-slate-400 ml-1">/ mes</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-200">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> 1.000.000 caracteres TTS al mes
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> 5 voces clonadas de alta fidelidad
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Integración con WhatsApp Cloud y Telegram
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Salas de reuniones bilingües ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400" /> Pasarela Wompi / MercadoPago / Stripe
                  </li>
                </ul>
              </div>

              <Link
                href="/dashboard"
                className="mt-8 block text-center bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs py-3.5 rounded-xl shadow-lg transition-all"
              >
                Suscribirse a Pro
              </Link>
            </div>

            {/* Plan Enterprise */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-2xl p-8 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-white">Enterprise Dedicado</h3>
                <p className="text-xs text-slate-400 mt-1">Infraestructura privada y soporte 24/7.</p>
                <div className="mt-6">
                  <span className="text-3xl font-black text-white">{tierPrices.enterprise}</span>
                  <span className="text-xs text-slate-500 ml-1">/ mes</span>
                </div>

                <ul className="mt-6 space-y-3 text-xs text-slate-300">
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400" /> Caracteres y clonaciones ilimitadas
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400" /> Servidor VoiceStudio GPU dedicado
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400" /> Dominio personalizado completo
                  </li>
                  <li className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-cyan-400" /> SLA garantizado del 99.9%
                  </li>
                </ul>
              </div>

              <Link
                href="/dashboard"
                className="mt-8 block text-center bg-slate-800 hover:bg-slate-700 text-white font-medium text-xs py-3 rounded-xl transition-colors"
              >
                Contactar Ventas
              </Link>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
