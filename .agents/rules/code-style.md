# Reglas de Estilo de Código y Arquitectura

1. **Frontend**:
   - TypeScript estricto (`noImplicitAny`, interfaces bien definidas).
   - Componentes funcionales limpios con TailwindCSS.
   - Manejo de estado predecible y validación con Zod en formularios.
2. **Backend**:
   - Python 3.11+ con FastAPI y tipado con Pydantic v2.
   - Arquitectura limpia: Routers -> Services -> Repositories / Adapters.
   - Documentación y comentarios en español concisos para lógica compleja.
3. **Tests**:
   - Cada nueva función o endpoint debe incluir su test unitario compatible con `pytest`.
   - Tests organizados bajo `backend/tests/`.
