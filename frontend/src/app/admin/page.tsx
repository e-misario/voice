'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Globe,
  Users,
  Save,
  PlusCircle,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Activity,
  ArrowLeft,
  DollarSign,
  LayoutTemplate,
  Type,
  FileText,
  Sparkles,
  Edit3,
  Trash2,
  X,
  AlertTriangle,
  ExternalLink,
  Layers,
  Database,
  Lock,
  LogOut,
  Key,
  ShieldCheck,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DataTable, DataTableColumn, DataTableSegmentFilter } from '@/components/DataTable';
import {
  fetchAllPricing,
  updatePricing,
  createCountryPricing,
  deleteCountryPricing,
  fetchTenants,
  createTenant,
  updateTenant,
  deleteTenant,
  fetchHomeCMS,
  updateHomeCMS,
  loginUser,
  DEFAULT_HOME_CMS,
} from '@/lib/api';
import { CountryPricing, Tenant, RoundingRule, HomeCMSConfig } from '@/types';

export default function SuperadminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [authEmail, setAuthEmail] = useState<string>('admin@e-misario.com');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authLoading, setAuthLoading] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [currentSuperadminEmail, setCurrentSuperadminEmail] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'cms' | 'pricing' | 'tenants' | 'system'>('pricing');
  const [pricingList, setPricingList] = useState<CountryPricing[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [cmsConfig, setCmsConfig] = useState<HomeCMSConfig>(DEFAULT_HOME_CMS);
  const [loading, setLoading] = useState<boolean>(true);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Modales de Precios
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const [editingPricing, setEditingPricing] = useState<CountryPricing | null>(null);
  const [pricingForm, setPricingForm] = useState({
    country_code: '',
    country_name: '',
    currency: 'USD',
    usd_base_price: 29.0,
    exchange_rate: 1.0,
    margin_pct: 10.0,
    rounding_rule: 'cents' as RoundingRule,
    plan_tier: 'pro',
  });
  const [deletingPricingCode, setDeletingPricingCode] = useState<string | null>(null);

  // Modales de Inquilinos
  const [isTenantModalOpen, setIsTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantForm, setTenantForm] = useState<{
    name: string;
    slug: string;
    admin_email: string;
    admin_password: string;
    status: 'active' | 'suspended' | 'trial';
    quota_tts: number;
    quota_asr: number;
  }>({
    name: '',
    slug: '',
    admin_email: '',
    admin_password: '',
    status: 'active',
    quota_tts: 500000,
    quota_asr: 1000,
  });
  const [deletingTenantId, setDeletingTenantId] = useState<string | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Cargar datos
  const loadData = async () => {
    setLoading(true);
    try {
      const [cms, p, t] = await Promise.all([
        fetchHomeCMS(),
        fetchAllPricing(),
        fetchTenants(),
      ]);
      setCmsConfig(cms);
      setPricingList(p);
      setTenants(t);
    } catch (err) {
      console.error('Error cargando datos de admin:', err);
      showNotification('Error al sincronizar datos del servidor', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('emisario_auth_token') : null;
    const role = typeof window !== 'undefined' ? localStorage.getItem('emisario_auth_role') : null;
    const email = typeof window !== 'undefined' ? localStorage.getItem('emisario_auth_email') : null;

    if (token && role === 'superadmin') {
      setIsAuthenticated(true);
      setCurrentSuperadminEmail(email || 'admin@e-misario.com');
      loadData();
    } else {
      setIsAuthenticated(false);
      setLoading(false);
    }
  }, []);

  const handleSuperadminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthLoading(true);
    setAuthError(null);

    try {
      const data = await loginUser(authEmail, authPassword);
      if (data.role !== 'superadmin') {
        throw new Error('Esta cuenta no posee privilegios de Administrador Global (Superadmin).');
      }
      localStorage.setItem('emisario_auth_token', data.access_token);
      localStorage.setItem('emisario_auth_role', data.role);
      localStorage.setItem('emisario_auth_email', data.email);
      localStorage.setItem('emisario_auth_name', data.full_name);
      setCurrentSuperadminEmail(data.email);
      setIsAuthenticated(true);
      showNotification('¡Bienvenido a la Consola Superadmin de E-MIS@RIO SAS!');
      loadData();
    } catch (err: any) {
      setAuthError(err.message || 'Credenciales de Superadmin incorrectas');
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('emisario_auth_token');
    localStorage.removeItem('emisario_auth_role');
    localStorage.removeItem('emisario_auth_email');
    localStorage.removeItem('emisario_auth_name');
    setIsAuthenticated(false);
    setAuthPassword('');
    showNotification('Sesión cerrada correctamente');
  };

  // Guardar CMS
  const handleSaveCMS = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateHomeCMS(cmsConfig);
      showNotification('¡Contenidos del Home actualizados con éxito en el CMS!');
    } catch (err) {
      console.error('Error guardando CMS:', err);
      showNotification('No se pudo guardar la configuración del CMS', 'error');
    }
  };

  // ==========================================
  // OPERACIONES CRUD: PRECIOS POR PAÍS
  // ==========================================
  const openCreatePricingModal = () => {
    setEditingPricing(null);
    setPricingForm({
      country_code: '',
      country_name: '',
      currency: 'COP',
      usd_base_price: 29.0,
      exchange_rate: 4100.0,
      margin_pct: 15.0,
      rounding_rule: 'thousands',
      plan_tier: 'pro',
    });
    setIsPricingModalOpen(true);
  };

  const openEditPricingModal = (item: CountryPricing) => {
    setEditingPricing(item);
    setPricingForm({
      country_code: item.country_code,
      country_name: item.country_name,
      currency: item.currency,
      usd_base_price: Number(item.usd_base_price),
      exchange_rate: Number(item.exchange_rate),
      margin_pct: Number(item.margin_pct),
      rounding_rule: item.rounding_rule,
      plan_tier: item.plan_tier,
    });
    setIsPricingModalOpen(true);
  };

  const handleSavePricing = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingPricing) {
        // Actualizar
        const res = await updatePricing(editingPricing.country_code, {
          usd_base_price: Number(pricingForm.usd_base_price),
          exchange_rate: Number(pricingForm.exchange_rate),
          margin_pct: Number(pricingForm.margin_pct),
          rounding_rule: pricingForm.rounding_rule,
          plan_tier: pricingForm.plan_tier,
        });
        showNotification(`Tarifa de ${res.country_name} actualizada: ${res.formatted_price}`);
      } else {
        // Crear
        const res = await createCountryPricing({
          country_code: pricingForm.country_code.toUpperCase().trim(),
          country_name: pricingForm.country_name.trim(),
          currency: pricingForm.currency.toUpperCase().trim(),
          usd_base_price: Number(pricingForm.usd_base_price),
          exchange_rate: Number(pricingForm.exchange_rate),
          margin_pct: Number(pricingForm.margin_pct),
          rounding_rule: pricingForm.rounding_rule,
          plan_tier: pricingForm.plan_tier,
        });
        showNotification(`Nuevo país ${res.country_name} (${res.country_code}) agregado exitosamente`);
      }
      setIsPricingModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Error guardando precio por país', 'error');
    }
  };

  const handleDeletePricing = async (countryCode: string) => {
    try {
      await deleteCountryPricing(countryCode);
      showNotification(`País (${countryCode}) eliminado de la matriz de precios`);
      setDeletingPricingCode(null);
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar precio', 'error');
    }
  };

  // ==========================================
  // OPERACIONES CRUD: INQUILINOS (TENANTS)
  // ==========================================
  const openCreateTenantModal = () => {
    setEditingTenant(null);
    setTenantForm({
      name: '',
      slug: '',
      admin_email: '',
      admin_password: '',
      status: 'active',
      quota_tts: 500000,
      quota_asr: 1000,
    });
    setIsTenantModalOpen(true);
  };

  const openEditTenantModal = (t: Tenant) => {
    setEditingTenant(t);
    setTenantForm({
      name: t.name,
      slug: t.slug,
      admin_email: '',
      admin_password: '',
      status: t.status,
      quota_tts: t.settings_json?.quota_tts_chars || 500000,
      quota_asr: t.settings_json?.quota_asr_minutes || 1000,
    });
    setIsTenantModalOpen(true);
  };

  const handleSaveTenant = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingTenant) {
        // Actualizar inquilino existente
        await updateTenant(editingTenant.id, {
          name: tenantForm.name,
          status: tenantForm.status,
          settings_json: {
            ...editingTenant.settings_json,
            quota_tts_chars: Number(tenantForm.quota_tts),
            quota_asr_minutes: Number(tenantForm.quota_asr),
          },
        });
        showNotification(`Inquilino '${tenantForm.name}' actualizado exitosamente`);
      } else {
        // Crear nuevo inquilino
        await createTenant({
          name: tenantForm.name,
          slug: tenantForm.slug.toLowerCase().trim(),
          admin_email: tenantForm.admin_email,
          admin_password: tenantForm.admin_password,
          admin_name: `Admin ${tenantForm.name}`,
        });
        showNotification(`Inquilino '${tenantForm.name}' registrado con éxito`);
      }
      setIsTenantModalOpen(false);
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Error al guardar inquilino', 'error');
    }
  };

  const handleDeleteTenant = async (id: string) => {
    try {
      await deleteTenant(id);
      showNotification('Inquilino eliminado exitosamente');
      setDeletingTenantId(null);
      loadData();
    } catch (err: any) {
      showNotification(err.message || 'Error al eliminar inquilino', 'error');
    }
  };

  // ==========================================
  // CONFIGURACIÓN DATATABLE: PRECIOS
  // ==========================================
  const pricingColumns: DataTableColumn<CountryPricing>[] = [
    {
      key: 'country_name',
      header: 'País / Región',
      sortable: true,
      render: (item) => (
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-md bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-[10px] font-bold text-indigo-300 font-mono">
            {item.country_code}
          </span>
          <div>
            <div className="font-semibold text-white text-xs">{item.country_name}</div>
            <div className="text-[10px] text-slate-400 font-mono">Tier: {item.plan_tier.toUpperCase()}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'currency',
      header: 'Divisa',
      sortable: true,
      render: (item) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-bold font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
          {item.currency}
        </span>
      ),
    },
    {
      key: 'usd_base_price',
      header: 'USD Base',
      sortable: true,
      accessor: (item) => item.usd_base_price,
      render: (item) => (
        <span className="font-mono text-slate-300">${item.usd_base_price.toFixed(2)} USD</span>
      ),
    },
    {
      key: 'exchange_rate',
      header: 'Tipo Cambio',
      sortable: true,
      accessor: (item) => item.exchange_rate,
      render: (item) => (
        <span className="font-mono text-slate-400">
          {item.exchange_rate.toLocaleString(undefined, { maximumFractionDigits: 4 })}
        </span>
      ),
    },
    {
      key: 'margin_pct',
      header: 'Margen',
      sortable: true,
      accessor: (item) => item.margin_pct,
      render: (item) => (
        <span className="font-mono text-indigo-300">+{item.margin_pct}%</span>
      ),
    },
    {
      key: 'rounding_rule',
      header: 'Redondeo',
      sortable: true,
      render: (item) => {
        const labels: Record<RoundingRule, string> = {
          thousands: 'Millares (1.000)',
          tens: 'Decenas (10)',
          cents: 'Centavos (.99)',
          none: 'Sin Redondeo',
        };
        return (
          <span className="text-[11px] text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {labels[item.rounding_rule] || item.rounding_rule}
          </span>
        );
      },
    },
    {
      key: 'calculated_local_price',
      header: 'Precio Formateado',
      sortable: true,
      accessor: (item) => item.calculated_local_price,
      render: (item) => (
        <span className="font-bold font-mono text-emerald-400 text-xs">
          {item.formatted_price}
        </span>
      ),
    },
  ];

  const pricingSegments: DataTableSegmentFilter<CountryPricing>[] = [
    {
      id: 'all',
      label: 'Todos los Países',
      filterFn: () => true,
    },
    {
      id: 'latam',
      label: 'América Latina',
      filterFn: (item) => ['CO', 'MX', 'AR', 'CL', 'PE', 'BR'].includes(item.country_code),
    },
    {
      id: 'na',
      label: 'Norteamérica',
      filterFn: (item) => ['US', 'CA'].includes(item.country_code),
    },
    {
      id: 'eur',
      label: 'Europa & Global',
      filterFn: (item) => ['ES', 'EU', 'FR', 'DE', 'UK'].includes(item.country_code) || item.currency === 'EUR',
    },
  ];

  // ==========================================
  // CONFIGURACIÓN DATATABLE: INQUILINOS
  // ==========================================
  const tenantColumns: DataTableColumn<Tenant>[] = [
    {
      key: 'name',
      header: 'Empresa / Inquilino',
      sortable: true,
      render: (t) => (
        <div>
          <div className="font-bold text-white text-xs">{t.name}</div>
          <div className="text-[10px] text-slate-500 font-mono">ID: {t.id}</div>
        </div>
      ),
    },
    {
      key: 'slug',
      header: 'Subdominio SaaS',
      sortable: true,
      render: (t) => (
        <a
          href={`http://${t.slug}.voice.e-misario.com`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-mono text-indigo-300 hover:text-indigo-200 text-[11px] bg-indigo-500/10 px-2 py-0.5 rounded border border-indigo-500/20"
        >
          <span>{t.slug}.voice.e-misario.com</span>
          <ExternalLink className="w-3 h-3" />
        </a>
      ),
    },
    {
      key: 'quota_tts',
      header: 'Cuota TTS',
      sortable: true,
      accessor: (t) => t.settings_json?.quota_tts_chars || 0,
      render: (t) => (
        <span className="font-mono text-slate-300 text-xs">
          {(t.settings_json?.quota_tts_chars || 500000).toLocaleString()} chars
        </span>
      ),
    },
    {
      key: 'quota_asr',
      header: 'Cuota ASR',
      sortable: true,
      accessor: (t) => t.settings_json?.quota_asr_minutes || 0,
      render: (t) => (
        <span className="font-mono text-slate-400 text-xs">
          {(t.settings_json?.quota_asr_minutes || 1000).toLocaleString()} mins
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      render: (t) => {
        const isAct = t.status === 'active';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
              isAct
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/30'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isAct ? 'bg-emerald-400' : 'bg-amber-400'}`} />
            {t.status}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Fecha Registro',
      sortable: true,
      render: (t) => (
        <span className="text-slate-500 text-[11px]">
          {t.created_at ? new Date(t.created_at).toLocaleDateString() : 'Activo'}
        </span>
      ),
    },
  ];

  const tenantSegments: DataTableSegmentFilter<Tenant>[] = [
    {
      id: 'all',
      label: 'Todos los Inquilinos',
      filterFn: () => true,
    },
    {
      id: 'active',
      label: 'Activos',
      filterFn: (t) => t.status === 'active',
    },
    {
      id: 'suspended',
      label: 'Suspendidos',
      filterFn: (t) => t.status === 'suspended',
    },
    {
      id: 'trial',
      label: 'En Prueba',
      filterFn: (t) => t.status === 'trial',
    },
  ];

  // Si no está autenticado como Superadmin, exigir credenciales
  if (isAuthenticated === false) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <Navbar />

        <main className="flex-1 flex items-center justify-center px-4 sm:px-6 lg:px-8 py-16">
          <div className="max-w-md w-full bg-slate-900/80 border border-slate-800 rounded-2xl p-8 shadow-2xl backdrop-blur-md">
            {/* Header del Login Superadmin */}
            <div className="text-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-cyan-500 flex items-center justify-center mx-auto mb-4 text-white shadow-xl shadow-indigo-500/20">
                <ShieldCheck className="w-8 h-8" />
              </div>
              <h1 className="text-2xl font-black text-white tracking-tight">Consola Superadmin</h1>
              <p className="text-xs text-slate-400 mt-1.5">
                E-MIS@RIO SAS · Acceso estrictamente restringido con credenciales maestras.
              </p>
            </div>

            {authError && (
              <div className="mb-5 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-xs flex items-center gap-2.5">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}

            <form onSubmit={handleSuperadminLogin} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-300 font-semibold mb-1.5">
                  Correo Electrónico de Superadmin
                </label>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
                  <Shield className="w-4 h-4 text-slate-500 mr-2.5" />
                  <input
                    type="email"
                    required
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="admin@e-misario.com"
                    className="w-full bg-transparent text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs text-slate-300 font-semibold">
                    Contraseña Maestra
                  </label>
                  <span className="text-[10px] text-slate-500">Cifrado bcrypt</span>
                </div>
                <div className="flex items-center bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/30 transition-all">
                  <Lock className="w-4 h-4 text-slate-500 mr-2.5" />
                  <input
                    type="password"
                    required
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full bg-transparent text-xs text-white focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={authLoading}
                className="w-full mt-2 py-3 bg-gradient-to-r from-indigo-600 via-indigo-500 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {authLoading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Verificando credenciales...</span>
                  </>
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Ingresar a la Consola de Administración</span>
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 pt-5 border-t border-slate-800 text-center">
              <Link
                href="/"
                className="text-xs text-slate-500 hover:text-white transition-colors inline-flex items-center justify-center gap-1.5"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Volver a la página principal</span>
              </Link>
            </div>
          </div>
        </main>

        <Footer />
      </div>
    );
  }

  // Loader inicial mientras se comprueba localStorage
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between">
        <Navbar />
        <main className="flex-1 flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-3">
            <RefreshCw className="w-8 h-8 text-indigo-400 animate-spin" />
            <span className="text-xs text-slate-400">Verificando sesión segura...</span>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

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
              CMS del Home, DataTables con segmentación y CRUD de precios por país, inquilinos multi-tenant y monitor de infraestructura.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-[11px] text-indigo-300 font-mono">
              <Shield className="w-3.5 h-3.5 text-indigo-400" />
              <span>{currentSuperadminEmail || 'admin@e-misario.com'}</span>
            </div>

            <button
              onClick={loadData}
              disabled={loading}
              className="inline-flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs px-3.5 py-2 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-cyan-400 ${loading ? 'animate-spin' : ''}`} />
              <span>Sincronizar</span>
            </button>

            <button
              onClick={handleLogout}
              title="Cerrar Sesión Superadmin"
              className="inline-flex items-center gap-1.5 bg-red-950/40 hover:bg-red-900/60 border border-red-800/60 text-xs text-red-300 hover:text-white px-3 py-2 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
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

        {/* Notificación */}
        {notification && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Pestañas de Superadmin */}
        <div className="flex space-x-2 mt-8 border-b border-slate-800 text-xs font-semibold overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('pricing')}
            className={`pb-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'pricing'
                ? 'border-indigo-400 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Globe className="w-4 h-4" /> DataTable de Precios por País ({pricingList.length})
          </button>
          <button
            onClick={() => setActiveTab('tenants')}
            className={`pb-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'tenants'
                ? 'border-purple-400 text-purple-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" /> DataTable de Inquilinos ({tenants.length})
          </button>
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
            onClick={() => setActiveTab('system')}
            className={`pb-3 px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'system'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Activity className="w-4 h-4" /> Estado de Infraestructura & VPS
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: DATATABLE DE PRECIOS POR PAÍS                     */}
        {/* ======================================================== */}
        {activeTab === 'pricing' && (
          <div className="mt-8 space-y-4">
            <DataTable<CountryPricing>
              title="Matriz Global de Precios y Divisas"
              subtitle="Gestione tipos de cambio, márgenes y reglas de redondeo psicológico en tiempo real."
              data={pricingList}
              columns={pricingColumns}
              searchFields={['country_name', 'country_code', 'currency', 'plan_tier']}
              searchPlaceholder="Buscar por país, código ISO o divisa..."
              segments={pricingSegments}
              onCreate={openCreatePricingModal}
              createLabel="Nuevo País / Tarifa"
              defaultPageSize={5}
              rowKey={(item) => item.country_code}
              actions={(item) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openEditPricingModal(item)}
                    title="Editar Tarifa"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingPricingCode(item.country_code)}
                    title="Eliminar País"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 2: DATATABLE DE INQUILINOS (TENANTS)                 */}
        {/* ======================================================== */}
        {activeTab === 'tenants' && (
          <div className="mt-8 space-y-4">
            <DataTable<Tenant>
              title="Directorio de Inquilinos y Subdominios"
              subtitle="Supervise empresas registradas, cuotas asignadas y estados de operación."
              data={tenants}
              columns={tenantColumns}
              searchFields={['name', 'slug', 'status']}
              searchPlaceholder="Buscar por empresa o subdominio..."
              segments={tenantSegments}
              onCreate={openCreateTenantModal}
              createLabel="Registrar Inquilino"
              defaultPageSize={5}
              rowKey={(t) => t.id}
              actions={(t) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => openEditTenantModal(t)}
                    title="Editar Inquilino"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeletingTenantId(t.id)}
                    title="Eliminar Inquilino"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: CMS DEL HOME                                      */}
        {/* ======================================================== */}
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

        {/* ======================================================== */}
        {/* TAB 4: ESTADO DE INFRAESTRUCTURA Y VPS                  */}
        {/* ======================================================== */}
        {activeTab === 'system' && (
          <div className="mt-8 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-semibold">Túnel Cloudflare</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
                </div>
                <p className="text-lg font-bold text-white">voice.e-misario.com</p>
                <p className="text-xs text-slate-500 mt-1">Puerto dedicado 18095 en servidor 192.168.2.25:2210</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-semibold">Motor VoiceStudio</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
                </div>
                <p className="text-lg font-bold text-white">VoiceStudio / F5-TTS</p>
                <p className="text-xs text-slate-500 mt-1">Síntesis TTS, ASR y clonación zero-shot activa</p>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400 font-semibold">Base de Datos</span>
                  <span className="w-2.5 h-2.5 rounded-full bg-indigo-400" />
                </div>
                <p className="text-lg font-bold text-white">PostgreSQL Multi-Tenant</p>
                <p className="text-xs text-slate-500 mt-1">Aislamiento por Tenant ID con cifrado Fernet</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* ======================================================== */}
      {/* MODAL: CREAR / EDITAR PRECIO DE PAÍS                     */}
      {/* ======================================================== */}
      {isPricingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-scale-in">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-indigo-400" />
                {editingPricing ? `Editar Tarifa: ${editingPricing.country_name}` : 'Crear Nueva Tarifa de País'}
              </h3>
              <button
                onClick={() => setIsPricingModalOpen(false)}
                className="text-slate-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSavePricing} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Código ISO País</label>
                  <input
                    type="text"
                    required
                    maxLength={2}
                    disabled={!!editingPricing}
                    value={pricingForm.country_code}
                    onChange={(e) => setPricingForm({ ...pricingForm, country_code: e.target.value.toUpperCase() })}
                    placeholder="CO, MX, US..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white uppercase font-mono disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Nombre del País</label>
                  <input
                    type="text"
                    required
                    disabled={!!editingPricing}
                    value={pricingForm.country_name}
                    onChange={(e) => setPricingForm({ ...pricingForm, country_name: e.target.value })}
                    placeholder="Colombia, México..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white disabled:opacity-50"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Divisa Local</label>
                  <input
                    type="text"
                    required
                    maxLength={3}
                    disabled={!!editingPricing}
                    value={pricingForm.currency}
                    onChange={(e) => setPricingForm({ ...pricingForm, currency: e.target.value.toUpperCase() })}
                    placeholder="COP, MXN, USD..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white uppercase font-mono disabled:opacity-50"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tier / Nivel</label>
                  <select
                    value={pricingForm.plan_tier}
                    onChange={(e) => setPricingForm({ ...pricingForm, plan_tier: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                  >
                    <option value="starter">Starter</option>
                    <option value="pro">Pro (Predeterminado)</option>
                    <option value="enterprise">Enterprise</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">USD Base ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={pricingForm.usd_base_price}
                    onChange={(e) => setPricingForm({ ...pricingForm, usd_base_price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Tipo Cambio</label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={pricingForm.exchange_rate}
                    onChange={(e) => setPricingForm({ ...pricingForm, exchange_rate: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Margen (%)</label>
                  <input
                    type="number"
                    step="1"
                    required
                    value={pricingForm.margin_pct}
                    onChange={(e) => setPricingForm({ ...pricingForm, margin_pct: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Regla de Redondeo Psicológico</label>
                <select
                  value={pricingForm.rounding_rule}
                  onChange={(e) => setPricingForm({ ...pricingForm, rounding_rule: e.target.value as RoundingRule })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                >
                  <option value="thousands">Millares (ej. 137.000 COP, 45.000 CLP)</option>
                  <option value="tens">Decenas (ej. 620 MXN, 350 ARS)</option>
                  <option value="cents">Centavos (ej. 29.99 USD, 39.99 CAD)</option>
                  <option value="none">Sin redondeo (valor exacto)</option>
                </select>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsPricingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 shadow cursor-pointer"
                >
                  {editingPricing ? 'Actualizar Tarifa' : 'Crear Tarifa'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE PRECIO                   */}
      {/* ======================================================== */}
      {deletingPricingCode && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-sm">Eliminar Tarifa de País</h3>
            </div>
            <p className="text-xs text-slate-400">
              ¿Estás seguro de que deseas eliminar la tarifa para el país <span className="font-bold text-white">{deletingPricingCode}</span>? Los usuarios de esta región recurrirán a la tarifa predeterminada.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingPricingCode(null)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeletePricing(deletingPricingCode)}
                className="px-3 py-1.5 rounded-lg text-xs bg-red-600 hover:bg-red-500 text-white font-semibold cursor-pointer"
              >
                Eliminar Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CREAR / EDITAR INQUILINO (TENANT)                 */}
      {/* ======================================================== */}
      {isTenantModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-400" />
                {editingTenant ? `Editar Inquilino: ${editingTenant.name}` : 'Registrar Nuevo Inquilino'}
              </h3>
              <button
                onClick={() => setIsTenantModalOpen(false)}
                className="text-slate-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveTenant} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nombre de la Empresa</label>
                <input
                  type="text"
                  required
                  value={tenantForm.name}
                  onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })}
                  placeholder="Ej. Clínica San Lucas"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                />
              </div>

              {!editingTenant && (
                <>
                  <div>
                    <label className="block text-xs text-slate-400 mb-1">Subdominio / Slug</label>
                    <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg overflow-hidden">
                      <input
                        type="text"
                        required
                        value={tenantForm.slug}
                        onChange={(e) => setTenantForm({ ...tenantForm, slug: e.target.value })}
                        placeholder="san-lucas"
                        className="w-full bg-transparent p-2.5 text-xs text-white focus:outline-none font-mono"
                      />
                      <span className="text-[10px] text-slate-500 px-2">.voice.e-misario...</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Email Administrador</label>
                      <input
                        type="email"
                        required
                        value={tenantForm.admin_email}
                        onChange={(e) => setTenantForm({ ...tenantForm, admin_email: e.target.value })}
                        placeholder="admin@empresa.com"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-slate-400 mb-1">Contraseña Inicial</label>
                      <input
                        type="password"
                        required
                        value={tenantForm.admin_password}
                        onChange={(e) => setTenantForm({ ...tenantForm, admin_password: e.target.value })}
                        placeholder="••••••••"
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white"
                      />
                    </div>
                  </div>
                </>
              )}

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Estado</label>
                  <select
                    value={tenantForm.status}
                    onChange={(e) => setTenantForm({ ...tenantForm, status: e.target.value as 'active' | 'suspended' | 'trial' })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white capitalize"
                  >
                    <option value="active">Activo</option>
                    <option value="suspended">Suspendido</option>
                    <option value="trial">En Prueba</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Cuota TTS (chars)</label>
                  <input
                    type="number"
                    step="50000"
                    required
                    value={tenantForm.quota_tts}
                    onChange={(e) => setTenantForm({ ...tenantForm, quota_tts: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
                  />
                </div>
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Cuota ASR (min)</label>
                  <input
                    type="number"
                    step="100"
                    required
                    value={tenantForm.quota_asr}
                    onChange={(e) => setTenantForm({ ...tenantForm, quota_asr: parseInt(e.target.value) || 0 })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white font-mono"
                  />
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTenantModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow cursor-pointer"
                >
                  {editingTenant ? 'Guardar Cambios' : 'Registrar Inquilino'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE INQUILINO                */}
      {/* ======================================================== */}
      {deletingTenantId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-sm">Eliminar Inquilino</h3>
            </div>
            <p className="text-xs text-slate-400">
              ¿Estás seguro de que deseas eliminar este inquilino? Se cancelará el acceso al subdominio y se revocarán todas sus claves y salas.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingTenantId(null)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteTenant(deletingTenantId)}
                className="px-3 py-1.5 rounded-lg text-xs bg-red-600 hover:bg-red-500 text-white font-semibold cursor-pointer"
              >
                Eliminar Inquilino
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
