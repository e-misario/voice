"""
Endpoints para la consulta y administración de precios geográficos y monedas locales.
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, Request, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.pricing import CountryPricing
from app.schemas.pricing import (
    CountryPricingResponse,
    CountryPricingUpdate,
    CountryPricingCreate,
    GeoPricingResponse
)
from app.services.pricing_engine import pricing_engine

router = APIRouter()


@router.get("/geo", response_model=GeoPricingResponse, summary="Obtener precios adaptados por país")
async def get_geo_pricing(
    request: Request,
    country: Optional[str] = Query(None, description="Código de país ISO 2 (ej. CO, MX, US, CA)"),
    db: AsyncSession = Depends(get_db)
):
    """
    Detecta automáticamente el país vía Cloudflare (CF-IPCountry) o parámetro 'country',
    retornando los precios convertidos y formateados con la regla de redondeo correspondiente.
    """
    # 1. Detectar código de país: parámetro > header CF-IPCountry > US por defecto
    detected_country = country
    if not detected_country:
        detected_country = request.headers.get("CF-IPCountry") or request.headers.get("cf-ipcountry")
    if not detected_country:
        detected_country = "CO"  # Colombia como default de marca E-MIS@RIO SAS

    detected_country = detected_country.upper().strip()

    # 2. Consultar todos los países en DB o cargar de memoria/defaults
    stmt = select(CountryPricing)
    result = await db.execute(stmt)
    db_items = result.scalars().all()

    items_to_use = []
    if db_items:
        for item in db_items:
            items_to_use.append({
                "id": str(item.id),
                "country_code": item.country_code,
                "country_name": item.country_name,
                "currency": item.currency,
                "usd_base_price": float(item.usd_base_price),
                "exchange_rate": float(item.exchange_rate),
                "margin_pct": float(item.margin_pct),
                "calculated_local_price": float(item.calculated_local_price),
                "rounding_rule": item.rounding_rule,
                "plan_tier": item.plan_tier,
                "updated_at": item.updated_at
            })
    else:
        # Usar defaults del motor
        for def_item in pricing_engine.DEFAULT_COUNTRIES:
            calc = pricing_engine.calculate_price(
                def_item["usd_base_price"],
                def_item["exchange_rate"],
                def_item["margin_pct"],
                def_item["rounding_rule"]
            )
            items_to_use.append({
                "id": f"def-{def_item['country_code']}",
                "country_code": def_item["country_code"],
                "country_name": def_item["country_name"],
                "currency": def_item["currency"],
                "usd_base_price": def_item["usd_base_price"],
                "exchange_rate": def_item["exchange_rate"],
                "margin_pct": def_item["margin_pct"],
                "calculated_local_price": calc,
                "rounding_rule": def_item["rounding_rule"],
                "plan_tier": def_item["plan_tier"],
                "updated_at": None
            })

    # Encontrar el país correspondiente
    matched_country = None
    for c in items_to_use:
        if c["country_code"] == detected_country:
            matched_country = c
            break

    # Si no coincide exactamente, buscar US
    if not matched_country:
        for c in items_to_use:
            if c["country_code"] == "US":
                matched_country = c
                break

    if not matched_country:
        matched_country = items_to_use[0]

    all_responses = []
    for item in items_to_use:
        fmt = pricing_engine.format_price(item["calculated_local_price"], item["currency"])
        all_responses.append(CountryPricingResponse(
            id=item["id"],
            country_code=item["country_code"],
            country_name=item["country_name"],
            currency=item["currency"],
            usd_base_price=item["usd_base_price"],
            exchange_rate=item["exchange_rate"],
            margin_pct=item["margin_pct"],
            calculated_local_price=item["calculated_local_price"],
            rounding_rule=item["rounding_rule"],
            plan_tier=item["plan_tier"],
            formatted_price=fmt,
            updated_at=item["updated_at"]
        ))

    current_fmt = pricing_engine.format_price(matched_country["calculated_local_price"], matched_country["currency"])
    
    return GeoPricingResponse(
        detected_country=matched_country["country_code"],
        currency=matched_country["currency"],
        price=matched_country["calculated_local_price"],
        formatted_price=current_fmt,
        usd_equivalent=matched_country["usd_base_price"],
        plan_tier=matched_country["plan_tier"],
        all_plans=all_responses
    )


@router.get("", response_model=List[CountryPricingResponse], summary="Listar precios de todos los países")
async def list_all_country_pricing(db: AsyncSession = Depends(get_db)):
    """Lista completa de la matriz de precios por país."""
    stmt = select(CountryPricing).order_by(CountryPricing.country_code)
    result = await db.execute(stmt)
    db_items = result.scalars().all()

    if not db_items:
        # Retornar defaults calculados
        responses = []
        for d in pricing_engine.DEFAULT_COUNTRIES:
            calc = pricing_engine.calculate_price(
                d["usd_base_price"], d["exchange_rate"], d["margin_pct"], d["rounding_rule"]
            )
            fmt = pricing_engine.format_price(calc, d["currency"])
            responses.append(CountryPricingResponse(
                id=f"default-{d['country_code']}",
                country_code=d["country_code"],
                country_name=d["country_name"],
                currency=d["currency"],
                usd_base_price=d["usd_base_price"],
                exchange_rate=d["exchange_rate"],
                margin_pct=d["margin_pct"],
                calculated_local_price=calc,
                rounding_rule=d["rounding_rule"],
                plan_tier=d["plan_tier"],
                formatted_price=fmt,
                updated_at=None
            ))
        return responses

    output = []
    for item in db_items:
        fmt = pricing_engine.format_price(float(item.calculated_local_price), item.currency)
        output.append(CountryPricingResponse(
            id=str(item.id),
            country_code=item.country_code,
            country_name=item.country_name,
            currency=item.currency,
            usd_base_price=float(item.usd_base_price),
            exchange_rate=float(item.exchange_rate),
            margin_pct=float(item.margin_pct),
            calculated_local_price=float(item.calculated_local_price),
            rounding_rule=item.rounding_rule,
            plan_tier=item.plan_tier,
            formatted_price=fmt,
            updated_at=item.updated_at
        ))
    return output


@router.put("/{country_code}", response_model=CountryPricingResponse, summary="Actualizar precio o margen por país (Superadmin)")
async def update_country_pricing(
    country_code: str,
    payload: CountryPricingUpdate,
    db: AsyncSession = Depends(get_db)
):
    """Permite al Superadmin cambiar el precio base USD, tipo de cambio, margen y regla de redondeo."""
    code = country_code.upper().strip()
    stmt = select(CountryPricing).where(CountryPricing.country_code == code)
    result = await db.execute(stmt)
    pricing_record = result.scalar_one_or_none()

    if not pricing_record:
        # Si no existe en DB, inicializarlo a partir del default
        def_conf = pricing_engine.get_country_config(code)
        pricing_record = CountryPricing(
            country_code=code,
            country_name=def_conf["country_name"],
            currency=def_conf["currency"],
            usd_base_price=def_conf["usd_base_price"],
            exchange_rate=def_conf["exchange_rate"],
            margin_pct=def_conf["margin_pct"],
            rounding_rule=def_conf["rounding_rule"],
            plan_tier=def_conf["plan_tier"],
            calculated_local_price=def_conf["usd_base_price"]
        )
        db.add(pricing_record)

    # Actualizar campos proporcionados
    if payload.usd_base_price is not None:
        pricing_record.usd_base_price = payload.usd_base_price
    if payload.exchange_rate is not None:
        pricing_record.exchange_rate = payload.exchange_rate
    if payload.margin_pct is not None:
        pricing_record.margin_pct = payload.margin_pct
    if payload.rounding_rule is not None:
        pricing_record.rounding_rule = payload.rounding_rule
    if payload.plan_tier is not None:
        pricing_record.plan_tier = payload.plan_tier

    # Recalcular precio local
    new_local_price = pricing_engine.calculate_price(
        usd_base_price=float(pricing_record.usd_base_price),
        exchange_rate=float(pricing_record.exchange_rate),
        margin_pct=float(pricing_record.margin_pct),
        rounding_rule=pricing_record.rounding_rule
    )
    pricing_record.calculated_local_price = new_local_price

    await db.commit()
    await db.refresh(pricing_record)

    fmt = pricing_engine.format_price(float(pricing_record.calculated_local_price), pricing_record.currency)
    return CountryPricingResponse(
        id=str(pricing_record.id),
        country_code=pricing_record.country_code,
        country_name=pricing_record.country_name,
        currency=pricing_record.currency,
        usd_base_price=float(pricing_record.usd_base_price),
        exchange_rate=float(pricing_record.exchange_rate),
        margin_pct=float(pricing_record.margin_pct),
        calculated_local_price=float(pricing_record.calculated_local_price),
        rounding_rule=pricing_record.rounding_rule,
        plan_tier=pricing_record.plan_tier,
        formatted_price=fmt,
        updated_at=pricing_record.updated_at
    )


@router.post("", response_model=CountryPricingResponse, summary="Crear nuevo país y tarifa (Superadmin)")
async def create_country_pricing(payload: CountryPricingCreate, db: AsyncSession = Depends(get_db)):
    """Permite al Superadmin registrar una nueva tarifa y moneda para un país."""
    code = payload.country_code.upper().strip()
    stmt = select(CountryPricing).where(CountryPricing.country_code == code)
    res = await db.execute(stmt)
    if res.scalar_one_or_none():
        raise HTTPException(status_code=400, detail=f"El país con código '{code}' ya existe.")

    local_price = pricing_engine.calculate_price(
        payload.usd_base_price, payload.exchange_rate, payload.margin_pct, payload.rounding_rule
    )

    new_country = CountryPricing(
        country_code=code,
        country_name=payload.country_name,
        currency=payload.currency.upper().strip(),
        usd_base_price=payload.usd_base_price,
        exchange_rate=payload.exchange_rate,
        margin_pct=payload.margin_pct,
        calculated_local_price=local_price,
        rounding_rule=payload.rounding_rule,
        plan_tier=payload.plan_tier
    )
    db.add(new_country)
    await db.commit()
    await db.refresh(new_country)

    fmt = pricing_engine.format_price(float(new_country.calculated_local_price), new_country.currency)
    return CountryPricingResponse(
        id=str(new_country.id),
        country_code=new_country.country_code,
        country_name=new_country.country_name,
        currency=new_country.currency,
        usd_base_price=float(new_country.usd_base_price),
        exchange_rate=float(new_country.exchange_rate),
        margin_pct=float(new_country.margin_pct),
        calculated_local_price=float(new_country.calculated_local_price),
        rounding_rule=new_country.rounding_rule,
        plan_tier=new_country.plan_tier,
        formatted_price=fmt,
        updated_at=new_country.updated_at
    )


@router.delete("/{country_code}", summary="Eliminar país de la matriz de precios (Superadmin)")
async def delete_country_pricing(country_code: str, db: AsyncSession = Depends(get_db)):
    """Elimina una regla de precio por país de la base de datos."""
    code = country_code.upper().strip()
    stmt = select(CountryPricing).where(CountryPricing.country_code == code)
    res = await db.execute(stmt)
    record = res.scalar_one_or_none()
    if not record:
        raise HTTPException(status_code=404, detail="País no encontrado en la matriz de precios.")

    await db.delete(record)
    await db.commit()
    return {"success": True, "message": f"País '{code}' eliminado de la matriz de precios."}
