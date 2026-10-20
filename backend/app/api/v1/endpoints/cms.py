"""
Endpoints para el CMS de la página Home (Superadmin).
Permite gestionar dinámicamente títulos, descripciones, llamadas a la acción, demos y características.
"""
from fastapi import APIRouter, Depends, Body
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.models.cms import CMSHomeConfig
from app.schemas.cms import (
    FullHomeCMSResponse,
    HeroSectionCMS,
    DemoSectionCMS,
    FeaturesSectionCMS,
    PricingHeaderCMS
)

router = APIRouter()


@router.get("/home", response_model=FullHomeCMSResponse, summary="Obtener configuración CMS del Home")
async def get_home_cms_config(db: AsyncSession = Depends(get_db)):
    """Retorna los textos y configuraciones administrables de la página principal."""
    stmt = select(CMSHomeConfig)
    result = await db.execute(stmt)
    records = result.scalars().all()

    sections_map = {r.section_key: r.content_json for r in records}

    hero = HeroSectionCMS(**sections_map.get("hero", {})) if "hero" in sections_map else HeroSectionCMS()
    demo = DemoSectionCMS(**sections_map.get("demo", {})) if "demo" in sections_map else DemoSectionCMS()
    features = FeaturesSectionCMS(**sections_map.get("features", {})) if "features" in sections_map else FeaturesSectionCMS()
    pricing_header = PricingHeaderCMS(**sections_map.get("pricing_header", {})) if "pricing_header" in sections_map else PricingHeaderCMS()

    return FullHomeCMSResponse(
        hero=hero,
        demo=demo,
        features=features,
        pricing_header=pricing_header
    )


@router.put("/home", response_model=FullHomeCMSResponse, summary="Actualizar contenido CMS del Home (Superadmin)")
async def update_home_cms_config(
    payload: FullHomeCMSResponse = Body(...),
    db: AsyncSession = Depends(get_db)
):
    """Permite al Superadmin editar y actualizar en vivo todas las secciones del Home."""
    sections_to_save = {
        "hero": payload.hero.model_dump(),
        "demo": payload.demo.model_dump(),
        "features": payload.features.model_dump(),
        "pricing_header": payload.pricing_header.model_dump()
    }

    for key, data in sections_to_save.items():
        stmt = select(CMSHomeConfig).where(CMSHomeConfig.section_key == key)
        res = await db.execute(stmt)
        record = res.scalar_one_or_none()

        if not record:
            record = CMSHomeConfig(section_key=key, content_json=data)
            db.add(record)
        else:
            record.content_json = data

    await db.commit()
    return payload
