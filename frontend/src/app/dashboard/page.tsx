'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Mic,
  Cpu,
  Volume2,
  Upload,
  MessageSquare,
  Play,
  Pause,
  Save,
  CheckCircle,
  AlertCircle,
  Plus,
  Radio,
  Sliders,
  Send,
  Sparkles,
  Mail,
  CreditCard,
  Building,
  Key,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import {
  fetchVoices,
  synthesizeTTS,
  cloneVoice,
  fetchIntegrations,
  saveIntegration,
  testIntegration,
  fetchMeetings,
  createMeeting,
} from '@/lib/api';
import { Voice, Integration, Meeting } from '@/types';

export default function TenantDashboard() {
  const [activeTab, setActiveTab] = useState<'tts' | 'clone' | 'ai' | 'meetings' | 'integrations'>('tts');
  const [tenantId, setTenantId] = useState<string>('tenant-emisario-demo');
  const [voices, setVoices] = useState<Voice[]>([]);
  const [selectedVoice, setSelectedVoice] = useState<string>('preset-valeria-es');

  // Estado de TTS
  const [ttsText, setTtsText] = useState<string>(
    'Estimado cliente, su pedido ha sido confirmado por E-MIS@RIO SAS y se encuentra en camino.'
  );
  const [speed, setSpeed] = useState<number>(1.0);
  const [emotion, setEmotion] = useState<string>('neutral');
  const [generatingTTS, setGeneratingTTS] = useState<boolean>(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);

  // Estado de Clonación
  const [cloneName, setCloneName] = useState<string>('');
  const [cloneFile, setCloneFile] = useState<File | null>(null);
  const [cloningVoice, setCloningVoice] = useState<boolean>(false);
  const [cloneMessage, setCloneMessage] = useState<string | null>(null);

  // Estado de Integraciones
  const [aiProvider, setAiProvider] = useState<string>('openai');
  const [aiKey, setAiKey] = useState<string>('');
  const [aiModel, setAiModel] = useState<string>('gpt-4o-mini');
  const [aiPrompt, setAiPrompt] = useState<string>('Eres el asistente virtual corporativo de E-MIS@RIO SAS.');

  const [whatsappPhoneId, setWhatsappPhoneId] = useState<string>('');
  const [whatsappToken, setWhatsappToken] = useState<string>('');

  const [telegramToken, setTelegramToken] = useState<string>('');

  const [smtpHost, setSmtpHost] = useState<string>('smtp.e-misario.com');
  const [smtpPort, setSmtpPort] = useState<number>(587);
  const [smtpUser, setSmtpUser] = useState<string>('');
  const [smtpPass, setSmtpPass] = useState<string>('');

  const [paymentGateway, setPaymentGateway] = useState<'wompi' | 'stripe' | 'mercadopago'>('wompi');
  const [gatewayKey1, setGatewayKey1] = useState<string>('');
  const [gatewayKey2, setGatewayKey2] = useState<string>('');

  const [integrationStatusMsg, setIntegrationStatusMsg] = useState<{ [key: string]: string }>({});

  // Estado de Reuniones
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [newMeetingTitle, setNewMeetingTitle] = useState<string>('');

  // Cargar datos del inquilino
  const loadTenantData = async () => {
    try {
      const v = await fetchVoices(tenantId);
      setVoices(v);
      const m = await fetchMeetings(tenantId);
      setMeetings(m);

      const existingIntegrations = await fetchIntegrations(tenantId);
      existingIntegrations.forEach((it) => {
        if (it.kind === 'ai') {
          setAiProvider(it.masked_config.provider || 'openai');
          setAiKey(it.masked_config.api_key || '');
          setAiModel(it.masked_config.model || 'gpt-4o-mini');
          setAiPrompt(it.masked_config.system_prompt || '');
        } else if (it.kind === 'whatsapp') {
          setWhatsappPhoneId(it.masked_config.phone_number_id || '');
          setWhatsappToken(it.masked_config.access_token || '');
        } else if (it.kind === 'telegram') {
          setTelegramToken(it.masked_config.bot_token || '');
        }
      });
    } catch (err) {
      console.error('Error cargando datos del tenant:', err);
    }
  };

  useEffect(() => {
    loadTenantData();
  }, [tenantId]);

  // Manejar Síntesis TTS
  const handleSynthesize = async () => {
    if (audioUrl && isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }
    setGeneratingTTS(true);
    try {
      const res = await synthesizeTTS({
        text: ttsText,
        voice_id: selectedVoice,
        speed: speed,
        emotion: emotion,
      });
      const url = `data:audio/${res.format};base64,${res.audio_base64}`;
      setAudioUrl(url);

      const audio = new Audio(url);
      setAudioElement(audio);
      audio.onended = () => setIsPlaying(false);
      audio.play();
      setIsPlaying(true);
    } catch (err) {
      console.error('Error al sintetizar voz:', err);
    } finally {
      setGeneratingTTS(false);
    }
  };

  // Manejar Clonación de Voz
  const handleCloneVoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cloneName || !cloneFile) return;
    setCloningVoice(true);
    setCloneMessage(null);

    const formData = new FormData();
    formData.append('name', cloneName);
    formData.append('language', 'es');
    formData.append('audio_file', cloneFile);

    try {
      const newVoice = await cloneVoice(formData, tenantId);
      setCloneMessage(`¡Voz '${newVoice.name}' clonada y registrada exitosamente!`);
      setCloneName('');
      setCloneFile(null);
      loadTenantData();
    } catch (err) {
      console.error('Error clonando voz:', err);
      setCloneMessage('Error en el proceso de clonación con VoiceStudio.');
    } finally {
      setCloningVoice(false);
    }
  };

  // Probar y Guardar Integración
  const handleTestAndSave = async (kind: string, config: Record<string, any>) => {
    setIntegrationStatusMsg((prev) => ({ ...prev, [kind]: 'Probando conexión...' }));
    try {
      const testRes = await testIntegration(tenantId, kind, config);
      if (testRes.success) {
        await saveIntegration(tenantId, kind, config);
        setIntegrationStatusMsg((prev) => ({
          ...prev,
          [kind]: `✅ Conectado y guardado cifrado: ${testRes.message}`,
        }));
      } else {
        setIntegrationStatusMsg((prev) => ({
          ...prev,
          [kind]: `❌ Falló la prueba: ${testRes.message}`,
        }));
      }
    } catch (err) {
      setIntegrationStatusMsg((prev) => ({
        ...prev,
        [kind]: '❌ Error de comunicación con la API.',
      }));
    }
  };

  // Crear Reunión Bilingüe
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingTitle) return;
    try {
      const m = await createMeeting(tenantId, newMeetingTitle, 'es', 'en');
      setMeetings([m, ...meetings]);
      setNewMeetingTitle('');
    } catch (err) {
      console.error('Error creando reunión:', err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Header del Dashboard */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-8 border-b border-slate-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                <Sparkles className="w-4 h-4" />
              </span>
              <h1 className="text-2xl font-black text-white">Panel de Control del Inquilino</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Inquilino activo: <span className="text-white font-mono font-semibold">e-misario.voice.e-misario.com</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-lg font-mono">
              Cuota: 1.000.000 caracteres
            </span>
          </div>
        </div>

        {/* Pestañas de Navegación */}
        <div className="flex space-x-1 sm:space-x-4 mt-6 border-b border-slate-800 text-xs font-semibold overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('tts')}
            className={`pb-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'tts'
                ? 'border-cyan-400 text-cyan-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" /> Estudio Text-to-Speech
          </button>
          <button
            onClick={() => setActiveTab('clone')}
            className={`pb-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'clone'
                ? 'border-indigo-400 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" /> Clonar Voz Propia
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'ai'
                ? 'border-purple-400 text-purple-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" /> Configuración de IA
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`pb-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'meetings'
                ? 'border-emerald-400 text-emerald-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" /> Reuniones Bilingües
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`pb-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'integrations'
                ? 'border-orange-400 text-orange-400'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Integraciones & Pagos
          </button>
        </div>

        {/* Tab 1: Estudio TTS */}
        {activeTab === 'tts' && (
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Volume2 className="w-4 h-4 text-cyan-400" /> Generador de Audio Neuronal
              </h3>

              <textarea
                value={ttsText}
                onChange={(e) => {
                  setTtsText(e.target.value);
                  setAudioUrl(null);
                }}
                rows={5}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-4 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-400"
                placeholder="Ingresa el texto a sintetizar..."
              />

              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Voz Seleccionada</label>
                  <select
                    value={selectedVoice}
                    onChange={(e) => {
                      setSelectedVoice(e.target.value);
                      setAudioUrl(null);
                    }}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-400"
                  >
                    {voices.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Velocidad ({speed}x)</label>
                  <input
                    type="range"
                    min="0.5"
                    max="1.5"
                    step="0.1"
                    value={speed}
                    onChange={(e) => setSpeed(parseFloat(e.target.value))}
                    className="w-full mt-2 accent-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Emoción</label>
                  <select
                    value={emotion}
                    onChange={(e) => setEmotion(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-400"
                  >
                    <option value="neutral">Neutral</option>
                    <option value="friendly">Amigable</option>
                    <option value="formal">Corporativa</option>
                    <option value="energetic">Enérgica</option>
                  </select>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  onClick={handleSynthesize}
                  disabled={generatingTTS}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white font-semibold text-xs px-6 py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
                >
                  {generatingTTS ? (
                    'Generando...'
                  ) : isPlaying ? (
                    <>
                      <Pause className="w-4 h-4 fill-white" /> Pausar Reproducción
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 fill-white" /> Sintetizar y Reproducir
                    </>
                  )}
                </button>

                {audioUrl && (
                  <a
                    href={audioUrl}
                    download="sintesis_emisario.wav"
                    className="text-xs text-cyan-400 hover:underline"
                  >
                    Descargar WAV
                  </a>
                )}
              </div>
            </div>

            {/* Catálogo de Voces */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Mic className="w-4 h-4 text-indigo-400" /> Voces Disponibles ({voices.length})
              </h3>
              <div className="space-y-3 max-h-[350px] overflow-y-auto pr-1">
                {voices.map((v) => (
                  <div
                    key={v.id}
                    onClick={() => {
                      setSelectedVoice(v.id);
                      setAudioUrl(null);
                    }}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      selectedVoice === v.id
                        ? 'bg-indigo-950/40 border-indigo-500'
                        : 'bg-slate-950 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white">{v.name}</span>
                      <span className="text-[10px] bg-slate-850 px-2 py-0.5 rounded text-slate-400 capitalize">
                        {v.voice_type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{v.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Clonación de Voz */}
        {activeTab === 'clone' && (
          <div className="mt-8 max-w-2xl mx-auto bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Mic className="w-5 h-5 text-indigo-400" /> Clonar una Nueva Voz de Marca
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Sube un audio de referencia limpio (formato WAV o MP3 de 10 a 60 segundos) para que el motor
              VoiceStudio clone el timbre y entonación.
            </p>

            {cloneMessage && (
              <div className="mb-6 p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 shrink-0" />
                <span>{cloneMessage}</span>
              </div>
            )}

            <form onSubmit={handleCloneVoice} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Nombre de la Voz</label>
                <input
                  type="text"
                  required
                  value={cloneName}
                  onChange={(e) => setCloneName(e.target.value)}
                  placeholder="Ej. Voz Vocero Institucional"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">Muestra de Audio (WAV / MP3)</label>
                <div className="border-2 border-dashed border-slate-800 hover:border-slate-700 rounded-xl p-6 text-center cursor-pointer bg-slate-950/50">
                  <Upload className="w-8 h-8 text-slate-500 mx-auto mb-2" />
                  <input
                    type="file"
                    accept="audio/*"
                    required
                    onChange={(e) => setCloneFile(e.target.files ? e.target.files[0] : null)}
                    className="text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
                  />
                  {cloneFile && (
                    <p className="mt-2 text-xs text-cyan-400 font-mono">Archivo: {cloneFile.name}</p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                disabled={cloningVoice}
                className="w-full bg-gradient-to-r from-indigo-600 to-cyan-500 hover:from-indigo-500 hover:to-cyan-400 text-white font-semibold text-xs py-3 rounded-xl shadow-lg transition-all disabled:opacity-50 cursor-pointer"
              >
                {cloningVoice ? 'Extrayendo Embeddings con VoiceStudio...' : 'Comenzar Clonación'}
              </button>
            </form>
          </div>
        )}

        {/* Tab 3: Configuración de IA */}
        {activeTab === 'ai' && (
          <div className="mt-8 max-w-2xl mx-auto bg-slate-900/40 border border-slate-800 rounded-2xl p-8 space-y-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Cpu className="w-5 h-5 text-purple-400" /> Motor de Inteligencia Artificial del Inquilino
            </h3>

            {integrationStatusMsg['ai'] && (
              <div className="p-3 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300">
                {integrationStatusMsg['ai']}
              </div>
            )}

            <div>
              <label className="block text-xs text-slate-400 mb-1">Proveedor de LLM</label>
              <select
                value={aiProvider}
                onChange={(e) => setAiProvider(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-3 focus:outline-none focus:border-purple-500"
              >
                <option value="openai">OpenAI (GPT-4o, GPT-4o-mini)</option>
                <option value="anthropic">Anthropic (Claude 3.5 Sonnet, Haiku)</option>
                <option value="gemini">Google Gemini (Gemini 1.5 Pro, Flash)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Clave de API (Cifrada con Fernet)</label>
              <input
                type="password"
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                placeholder="sk-proj-..."
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">Modelo</label>
              <input
                type="text"
                value={aiModel}
                onChange={(e) => setAiModel(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-purple-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1">System Prompt Personalizado</label>
              <textarea
                value={aiPrompt}
                onChange={(e) => setAiPrompt(e.target.value)}
                rows={3}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-purple-500"
              />
            </div>

            <button
              onClick={() =>
                handleTestAndSave('ai', {
                  provider: aiProvider,
                  api_key: aiKey,
                  model: aiModel,
                  system_prompt: aiPrompt,
                })
              }
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs py-3 rounded-xl shadow-lg transition-all cursor-pointer"
            >
              Probar Conexión y Guardar Configuración
            </button>
          </div>
        )}

        {/* Tab 4: Reuniones Bilingües */}
        {activeTab === 'meetings' && (
          <div className="mt-8 space-y-6">
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <Radio className="w-4 h-4 text-emerald-400" /> Salas de Reunión Bilingüe (Español / Inglés)
              </h3>

              <form onSubmit={handleCreateMeeting} className="flex gap-3 mb-6">
                <input
                  type="text"
                  required
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  placeholder="Título de la reunión (ej. Junta Trimestral Internacional)"
                  className="flex-1 bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
                <button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold px-4 py-2.5 rounded-lg shadow cursor-pointer flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" /> Crear Sala
                </button>
              </form>

              <div className="space-y-4">
                {meetings.map((m) => (
                  <div key={m.id} className="bg-slate-950 border border-slate-800 rounded-xl p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div>
                        <h4 className="font-bold text-white text-sm">{m.title}</h4>
                        <span className="text-[11px] text-slate-500">
                          {m.source_language.toUpperCase()} ➔ {m.target_language.toUpperCase()} · Estado:{' '}
                          <span className="text-emerald-400 capitalize">{m.status}</span>
                        </span>
                      </div>
                    </div>

                    {/* Log de Transcripción y Traducción */}
                    <div className="bg-slate-900/70 rounded-lg p-3 space-y-2 text-xs">
                      {m.transcript_log.map((entry, i) => (
                        <div key={i} className="border-b border-slate-800/80 pb-2 last:border-0 last:pb-0">
                          <span className="text-[10px] text-cyan-400 font-mono font-bold mr-2">
                            [{entry.speaker}]
                          </span>
                          <span className="text-slate-300">{entry.original_text}</span>
                          <p className="text-slate-400 italic text-[11px] mt-0.5 pl-4 border-l border-emerald-500/40">
                            ➔ {entry.translated_text}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Tab 5: Integraciones y Pasarelas de Pago */}
        {activeTab === 'integrations' && (
          <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* WhatsApp & Telegram */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-emerald-400" /> Mensajería Omnicanal
              </h3>

              {integrationStatusMsg['whatsapp'] && (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300">
                  {integrationStatusMsg['whatsapp']}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">WhatsApp Phone Number ID</label>
                <input
                  type="text"
                  value={whatsappPhoneId}
                  onChange={(e) => setWhatsappPhoneId(e.target.value)}
                  placeholder="1049284729102"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">WhatsApp Cloud API Access Token</label>
                <input
                  type="password"
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                  placeholder="EAAXx..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
                />
              </div>

              <button
                onClick={() =>
                  handleTestAndSave('whatsapp', {
                    phone_number_id: whatsappPhoneId,
                    access_token: whatsappToken,
                  })
                }
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs py-2.5 rounded-lg shadow transition-all cursor-pointer"
              >
                Verificar y Guardar WhatsApp
              </button>
            </div>

            {/* Pasarelas de Pago en Moneda Local */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6 space-y-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-cyan-400" /> Pasarela de Pago
              </h3>

              {integrationStatusMsg[paymentGateway] && (
                <div className="p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300">
                  {integrationStatusMsg[paymentGateway]}
                </div>
              )}

              <div>
                <label className="block text-xs text-slate-400 mb-1">Pasarela</label>
                <select
                  value={paymentGateway}
                  onChange={(e) => setPaymentGateway(e.target.value as any)}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-white rounded-lg p-2.5 focus:outline-none focus:border-cyan-500"
                >
                  <option value="wompi">Wompi (Colombia - COP)</option>
                  <option value="mercadopago">MercadoPago (LatAm - MXN/ARS)</option>
                  <option value="stripe">Stripe (Global - USD/CAD/EUR)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 mb-1">
                  {paymentGateway === 'wompi'
                    ? 'Llave Pública (pub_test_ / pub_prod_)'
                    : paymentGateway === 'stripe'
                    ? 'Secret Key (sk_test_ / sk_live_)'
                    : 'Access Token (TEST- / APP_USR-)'}
                </label>
                <input
                  type="password"
                  value={gatewayKey1}
                  onChange={(e) => setGatewayKey1(e.target.value)}
                  placeholder="Llave principal..."
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                />
              </div>

              {paymentGateway === 'wompi' && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Llave Privada (prv_test_ / prv_prod_)</label>
                  <input
                    type="password"
                    value={gatewayKey2}
                    onChange={(e) => setGatewayKey2(e.target.value)}
                    placeholder="prv_test_..."
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-cyan-500 font-mono"
                  />
                </div>
              )}

              <button
                onClick={() => {
                  const payload =
                    paymentGateway === 'wompi'
                      ? { public_key: gatewayKey1, private_key: gatewayKey2 }
                      : paymentGateway === 'stripe'
                      ? { secret_key: gatewayKey1 }
                      : { access_token: gatewayKey1 };
                  handleTestAndSave(paymentGateway, payload);
                }}
                className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs py-2.5 rounded-lg shadow transition-all cursor-pointer"
              >
                Conectar Pasarela en Moneda Local
              </button>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
