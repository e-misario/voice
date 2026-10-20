/**
 * Cliente API para el SaaS de Voz con IA — E-MIS@RIO SAS
 */
import {
  GeoPricingResponse,
  CountryPricing,
  Voice,
  TTSResponse,
  TTSRequest,
  Tenant,
  Integration,
  Meeting,
} from '@/types';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname === 'voice.e-misario.com'
    ? '/api/v1'
    : 'http://localhost:8000/api/v1');

export async function fetchGeoPricing(country?: string): Promise<GeoPricingResponse> {
  const url = country ? `${API_BASE_URL}/pricing/geo?country=${encodeURIComponent(country)}` : `${API_BASE_URL}/pricing/geo`;
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error('Error al obtener precios');
    return await res.json();
  } catch (err) {
    // Fallback de contingencia si el backend está en proceso de despliegue
    return {
      detected_country: country || 'CO',
      currency: country === 'US' ? 'USD' : country === 'MX' ? 'MXN' : 'COP',
      price: country === 'US' ? 29.99 : country === 'MX' ? 590 : 137000,
      formatted_price: country === 'US' ? '$29.99 USD' : country === 'MX' ? '$590 MXN' : '$137.000 COP',
      usd_equivalent: 29.0,
      plan_tier: 'pro',
      all_plans: [
        {
          id: 'def-co',
          country_code: 'CO',
          country_name: 'Colombia',
          currency: 'COP',
          usd_base_price: 29.0,
          exchange_rate: 4100.0,
          margin_pct: 15.0,
          calculated_local_price: 137000,
          rounding_rule: 'thousands',
          plan_tier: 'pro',
          formatted_price: '$137.000 COP',
        },
        {
          id: 'def-mx',
          country_code: 'MX',
          country_name: 'México',
          currency: 'MXN',
          usd_base_price: 29.0,
          exchange_rate: 18.5,
          margin_pct: 15.0,
          calculated_local_price: 620,
          rounding_rule: 'tens',
          plan_tier: 'pro',
          formatted_price: '$620 MXN',
        },
        {
          id: 'def-us',
          country_code: 'US',
          country_name: 'Estados Unidos',
          currency: 'USD',
          usd_base_price: 29.0,
          exchange_rate: 1.0,
          margin_pct: 0.0,
          calculated_local_price: 29.99,
          rounding_rule: 'cents',
          plan_tier: 'pro',
          formatted_price: '$29.99 USD',
        },
      ],
    };
  }
}

export async function fetchAllPricing(): Promise<CountryPricing[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/pricing`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Error al listar precios');
    return await res.json();
  } catch {
    const geo = await fetchGeoPricing();
    return geo.all_plans;
  }
}

export async function updatePricing(
  countryCode: string,
  payload: Partial<CountryPricing>
): Promise<CountryPricing> {
  const res = await fetch(`${API_BASE_URL}/pricing/${encodeURIComponent(countryCode)}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('No se pudo actualizar el precio');
  return await res.json();
}

export async function fetchVoices(tenantId: string = 'default-tenant-emisario'): Promise<Voice[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/voice/voices`, {
      headers: { 'X-Tenant-ID': tenantId },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Error al obtener voces');
    return await res.json();
  } catch {
    return [
      {
        id: 'preset-valeria-es',
        tenant_id: 'system',
        name: 'Valeria (Corporativa ES)',
        voice_type: 'preset',
        language: 'es',
        gender: 'female',
        description: 'Voz femenina cálida y profesional para atención al cliente y soporte.',
        is_default: true,
      },
      {
        id: 'preset-mateo-es',
        tenant_id: 'system',
        name: 'Mateo (Dinámico ES)',
        voice_type: 'preset',
        language: 'es',
        gender: 'male',
        description: 'Voz masculina energética y persuasiva para ventas.',
        is_default: false,
      },
      {
        id: 'preset-sophia-bilingual',
        tenant_id: 'system',
        name: 'Sophia (Bilingüe ES/EN)',
        voice_type: 'preset',
        language: 'es',
        gender: 'female',
        description: 'Voz bilingüe especializada en traducción simultánea.',
        is_default: false,
      },
    ];
  }
}

export async function synthesizeTTS(payload: TTSRequest): Promise<TTSResponse> {
  const res = await fetch(`${API_BASE_URL}/voice/tts`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error en síntesis TTS');
  return await res.json();
}

export async function cloneVoice(
  formData: FormData,
  tenantId: string = 'default-tenant-emisario'
): Promise<Voice> {
  const res = await fetch(`${API_BASE_URL}/voice/clone`, {
    method: 'POST',
    headers: { 'X-Tenant-ID': tenantId },
    body: formData,
  });
  if (!res.ok) throw new Error('Error al clonar voz');
  return await res.json();
}

export async function fetchTenants(): Promise<Tenant[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/tenants`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Error al listar inquilinos');
    return await res.json();
  } catch {
    return [
      {
        id: 'tenant-emisario-demo',
        slug: 'e-misario',
        name: 'E-MIS@RIO SAS Principal',
        status: 'active',
        settings_json: { quota_tts_chars: 1000000, quota_asr_minutes: 2000 },
        created_at: '2026-10-20T12:00:00Z',
      },
    ];
  }
}

