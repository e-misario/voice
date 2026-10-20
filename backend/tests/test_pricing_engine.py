"""
Pruebas unitarias para el motor de precios dinámicos y reglas de redondeo por país.
"""
import pytest
from app.services.pricing_engine import PricingEngine, pricing_engine


def test_pricing_calculation_colombia():
    """Verifica que el cálculo para Colombia (COP) aplique margen y redondeo a millares."""
    usd_base = 29.0
    exchange_rate = 4100.0  # 29 * 4100 = 118,900
    margin_pct = 15.0       # 118,900 * 1.15 = 136,735

    price = PricingEngine.calculate_price(
        usd_base_price=usd_base,
        exchange_rate=exchange_rate,
        margin_pct=margin_pct,
        rounding_rule="thousands"
    )

    # 136,735 redondeado a millares es 137,000
    assert price == 137000.0
    assert price % 1000 == 0


def test_pricing_calculation_mexico():
    """Verifica que el cálculo para México (MXN) redondee al múltiplo de 10 más cercano."""
    usd_base = 29.0
    exchange_rate = 18.5    # 29 * 18.5 = 536.5
    margin_pct = 15.0       # 536.5 * 1.15 = 616.975

    price = PricingEngine.calculate_price(
        usd_base_price=usd_base,
        exchange_rate=exchange_rate,
        margin_pct=margin_pct,
        rounding_rule="tens"
    )

    # 616.975 redondeado a decenas es 620
    assert price == 620.0
    assert price % 10 == 0


def test_pricing_calculation_usa_cents():
    """Verifica que para Estados Unidos (USD) se aplique el redondeo psicológico .99."""
    usd_base = 29.0
    exchange_rate = 1.0
    margin_pct = 0.0

    price = PricingEngine.calculate_price(
        usd_base_price=usd_base,
        exchange_rate=exchange_rate,
        margin_pct=margin_pct,
        rounding_rule="cents"
    )

    assert price == 29.99


def test_format_currency_output():
    """Verifica el formateo estético y legibilidad de las monedas locales."""
    formatted_cop = PricingEngine.format_price(119000.0, "COP")
    assert "$119.000 COP" in formatted_cop

    formatted_usd = PricingEngine.format_price(29.99, "USD")
    assert "$29.99 USD" in formatted_usd


def test_fallback_country_lookup():
    """Verifica que si un país desconocido consulta precios, el fallback sea Estados Unidos."""
    config = pricing_engine.get_country_config("XX")
    assert config["country_code"] == "US"
    assert config["currency"] == "USD"
