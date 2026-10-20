"""
Esquemas Pydantic para el CMS de la página Home.
"""
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, ConfigDict


class HeroSectionCMS(BaseModel):
    badge_text: str = "VoiceStudio Multi-Tenant Engine | Precios Adaptativos"
    title_main: str = "Voz con IA Ultra-Realista y"
    title_highlight: str = "Clonación Instantánea"
    description: str = "Plataforma SaaS multi-tenant empresarial para E-MIS@RIO SAS. Genera locuciones profesionales, clona voces exclusivas para tu marca y realiza reuniones bilingües en vivo con traducción instantánea."
    cta_primary_text: str = "Abrir Estudio de Voz"
    cta_secondary_text: str = "Consola Superadmin"


class DemoSectionCMS(BaseModel):
    title: str = "Prueba el Motor de Síntesis en Vivo"
    subtitle: str = "Escribe cualquier frase y escucha la síntesis neuronal generada en tiempo real."
    default_text: str = "Bienvenido a E-MIS@RIO SAS. Experimenta el futuro de la voz sintética y la clonación de alta fidelidad con inteligencia artificial."


class FeatureCardCMS(BaseModel):
    title: str
    description: str
    icon: str = "mic"


class FeaturesSectionCMS(BaseModel):
    header_title: str = "Diseñado para Operaciones de Voz Críticas"
    header_subtitle: str = "Arquitectura multi-tenant con aislamiento de datos, soporte de WhatsApp, Telegram y pasarelas globales."
    cards: List[FeatureCardCMS] = [
        FeatureCardCMS(
            title="Clonación de Voz Zero-Shot",
            description="Carga solo 10 a 30 segundos de muestra y VoiceStudio extrae el timbre y tono exacto para narraciones automatizadas.",
            icon="mic"
        ),
        FeatureCardCMS(
            title="Reuniones Bilingües en Vivo",
            description="Salas de videoconferencia o audio con transcripción y traducción simultánea (Español / Inglés).",
            icon="globe"
        ),
        FeatureCardCMS(
            title="Multi-Tenant Estricto",
            description="Cada cliente cuenta con su subdominio propio, cuotas de caracteres, claves de IA privadas y canales de mensajería.",
            icon="building"
        ),
    ]


class PricingHeaderCMS(BaseModel):
    badge: str = "Geolocalización Adaptativa"
    title: str = "Precios Transparentes en Moneda Local"
    subtitle: str = "Detectado automáticamente por geolocalización IP. Calculados desde USD con redondeo psicológico sin decimales arbitrarios."


class FullHomeCMSResponse(BaseModel):
    hero: HeroSectionCMS
    demo: DemoSectionCMS
    features: FeaturesSectionCMS
    pricing_header: PricingHeaderCMS

    model_config = ConfigDict(from_attributes=True)