export async function fetchIntegrations(tenantId: string): Promise<Integration[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/tenants/${tenantId}/integrations`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Error al listar integraciones');
    return await res.json();
  } catch {
    return [];
  }
}

export async function saveIntegration(
  tenantId: string,
  kind: string,
  config: Record<string, any>
): Promise<Integration> {
  const res = await fetch(`${API_BASE_URL}/tenants/${tenantId}/integrations/${kind}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Error al guardar integración');
  return await res.json();
}

export async function testIntegration(
  tenantId: string,
  kind: string,
  config: Record<string, any>
): Promise<{ success: boolean; message: string }> {
  const res = await fetch(`${API_BASE_URL}/tenants/${tenantId}/integrations/${kind}/test`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(config),
  });
  if (!res.ok) throw new Error('Error al probar integración');
  return await res.json();
}

export async function fetchMeetings(tenantId: string): Promise<Meeting[]> {
  try {
    const res = await fetch(`${API_BASE_URL}/meetings`, {
      headers: { 'X-Tenant-ID': tenantId },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Error al listar reuniones');
    return await res.json();
  } catch {
    return [];
  }
}

export async function createMeeting(
  tenantId: string,
  title: string,
  sourceLang: string = 'es',
  targetLang: string = 'en'
): Promise<Meeting> {
  const res = await fetch(`${API_BASE_URL}/meetings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Tenant-ID': tenantId,
    },
    body: JSON.stringify({
      title,
      source_language: sourceLang,
      target_language: targetLang,
    }),
  });
  if (!res.ok) throw new Error('Error al crear reunión');
  return await res.json();
}

import { HomeCMSConfig } from '@/types';

export const DEFAULT_HOME_CMS: HomeCMSConfig = {
  hero: {
    badge_text: 'VoiceStudio Multi-Tenant Engine | Precios Adaptativos',
    title_main: 'Voz con IA Ultra-Realista y',
    title_highlight: 'Clonación Instantánea',
    description: 'Plataforma SaaS multi-tenant empresarial para E-MIS@RIO SAS. Genera locuciones profesionales, clona voces exclusivas para tu marca y realiza reuniones bilingües en vivo con traducción instantánea.',
    cta_primary_text: 'Abrir Estudio de Voz',
    cta_secondary_text: 'Consola Superadmin',
  },
  demo: {
    title: 'Prueba el Motor de Síntesis en Vivo',
    subtitle: 'Escribe cualquier frase y escucha la síntesis neuronal generada en tiempo real.',
    default_text: 'Bienvenido a E-MIS@RIO SAS. Experimenta el futuro de la voz sintética y la clonación de alta fidelidad con inteligencia artificial.',
  },
  features: {
    header_title: 'Diseñado para Operaciones de Voz Críticas',
    header_subtitle: 'Arquitectura multi-tenant con aislamiento de datos, soporte de WhatsApp, Telegram y pasarelas globales.',
    cards: [
      {
        title: 'Clonación de Voz Zero-Shot',
        description: 'Carga solo 10 a 30 segundos de muestra y VoiceStudio extrae el timbre y tono exacto para narraciones automatizadas y llamadas con la voz de tu marca.',
        icon: 'mic',
      },
      {
        title: 'Reuniones Bilingües en Vivo',
        description: 'Salas de videoconferencia o audio con transcripción y traducción simultánea (Español / Inglés) reproduciendo la voz sintetizada al instante.',
        icon: 'globe',
      },
      {
        title: 'Multi-Tenant Estricto',
        description: 'Cada cliente cuenta con su subdominio propio, cuotas de caracteres, claves de IA privadas y canales de mensajería (WhatsApp Cloud y Telegram Bot).',
        icon: 'building',
      },
    ],
  },
  pricing_header: {
    badge: 'Geolocalización Adaptativa',
    title: 'Precios Transparentes en Moneda Local',
    subtitle: 'Detectado automáticamente por geolocalización IP. Calculados desde USD con redondeo psicológico sin decimales arbitrarios.',
  },
};

export async function fetchHomeCMS(): Promise<HomeCMSConfig> {
  try {
    const res = await fetch(`${API_BASE_URL}/cms/home`, { cache: 'no-store' });
    if (!res.ok) throw new Error('Error al obtener CMS');
    return await res.json();
  } catch {
    return DEFAULT_HOME_CMS;
  }
}

export async function updateHomeCMS(payload: HomeCMSConfig): Promise<HomeCMSConfig> {
  const res = await fetch(`${API_BASE_URL}/cms/home`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error('Error al actualizar CMS');
  return await res.json();
}
