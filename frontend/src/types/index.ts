/**
 * Tipos estrictos en TypeScript para el SaaS de Voz con IA de E-MIS@RIO SAS.
 */

export type RoundingRule = 'thousands' | 'tens' | 'cents' | 'none';
export type PlanTier = 'starter' | 'pro' | 'enterprise';

export interface CountryPricing {
  id: string;
  country_code: string;
  country_name: string;
  currency: string;
  usd_base_price: number;
  exchange_rate: number;
  margin_pct: number;
  calculated_local_price: number;
  rounding_rule: RoundingRule;
  plan_tier: string;
  formatted_price: string;
  updated_at?: string;
}

export interface GeoPricingResponse {
  detected_country: string;
  currency: string;
  price: number;
  formatted_price: string;
  usd_equivalent: number;
  plan_tier: string;
  all_plans: CountryPricing[];
}

export interface Voice {
  id: string;
  tenant_id: string;
  name: string;
  voice_type: 'cloned' | 'preset' | 'system';
  language: string;
  gender: string;
  sample_audio_path?: string;
  description?: string;
  is_default: boolean;
  created_at?: string;
}

export interface TTSRequest {
  text: string;
  voice_id?: string;
  language?: string;
  speed?: number;
  emotion?: string;
  output_format?: string;
}

export interface TTSResponse {
  audio_base64: string;
  format: string;
  duration_seconds: number;
  characters_processed: number;
  voice_name: string;
  engine?: string;
}

export interface ASRResponse {
  transcription: string;
  language_detected: string;
  duration_seconds: number;
  confidence: number;
}

export interface Tenant {
  id: string;
  slug: string;
  name: string;
  custom_domain?: string;
  status: 'active' | 'suspended' | 'trial';
  settings_json: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export type IntegrationKind = 'ai' | 'whatsapp' | 'telegram' | 'smtp' | 'stripe' | 'mercadopago' | 'wompi';

export interface Integration {
  id: string;
  tenant_id: string;
  kind: IntegrationKind;
  masked_config: Record<string, any>;
  is_enabled: boolean;
  status: 'connected' | 'error' | 'unconfigured';
  last_tested_at?: string;
  last_error_message?: string;
}

export interface MeetingTranscriptEntry {
  speaker: string;
  original_text: string;
  translated_text: string;
  timestamp: number;
  source_lang: string;
  target_lang: string;
}

export interface Meeting {
  id: string;
  tenant_id: string;
  title: string;
  source_language: string;
  target_language: string;
  status: 'scheduled' | 'live' | 'completed';
  transcript_log: MeetingTranscriptEntry[];
  summary?: string;
  created_at: string;
  updated_at?: string;
}

export interface User {
  id: string;
  tenant_id?: string;
  email: string;
  full_name: string;
  role: 'superadmin' | 'tenant_admin' | 'operator';
  is_active: boolean;
}

export interface HeroSectionCMS {
  badge_text: string;
  title_main: string;
  title_highlight: string;
  description: string;
  cta_primary_text: string;
  cta_secondary_text: string;
}

export interface DemoSectionCMS {
  title: string;
  subtitle: string;
  default_text: string;
}

export interface FeatureCardCMS {
  title: string;
  description: string;
  icon: string;
}

export interface FeaturesSectionCMS {
  header_title: string;
  header_subtitle: string;
  cards: FeatureCardCMS[];
}

export interface PricingHeaderCMS {
  badge: string;
  title: string;
  subtitle: string;
}

export interface HomeCMSConfig {
  hero: HeroSectionCMS;
  demo: DemoSectionCMS;
  features: FeaturesSectionCMS;
  pricing_header: PricingHeaderCMS;
}
