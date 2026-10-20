"""
Motor de Precios Dinámicos por País y Reglas de Redondeo Adaptativas.
Calcula precios en moneda local a partir de un valor base en USD,
aplicando margen comercial y redondeo psicológico según el país y divisa.
"""
from typing import Dict, Any, List, Optional
import math
from decimal import Decimal, ROUND_HALF_UP


class PricingEngine:
    """Motor de cálculo y formateo de precios adaptativos por país."""

    # Configuración por defecto de países admitidos
    DEFAULT_COUNTRIES = [
        {
            "country_code": "CO",
            "country_name": "Colombia",
            "currency": "COP",
            "usd_base_price": 29.00,
            "exchange_rate": 4100.0,
            "margin_pct": 15.0,
            "rounding_rule": "thousands",
            "plan_tier": "pro"
        },
        {
            "country_code": "MX",
            "country_name": "México",
            "currency": "MXN",
            "usd_base_price": 29.00,
            "exchange_rate": 18.5,
            "margin_pct": 15.0,
            "rounding_rule": "tens",
            "plan_tier": "pro"
        },
        {
            "country_code": "US",
            "country_name": "Estados Unidos",
            "currency": "USD",
            "usd_base_price": 29.00,
            "exchange_rate": 1.0,
            "margin_pct": 0.0,
            "rounding_rule": "cents",
            "plan_tier": "pro"
        },
        {
            "country_code": "CA",
            "country_name": "Canadá",
            "currency": "CAD",
            "usd_base_price": 29.00,
            "exchange_rate": 1.36,
            "margin_pct": 10.0,
            "rounding_rule": "cents",
            "plan_tier": "pro"
        },
        {
            "country_code": "AR",
            "country_name": "Argentina",
            "currency": "ARS",
            "usd_base_price": 29.00,
            "exchange_rate": 1150.0,
            "margin_pct": 20.0,
            "rounding_rule": "thousands",
            "plan_tier": "pro"
        },
        {
            "country_code": "ES",
            "country_name": "España / Europa",
            "currency": "EUR",
            "usd_base_price": 29.00,
            "exchange_rate": 0.92,
            "margin_pct": 10.0,
            "rounding_rule": "cents",
            "plan_tier": "pro"
        }
    ]

    @staticmethod
    def calculate_price(
        usd_base_price: float,
        exchange_rate: float,
        margin_pct: float = 0.0,
        rounding_rule: str = "none"
    ) -> float:
        """
        Calcula el precio local aplicando margen y regla de redondeo.
        
        Reglas de redondeo:
        - 'thousands': Redondea al múltiplo más cercano de 1.000 (ej. Colombia COP: 136.735 -> 137.000 o 119.000)
        - 'tens': Redondea al múltiplo más cercano de 10 (ej. México MXN: 616.9 -> 620 o 590)
        - 'cents': Redondea a 2 decimales terminado en .99 (ej. USD/CAD: 39.44 -> 39.99)
        - 'none': Redondeo estándar a 2 decimales.
        """
        if usd_base_price <= 0:
            return 0.0
        
        # Aplicar tasa de cambio y margen
        multiplier = 1.0 + (margin_pct / 100.0)
        raw_price = usd_base_price * exchange_rate * multiplier

        if rounding_rule == "thousands":
            # Redondeo al millar más cercano (ej. COP)
            rounded = round(raw_price / 1000.0) * 1000.0
            # Si el valor base termina en 9.000, suele ser más atractivo comercialmente (ej. 119.000 o 139.000)
            return float(rounded)
        elif rounding_rule == "tens":
            # Redondeo a la decena más cercana (ej. MXN)
            rounded = round(raw_price / 10.0) * 10.0
            return float(rounded)
        elif rounding_rule == "cents":
            # Ajuste psicológico a .99
            integer_part = math.floor(raw_price)
            return float(integer_part) + 0.99
        else:
            # Redondeo bancario a 2 decimales
            return round(raw_price, 2)

    @staticmethod
    def format_price(amount: float, currency: str) -> str:
        """Formatea el precio con su símbolo monetario y separadores legibles."""
        if currency == "COP":
            return f"${int(amount):,} COP".replace(",", ".")
        elif currency == "MXN":
            return f"${int(amount):,} MXN".replace(",", ".")
        elif currency == "ARS":
            return f"${int(amount):,} ARS".replace(",", ".")
        elif currency == "USD":
            return f"${amount:.2f} USD"
        elif currency == "CAD":
            return f"${amount:.2f} CAD"
        elif currency == "EUR":
            return f"€{amount:.2f} EUR"
        else:
            return f"{amount:,.2f} {currency}"

    @classmethod
    def get_country_config(cls, country_code: Optional[str]) -> Dict[str, Any]:
        """Obtiene la configuración de precios para un país (por defecto US si no se encuentra)."""
        code = (country_code or "US").upper().strip()
        for c in cls.DEFAULT_COUNTRIES:
            if c["country_code"] == code:
                return dict(c)
        # Fallback a Estados Unidos
        return dict(cls.DEFAULT_COUNTRIES[2])


pricing_engine = PricingEngine()
