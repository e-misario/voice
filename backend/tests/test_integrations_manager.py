"""
Pruebas unitarias para el gestor de integraciones, cifrado y enmascaramiento seguro.
"""
import pytest
from app.services.integrations_manager import integrations_manager


def test_encryption_and_decryption_cycle():
    """Verifica que un payload se cifre y se descifre de forma idéntica sin pérdidas."""
    original_config = {
        "api_key": "sk-proj-super-secret-key-12345678",
        "model": "gpt-4o",
        "temperature": 0.7
    }

    encrypted_str = integrations_manager.encrypt_payload(original_config)
    assert encrypted_str != ""
    assert "sk-proj" not in encrypted_str  # Asegurar que el secreto no está en texto plano

    decrypted_config = integrations_manager.decrypt_payload(encrypted_str)
    assert decrypted_config == original_config


def test_masking_sensitive_fields():
    """Verifica que las credenciales sensibles queden enmascaradas mostrando solo los últimos 4 caracteres."""
    config_to_mask = {
        "api_key": "sk-1234567890abcdef",
        "provider": "openai",
        "webhook_secret": "whsec_secure_9999"
    }

    masked = integrations_manager.mask_config(config_to_mask)
    assert masked["api_key"] == "****...cdef"
    assert masked["webhook_secret"] == "****...9999"
    assert masked["provider"] == "openai"


@pytest.mark.asyncio
async def test_integration_test_openai():
    """Verifica la prueba de validación para la integración de IA."""
    success, msg, details = await integrations_manager.test_integration("ai", {
        "provider": "openai",
        "api_key": "sk-test-valid-length-api-key-1234",
        "model": "gpt-4o-mini"
    })
    assert success is True
    assert "Conexión verificada" in msg


@pytest.mark.asyncio
async def test_integration_test_whatsapp():
    """Verifica la validación de credenciales de WhatsApp Cloud API."""
    # Fallo por falta de credenciales
    success, msg, _ = await integrations_manager.test_integration("whatsapp", {})
    assert success is False

    # Éxito con credenciales completas
    success, msg, _ = await integrations_manager.test_integration("whatsapp", {
        "phone_number_id": "1049284729102",
        "access_token": "EAAXx...token"
    })
    assert success is True


@pytest.mark.asyncio
async def test_integration_test_stripe():
    """Verifica el chequeo de formato para la pasarela Stripe."""
    success, msg, _ = await integrations_manager.test_integration("stripe", {
        "secret_key": "sk_test_51Mz000ValidStripeTestKey"
    })
    assert success is True
