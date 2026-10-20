# Skill: VoiceStudio Engine & Adapter

## Descripción
VoiceStudio (`debpalash/VoiceStudio`) es una plataforma de IA de voz local y self-hosted que provee capacidades avanzadas de:
- Clonación de voz de alta fidelidad (zero-shot y fine-tuned).
- Generación de Text-to-Speech (TTS) con control de emociones y velocidad.
- Automatic Speech Recognition (ASR) para transcripción y alineación de audio.

## Modos de Operación y Exposición
1. **Microservicio REST / OpenAI Compatible**: Expone `/v1/audio/speech` y `/v1/audio/transcriptions`.
2. **Streaming SSE / WebSockets**: Para síntesis de baja latencia en llamadas y streaming bilingüe.
3. **Worker / Job Queue (Celery/Redis)**: Para clonación profunda y procesamiento asíncrono de audio pesado.
4. **Adapter MCP**: Para interacción directa de agentes de IA con el catálogo de voces.

## Contrato de API del Wrapper (FastAPI)
- `POST /api/v1/voice/clone`: Recibe muestra de audio (wav/mp3/ogg), genera embedding de voz y registra `voice_id` asociado al tenant.
- `POST /api/v1/voice/tts`: Sintetiza texto en habla utilizando la voz clonada o voces predefinidas del tenant.
- `POST /api/v1/voice/asr`: Transcribe audio a texto con marcas de tiempo (timestamps) y detección de idioma.
- `GET /api/v1/voice/voices`: Lista las voces disponibles y clonadas para el inquilino activo.

## Resiliencia y Fallback
- Si el contenedor GPU de VoiceStudio está ocupado o inicializándose, el wrapper provee simulación determinista o fallback a modelos CPU ligeros o TTS cloud configurado (OpenAI/ElevenLabs) según directiva del tenant.
