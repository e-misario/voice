'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Globe,
  Users,
  Sliders,
  Save,
  PlusCircle,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Activity,
  Layers,
  ArrowLeft,
  DollarSign,
  LayoutTemplate,
  Type,
  FileText,
  Sparkles,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { fetchAllPricing, updatePricing, fetchTenants, fetchHomeCMS, updateHomeCMS, DEFAULT_HOME_CMS } from '@/lib/api';
import { CountryPricing, Tenant, RoundingRule, HomeCMSConfig } from '@/types';

export default function SuperadminPage() {
  const [activeTab, setActiveTab] = useState<'cms' | 'pricing' | 'tenants' | 'system'>('cms');
  const [pricingList, setPricingList] = useState<CountryPricing[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [cmsConfig, setCmsConfig] = useState<HomeCMSConfig>(DEFAULT_HOME_CMS);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);

  // Estado para crear nuevo inquilino
  const [newTenantName, setNewTenantName] = useState<string>('');
  const [newTenantSlug, setNewTenantSlug] = useState<string>('');
  const [adminEmail, setAdminEmail] = useState<string>('');
  const [adminPass, setAdminPass] = useState<string>('');
  const [creatingTenant, setCreatingTenant] = useState<boolean>(false);

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      const cms = await fetchHomeCMS();
      setCmsConfig(cms);
      const p = await fetchAllPricing();
      setPricingList(p);
      const t = await fetchTenants();
      setTenants(t);
    } catch (err) {
      console.error('Error cargando datos de admin:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Guardar CMS
  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateHomeCMS(cmsConfig);
      setSaveSuccess('¡Contenidos del Home actualizados con éxito en el CMS!');
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err) {
      console.error('Error guardando CMS:', err);
    }
  };

  // Manejar cambio en fila de precios
  const handlePriceFieldChange = (index: number, field: keyof CountryPricing, value: any) => {
    const updated = [...pricingList];
    updated[index] = { ...updated[index], [field]: value };
    setPricingList(updated);
  };

  // Guardar cambio en base de datos
  const handleSavePriceRow = async (countryCode: string, item: CountryPricing) => {
    try {
      const res = await updatePricing(countryCode, {
        usd_base_price: Number(item.usd_base_price),
        exchange_rate: Number(item.exchange_rate),
        margin_pct: Number(item.margin_pct),
        rounding_rule: item.rounding_rule,
        plan_tier: item.plan_tier,
      });
      setSaveSuccess(`Precio para ${res.country_name} (${res.country_code}) guardado: ${res.formatted_price}`);
      setTimeout(() => setSaveSuccess(null), 4000);
      loadData();
    } catch (err) {
      console.error('Error al guardar precio:', err);
    }
  };

  // Crear nuevo tenant
  const handleCreateTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTenantName || !newTenantSlug || !adminEmail || !adminPass) return;
    setCreatingTenant(true);
    try {
      const res = await fetch('http://localhost:8000/api/v1/tenants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTenantName,
          slug: newTenantSlug.toLowerCase(),
          admin_email: adminEmail,
          admin_password: adminPass,
          admin_name: `Admin ${newTenantName}`,
        }),
      });
      if (res.ok) {
        setSaveSuccess(`Inquilino ${newTenantName} registrado con éxito.`);
        setNewTenantName('');
        setNewTenantSlug('');
        setAdminEmail('');
        setAdminPass('');
        loadData();
      }
    } catch (err) {
      console.error('Error creando inquilino:', err);
    } finally {
      setCreatingTenant(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Encabezado */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                <Shield className="w-4 h-4" />
              </span>
              <h1 className="text-2xl font-black text-white">Consola Superadmin — E-MIS@RIO SAS</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              CMS de la página Home, matriz de precios por país, gestión de inquilinos y monitor de VoiceStudio.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
              <span>Sincronizar</span>
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs text-slate-400 hover:text-white px-3 py-2 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Ver Home</span>
            </Link>
          </div>
        </div>

        {/* Notificación de éxito */}
        {saveSuccess && (
          <div className="mt-4 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2 animate-fade-in">
            <CheckCircle className="w-4 h-4 shrink-0" />
            <span>{saveSuccess}</span>
          </div>
        )}

        {/* Tabs de Navegación del Superadmin */}
        <div className="flex space-x-2 mt-8 border-b border-slate-800 text-xs font-semibold overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('cms')}
            className={`pb-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'cms'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <LayoutTemplate className="w-4 h-4" /> CMS del Home (Secciones & Textos)
          </button>
          <button
            onClick={() => setActiveTab('pricing')}
            className={`pb-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'pricing'
                ? 'border-indigo-400 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" /> Matriz de Precios por País
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`pb-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'tenants'
                ? 'border-purple-400 text-purple-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> Gestión de Inquilinos ({tenants.length})
          </button>
          <button
            onClick={() => setActiveTab('system')}
            className={`pb-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'system'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> Estado del Servidor & VPS
          </button>
        </div>

        {/* Tab 0: CMS del Home */}
        {activeTab === 'cms' && (
          <form onSubmit={handleSaveCMS} className="mt-8 space-y-8">
            {/* Sección 1: Hero */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Type className="w-4 h-4 text-cyan-400" />
                Sección 1 — Hero Principal (Encabezado del Home)
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Badge Superior</label>
                  <input
                    type="text"
                    value={cmsConfig.hero.badge_text}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        hero: { ...cmsConfig.hero, badge_text: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Título Destacado con Gradiente</label>
                  <input
                    type="text"
                    value={cmsConfig.hero.title_highlight}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        hero: { ...cmsConfig.hero, title_highlight: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Título Principal (H1)</label>
                  <input
                    type="text"
                    value={cmsConfig.hero.title_main}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        hero: { ...cmsConfig.hero, title_main: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Descripción / Subtítulo del Hero</label>
                  <textarea
                    rows={2}
                    value={cmsConfig.hero.description}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        hero: { ...cmsConfig.hero, description: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Texto Botón Primario (CTA)</label>
                  <input
                    type="text"
                    value={cmsConfig.hero.cta_primary_text}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        hero: { ...cmsConfig.hero, cta_primary_text: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Texto Botón Secundario (CTA)</label>
                  <input
                    type="text"
                    value={cmsConfig.hero.cta_secondary_text}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        hero: { ...cmsConfig.hero, cta_secondary_text: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Sección 2: Estudio Interactivo de Síntesis */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <Sparkles className="w-4 h-4 text-indigo-400" />
                Sección 2 — Demostración de Voz Neuronal
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Título de la Demo</label>
                  <input
                    type="text"
                    value={cmsConfig.demo.title}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        demo: { ...cmsConfig.demo, title: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Subtítulo de la Demo</label>
                  <input
                    type="text"
                    value={cmsConfig.demo.subtitle}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        demo: { ...cmsConfig.demo, subtitle: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-xs text-slate-400 mb-1">Texto por Defecto a Sintetizar</label>
                  <textarea
                    rows={2}
                    value={cmsConfig.demo.default_text}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        demo: { ...cmsConfig.demo, default_text: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Sección 3: Características */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
                <FileText className="w-4 h-4 text-purple-400" />
                Sección 3 — Bloques de Características
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Título de la Sección</label>
                  <input
                    type="text"
                    value={cmsConfig.features.header_title}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        features: { ...cmsConfig.features, header_title: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Subtítulo</label>
                  <input
                    type="text"
                    value={cmsConfig.features.header_subtitle}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        features: { ...cmsConfig.features, header_subtitle: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Sección 4: Precios (Header) */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Sección 4 — Encabezado de la Sección de Precios
                </h3>
                <button
                  type="button"
                  onClick={() => setActiveTab('pricing')}
                  className="text-xs text-cyan-400 hover:underline"
                >
                  Editar Valores y Monedas en la Matriz ➔
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Badge de Precios</label>
                  <input
                    type="text"
                    value={cmsConfig.pricing_header.badge}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        pricing_header: { ...cmsConfig.pricing_header, badge: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Título de Precios</label>
                  <input
                    type="text"
                    value={cmsConfig.pricing_header.title}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        pricing_header: { ...cmsConfig.pricing_header, title: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Subtítulo de Precios</label>
                  <input
                    type="text"
                    value={cmsConfig.pricing_header.subtitle}
                    onChange={(e) =>
                      setCmsConfig({
                        ...cmsConfig,
                        pricing_header: { ...cmsConfig.pricing_header, subtitle: e.target.value },
                      })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>
            </div>

            {/* Botón de Guardado del CMS */}
            <div className="flex justify-end">
              <button
                type="submit"
                className="bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-bold text-xs px-8 py-3.5 rounded-xl shadow-lg transition-all flex items-center gap-2 cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Todas las Secciones del CMS</span>
              </button>
            </div>
          </form>
        )}

        {/* Tab 1: Matriz de Precios por País */}
        {activeTab === 'pricing' && (
          <div className="mt-8 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-cyan-400" />
                    Ajuste de Precios, Divisas y Reglas de Redondeo
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Los cambios se calculan automáticamente y se reflejan en tiempo real en la página principal para cada país.
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[10px] border-b border-slate-800">
                    <tr>
                      <th className="py-3 px-3">País</th>
                      <th className="py-3 px-3">Divisa</th>
                      <th className="py-3 px-3">USD Base</th>
                      <th className="py-3 px-3">Tipo de Cambio</th>
                      <th className="py-3 px-3">Margen %</th>
                      <th className="py-3 px-3">Regla Redondeo</th>
                      <th className="py-3 px-3">Precio Local Actual</th>
                      <th className="py-3 px-3 text-right">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-850">
                    {pricingList.map((item, idx) => (
                      <tr key={item.country_code} className="hover:bg-slate-900/50 transition-colors">
                        <td className="py-3.5 px-3 font-semibold text-white">
                          {item.country_name} ({item.country_code})
                        </td>
                        <td className="py-3.5 px-3 font-mono text-cyan-300 font-bold">
                          {item.currency}
                        </td>
                        <td className="py-3.5 px-3">
                          <input
                            type="number"
                            value={item.usd_base_price}
                            onChange={(e) => handlePriceFieldChange(idx, 'usd_base_price', e.target.value)}
                            className="w-20 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                          />
                        </td>
                        <td className="py-3.5 px-3">
                          <input
                            type="number"
                            value={item.exchange_rate}
                            onChange={(e) => handlePriceFieldChange(idx, 'exchange_rate', e.target.value)}
                            className="w-24 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                          />
                        </td>
                        <td className="py-3.5 px-3">
                          <input
                            type="number"
                            value={item.margin_pct}
                            onChange={(e) => handlePriceFieldChange(idx, 'margin_pct', e.target.value)}
                            className="w-16 bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-400 font-mono"
                          />
                        </td>
                        <td className="py-3.5 px-3">
                          <select
                            value={item.rounding_rule}
                            onChange={(e) => handlePriceFieldChange(idx, 'rounding_rule', e.target.value as RoundingRule)}
                            className="bg-slate-950 border border-slate-700 rounded px-2 py-1 text-slate-200 focus:outline-none focus:border-cyan-400 text-xs"
                          >
                            <option value="thousands">Millares (1.000 COP)</option>
                            <option value="tens">Decenas (10 MXN)</option>
                            <option value="cents">Centavos (.99 USD)</option>
                            <option value="none">Sin redondeo</option>
                          </select>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-emerald-400 font-mono">
                          {item.formatted_price}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => handleSavePriceRow(item.country_code, item)}
                            className="inline-flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold shadow transition-all cursor-pointer"
                          >
                            <Save className="w-3.5 h-3.5" /> Guardar
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Gestión de Inquilinos */}
        {activeTab === 'tenants' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de Inquilinos */}
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800/80 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-400" />
                Inquilinos Registrados
              </h3>
              <div className="space-y-3">
                {tenants.map((t) => (
                  <div
                    key={t.id}
                    className="p-4 bg-slate-950 border border-slate-800 rounded-xl flex items-center justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{t.name}</span>
                        <span className="text-[10px] bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 px-2 py-0.5 rounded-full font-mono">
                          {t.slug}.voice.e-misario.com
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        ID: {t.id} · Cuota: {t.settings_json?.quota_tts_chars?.toLocaleString() || '500,000'} caracteres
                      </p>
                    </div>

                    <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-1 rounded-lg capitalize">
                      {t.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Crear Nuevo Inquilino */}
            <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-cyan-400" />
                Registrar Nuevo Inquilino
              </h3>

              <form onSubmit={handleCreateTenant} className="space-y-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nombre de la Empresa</label>
                  <input
                    type="text"
                    required
                    value={newTenantName}
                    onChange={(e) => setNewTenantName(e.target.value)}
                    placeholder="Ej. Clínica Santa María"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Subdominio / Slug</label>
                  <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                    <input
                      type="text"
                      required
                      value={newTenantSlug}
                      onChange={(e) => setNewTenantSlug(e.target.value)}
                      placeholder="santa-maria"
                      className="w-full bg-transparent p-2.5 text-xs text-white focus:outline-none font-mono"
                    />
                    <span className="text-[10px] text-slate-500 px-2">.voice...</span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Email Administrador</label>
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    placeholder="admin@santamaria.com"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Contraseña Inicial</label>
                  <input
                    type="password"
                    required
                    value={adminPass}
                    onChange={(e) => setAdminPass(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={creatingTenant}
                  className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs py-2.5 rounded-lg shadow transition-all cursor-pointer disabled:opacity-50"
                >
                  {creatingTenant ? 'Creando...' : 'Crear Inquilino'}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 3: Estado de VoiceStudio y VPS */}
        {activeTab === 'system' && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-semibold">Túnel Cloudflare</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="text-lg font-bold text-white">voice.e-misario.com</p>
                <p className="text-xs text-slate-500 mt-1">Puerto local dedicado 18095 en VPS 192.168.2.25:2210</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-semibold">VoiceStudio Motor</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                </div>
                <p className="text-lg font-bold text-white">VoiceStudio / F5-TTS</p>
                <p className="text-xs text-slate-500 mt-1">TTS / ASR / Zero-Shot Cloning activo</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-semibold">Base de Datos</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                </div>
                <p className="text-lg font-bold text-white">PostgreSQL Multi-Tenant</p>
                <p className="text-xs text-slate-500 mt-1">Aislamiento por Tenant ID y RLS</p>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
