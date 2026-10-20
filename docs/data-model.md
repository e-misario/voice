# Modelo de Datos Multi-Tenant — E-MIS@RIO SAS

## Entidades Principales

### 1. `tenants` (Inquilinos)
- `id`: UUID (Primary Key)
- `slug`: VARCHAR(64) UNIQUE (ej. "e-misario", "empresa-xyz")
- `name`: VARCHAR(255)
- `domain`: VARCHAR(255) NULL
- `status`: ENUM ('active', 'suspended', 'trial')
- `created_at`: TIMESTAMP
- `updated_at`: TIMESTAMP

### 2. `users` (Usuarios y Administradores)
- `id`: UUID (Primary Key)
- `tenant_id`: UUID (Foreign Key a `tenants.id`, NULL para Superadmin global)
- `email`: VARCHAR(255) UNIQUE
- `password_hash`: VARCHAR(255)
- `full_name`: VARCHAR(255)
- `role`: ENUM ('superadmin', 'tenant_admin', 'operator')
- `is_active`: BOOLEAN DEFAULT TRUE
- `created_at`: TIMESTAMP

### 3. `voices` (Voces Propias y Clonadas)
- `id`: UUID (Primary Key)
- `tenant_id`: UUID (Foreign Key a `tenants.id`)
- `name`: VARCHAR(128)
- `voice_type`: ENUM ('cloned', 'preset', 'custom')
- `sample_audio_url`: VARCHAR(512) NULL
- `embedding_data`: JSONB NULL
- `language`: VARCHAR(10) DEFAULT 'es'
- `is_default`: BOOLEAN DEFAULT FALSE
- `created_at`: TIMESTAMP

### 4. `country_pricing` & `pricing_rules` (Precios Adaptativos por País)
- `id`: UUID (Primary Key)
- `country_code`: CHAR(2) UNIQUE (ej. 'CO', 'MX', 'US', 'CA', 'AR')
- `currency`: CHAR(3) (ej. 'COP', 'MXN', 'USD', 'CAD')
- `usd_base_price`: NUMERIC(10,2)
- `exchange_rate`: NUMERIC(14,4)
- `margin_pct`: NUMERIC(5,2) DEFAULT 0.0
- `calculated_local_price`: NUMERIC(14,2)
- `rounding_rule`: ENUM ('thousands', 'tens', 'cents', 'none')
- `plan_tier`: ENUM ('starter', 'pro', 'enterprise')
- `updated_at`: TIMESTAMP

### 5. `integrations` (Configuraciones de Terceros por Inquilino)
- `id`: UUID (Primary Key)
- `tenant_id`: UUID (Foreign Key a `tenants.id`)
- `kind`: ENUM ('ai', 'whatsapp', 'telegram', 'smtp', 'stripe', 'mercadopago', 'wompi')
- `config_payload`: TEXT (JSON Cifrado AES-256)
- `is_enabled`: BOOLEAN DEFAULT TRUE
- `last_tested_at`: TIMESTAMP NULL
- `status`: ENUM ('connected', 'error', 'unconfigured')

### 6. `meetings` (Reuniones Bilingües y Transcripción)
- `id`: UUID (Primary Key)
- `tenant_id`: UUID (Foreign Key a `tenants.id`)
- `title`: VARCHAR(255)
- `source_language`: VARCHAR(10) DEFAULT 'es'
- `target_language`: VARCHAR(10) DEFAULT 'en'
- `status`: ENUM ('scheduled', 'live', 'completed')
- `transcript_log`: JSONB DEFAULT '[]'::jsonb
- `created_at`: TIMESTAMP

### 7. `subscriptions` (Planes y Facturación de Inquilinos)
- `id`: UUID (Primary Key)
- `tenant_id`: UUID (Foreign Key a `tenants.id`)
- `plan_id`: VARCHAR(64)
- `country_code`: CHAR(2)
- `currency`: CHAR(3)
- `amount`: NUMERIC(14,2)
- `status`: ENUM ('active', 'past_due', 'canceled')
- `current_period_end`: TIMESTAMP
