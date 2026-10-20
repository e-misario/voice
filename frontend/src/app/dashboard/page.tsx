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
  Trash2,
  Eye,
  X,
  AlertTriangle,
  RotateCcw,
  Check,
} from 'lucide-react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { DataTable, DataTableColumn, DataTableSegmentFilter } from '@/components/DataTable';
import {
  fetchVoices,
  synthesizeTTS,
  cloneVoice,
  deleteVoice,
  fetchIntegrations,
  saveIntegration,
  testIntegration,
  fetchMeetings,
  createMeeting,
  deleteMeeting,
} from '@/lib/api';
import { Voice, Integration, Meeting } from '@/types';

export default function TenantDashboard() {
  const [activeTab, setActiveTab] = useState<'tts' | 'voices' | 'clone' | 'ai' | 'meetings' | 'integrations'>('tts');
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

  // Modales y CRUD de Voces
  const [deletingVoiceId, setDeletingVoiceId] = useState<string | null>(null);

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

  const [paymentGateway, setPaymentGateway] = useState<'wompi' | 'stripe' | 'mercadopago'>('wompi');
  const [gatewayKey1, setGatewayKey1] = useState<string>('');
  const [gatewayKey2, setGatewayKey2] = useState<string>('');

  const [integrationStatusMsg, setIntegrationStatusMsg] = useState<{ [key: string]: string }>({});

  // Estado de Reuniones y CRUD
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isMeetingModalOpen, setIsMeetingModalOpen] = useState(false);
  const [newMeetingTitle, setNewMeetingTitle] = useState<string>('');
  const [newMeetingSourceLang, setNewMeetingSourceLang] = useState<string>('es');
  const [newMeetingTargetLang, setNewMeetingTargetLang] = useState<string>('en');
  const [viewingMeeting, setViewingMeeting] = useState<Meeting | null>(null);
  const [deletingMeetingId, setDeletingMeetingId] = useState<string | null>(null);

  // Notificación global del dashboard
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 4500);
  };

  // Cargar datos del inquilino
  const loadTenantData = async () => {
    try {
      const [v, m, existingIntegrations] = await Promise.all([
        fetchVoices(tenantId),
        fetchMeetings(tenantId),
        fetchIntegrations(tenantId),
      ]);
      setVoices(v);
      setMeetings(m);

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
  const handleSynthesize = async (customVoiceId?: string) => {
    const voiceToUse = customVoiceId || selectedVoice;
    if (audioUrl && isPlaying && audioElement) {
      audioElement.pause();
      setIsPlaying(false);
      return;
    }
    setGeneratingTTS(true);
    try {
      const res = await synthesizeTTS({
        text: ttsText,
        voice_id: voiceToUse,
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
      showNotification('Audio generado con éxito con VoiceStudio');
    } catch (err) {
      console.error('Error al sintetizar voz:', err);
      showNotification('Error al sintetizar el audio en VoiceStudio', 'error');
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
      showNotification(`¡Voz '${newVoice.name}' clonada y registrada con éxito!`);
      setCloneName('');
      setCloneFile(null);
      loadTenantData();
      setActiveTab('voices');
    } catch (err) {
      console.error('Error clonando voz:', err);
      showNotification('Error en el proceso de clonación con VoiceStudio', 'error');
    } finally {
      setCloningVoice(false);
    }
  };

  // Eliminar Voz
  const handleDeleteVoice = async (voiceId: string) => {
    try {
      await deleteVoice(voiceId, tenantId);
      showNotification('Voz eliminada correctamente');
      setDeletingVoiceId(null);
      loadTenantData();
    } catch (err) {
      showNotification('Error al eliminar la voz', 'error');
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
        showNotification(`Integración '${kind}' verificada y guardada con éxito`);
      } else {
        setIntegrationStatusMsg((prev) => ({
          ...prev,
          [kind]: `❌ Falló la prueba: ${testRes.message}`,
        }));
        showNotification(`Falló la verificación de '${kind}'`, 'error');
      }
    } catch (err) {
      setIntegrationStatusMsg((prev) => ({
        ...prev,
        [kind]: '❌ Error de comunicación con la API.',
      }));
      showNotification('Error de conexión con la API', 'error');
    }
  };

  // Crear Reunión Bilingüe
  const handleCreateMeeting = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMeetingTitle) return;
    try {
      const m = await createMeeting(tenantId, newMeetingTitle, newMeetingSourceLang, newMeetingTargetLang);
      setMeetings([m, ...meetings]);
      setNewMeetingTitle('');
      setIsMeetingModalOpen(false);
      showNotification(`Sala bilingüe '${m.title}' creada con éxito`);
    } catch (err) {
      console.error('Error creando reunión:', err);
      showNotification('Error al crear la sala de reunión', 'error');
    }
  };

  // Eliminar Reunión
  const handleDeleteMeeting = async (meetingId: string) => {
    try {
      await deleteMeeting(meetingId);
      showNotification('Sala de reunión eliminada correctamente');
      setDeletingMeetingId(null);
      if (viewingMeeting?.id === meetingId) {
        setViewingMeeting(null);
      }
      loadTenantData();
    } catch (err) {
      showNotification('Error al eliminar la reunión', 'error');
    }
  };

  // ==========================================
  // CONFIGURACIÓN DATATABLE: VOCES
  // ==========================================
  const voiceColumns: DataTableColumn<Voice>[] = [
    {
      key: 'name',
      header: 'Nombre de la Voz',
      sortable: true,
      render: (v) => (
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <Mic className="w-3.5 h-3.5" />
          </span>
          <div>
            <div className="font-bold text-white text-xs">{v.name}</div>
            <div className="text-[10px] text-slate-400 font-mono">ID: {v.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'voice_type',
      header: 'Tipo',
      sortable: true,
      render: (v) => {
        const isCloned = v.voice_type === 'cloned';
        return (
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase font-mono ${
              isCloned
                ? 'bg-purple-500/10 text-purple-300 border border-purple-500/30'
                : 'bg-cyan-500/10 text-cyan-300 border border-cyan-500/30'
            }`}
          >
            {isCloned ? 'Clonada (Marca)' : 'Preset Sistema'}
          </span>
        );
      },
    },
    {
      key: 'language',
      header: 'Idioma',
      sortable: true,
      render: (v) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-slate-300 bg-slate-900 border border-slate-800 uppercase">
          {v.language}
        </span>
      ),
    },
    {
      key: 'gender',
      header: 'Género',
      sortable: true,
      render: (v) => (
        <span className="text-xs text-slate-300 capitalize">{v.gender || 'Femenino'}</span>
      ),
    },
    {
      key: 'description',
      header: 'Descripción',
      render: (v) => (
        <span className="text-slate-400 text-xs line-clamp-1">{v.description || 'Sin descripción'}</span>
      ),
    },
    {
      key: 'is_default',
      header: 'Activa en TTS',
      render: (v) => {
        const isSelected = selectedVoice === v.id;
        return (
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isSelected
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'text-slate-500'
            }`}
          >
            {isSelected ? '✓ Seleccionada' : 'Disponible'}
          </span>
        );
      },
    },
  ];

  const voiceSegments: DataTableSegmentFilter<Voice>[] = [
    {
      id: 'all',
      label: 'Todas las Voces',
      filterFn: () => true,
    },
    {
      id: 'cloned',
      label: 'Voces Clonadas',
      filterFn: (v) => v.voice_type === 'cloned',
    },
    {
      id: 'preset',
      label: 'Presets del Sistema',
      filterFn: (v) => v.voice_type === 'preset',
    },
  ];

  // ==========================================
  // CONFIGURACIÓN DATATABLE: REUNIONES
  // ==========================================
  const meetingColumns: DataTableColumn<Meeting>[] = [
    {
      key: 'title',
      header: 'Título de la Sala',
      sortable: true,
      render: (m) => (
        <div className="flex items-center gap-2">
          <span className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <Radio className="w-3.5 h-3.5" />
          </span>
          <div>
            <div className="font-bold text-white text-xs">{m.title}</div>
            <div className="text-[10px] text-slate-500 font-mono">ID: {m.id}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'languages',
      header: 'Par de Idiomas',
      render: (m) => (
        <span className="px-2 py-0.5 rounded text-[11px] font-mono text-cyan-300 bg-cyan-500/10 border border-cyan-500/20">
          {m.source_language.toUpperCase()} ➔ {m.target_language.toUpperCase()}
        </span>
      ),
    },
    {
      key: 'transcripts',
      header: 'Transcripciones',
      render: (m) => (
        <span className="text-xs font-mono text-slate-300">
          {m.transcript_log?.length || 0} turnos registrados
        </span>
      ),
    },
    {
      key: 'status',
      header: 'Estado',
      sortable: true,
      render: (m) => {
        const isLive = m.status === 'live';
        return (
          <span
            className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold capitalize ${
              isLive
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                : 'bg-slate-800 text-slate-400 border border-slate-700'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            {isLive ? 'En Vivo' : m.status === 'scheduled' ? 'Programada' : 'Finalizada'}
          </span>
        );
      },
    },
    {
      key: 'created_at',
      header: 'Fecha Creación',
      sortable: true,
      render: (m) => (
        <span className="text-slate-500 text-[11px]">
          {m.created_at ? new Date(m.created_at).toLocaleDateString() : 'Hoy'}
        </span>
      ),
    },
  ];

  const meetingSegments: DataTableSegmentFilter<Meeting>[] = [
    {
      id: 'all',
      label: 'Todas las Salas',
      filterFn: () => true,
    },
    {
      id: 'live',
      label: 'En Vivo',
      filterFn: (m) => m.status === 'live',
    },
    {
      id: 'ended',
      label: 'Finalizadas / Historial',
      filterFn: (m) => m.status === 'completed' || m.status === 'scheduled',
    },
  ];

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
              <h1 className="text-2xl font-black text-white">Panel de Control del Inquilino — E-MIS@RIO SAS</h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Inquilino activo: <span className="text-white font-mono font-semibold">e-misario.voice.e-misario.com</span>
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 px-3 py-1.5 rounded-lg font-mono">
              Cuota TTS: 1.000.000 caracteres
            </span>
          </div>
        </div>

        {/* Notificación global */}
        {notification && (
          <div
            className={`mt-4 p-3 rounded-xl text-xs flex items-center gap-2 animate-fade-in ${
              notification.type === 'success'
                ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400'
                : 'bg-red-500/10 border border-red-500/30 text-red-400'
            }`}
          >
            {notification.type === 'success' ? (
              <CheckCircle className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{notification.message}</span>
          </div>
        )}

        {/* Pestañas de Navegación */}
        <div className="flex space-x-1 sm:space-x-4 mt-6 border-b border-slate-800 text-xs font-semibold overflow-x-auto pb-1">
          <button
            onClick={() => setActiveTab('tts')}
            className={`pb-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'tts'
                ? 'border-cyan-400 text-cyan-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Volume2 className="w-4 h-4" /> Estudio Text-to-Speech
          </button>
          <button
            onClick={() => setActiveTab('voices')}
            className={`pb-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'voices'
                ? 'border-indigo-400 text-indigo-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Mic className="w-4 h-4" /> Catálogo de Voces ({voices.length})
          </button>
          <button
            onClick={() => setActiveTab('clone')}
            className={`pb-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'clone'
                ? 'border-purple-400 text-purple-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Upload className="w-4 h-4" /> Clonar Voz Propia
          </button>
          <button
            onClick={() => setActiveTab('meetings')}
            className={`pb-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'meetings'
                ? 'border-emerald-400 text-emerald-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Radio className="w-4 h-4" /> Salas de Reunión ({meetings.length})
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={`pb-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'ai'
                ? 'border-pink-400 text-pink-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <Cpu className="w-4 h-4" /> Asistente IA (LLMs)
          </button>
          <button
            onClick={() => setActiveTab('integrations')}
            className={`pb-3 px-3 sm:px-4 border-b-2 flex items-center gap-2 whitespace-nowrap transition-colors ${
              activeTab === 'integrations'
                ? 'border-orange-400 text-orange-400 font-bold'
                : 'border-transparent text-slate-400 hover:text-white'
            }`}
          >
            <CreditCard className="w-4 h-4" /> Integraciones & Pasarelas
          </button>
        </div>

        {/* ======================================================== */}
        {/* TAB 1: ESTUDIO TEXT-TO-SPEECH                            */}
        {/* ======================================================== */}
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
                        {v.name} ({v.voice_type})
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
                  onClick={() => handleSynthesize()}
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

            {/* Selector Rápido de Voces */}
            <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Mic className="w-4 h-4 text-indigo-400" /> Voces Activas
                </h3>
                <button
                  onClick={() => setActiveTab('voices')}
                  className="text-xs text-indigo-400 hover:underline"
                >
                  Ver DataTable ➔
                </button>
              </div>
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

        {/* ======================================================== */}
        {/* TAB 2: DATATABLE DE VOCES Y CLONACIONES                  */}
        {/* ======================================================== */}
        {activeTab === 'voices' && (
          <div className="mt-8 space-y-4">
            <DataTable<Voice>
              title="Catálogo de Voces Neurales"
              subtitle="Explore voces del sistema y voces clonadas exclusivamente para su marca."
              data={voices}
              columns={voiceColumns}
              searchFields={['name', 'voice_type', 'language', 'description']}
              searchPlaceholder="Buscar por nombre, idioma o descripción de voz..."
              segments={voiceSegments}
              onCreate={() => setActiveTab('clone')}
              createLabel="Clonar Nueva Voz"
              defaultPageSize={5}
              rowKey={(v) => v.id}
              actions={(v) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => {
                      setSelectedVoice(v.id);
                      setActiveTab('tts');
                      showNotification(`Voz '${v.name}' seleccionada para el estudio TTS`);
                    }}
                    title="Usar en TTS"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white text-[11px] transition-colors cursor-pointer"
                  >
                    <Play className="w-3 h-3 fill-current" />
                    <span>Usar</span>
                  </button>
                  {v.voice_type === 'cloned' && (
                    <button
                      onClick={() => setDeletingVoiceId(v.id)}
                      title="Eliminar Voz Clonada"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              )}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 3: CLONACIÓN DE VOZ PROPIA                           */}
        {/* ======================================================== */}
        {activeTab === 'clone' && (
          <div className="mt-8 max-w-2xl mx-auto bg-slate-900/40 border border-slate-800 rounded-2xl p-8">
            <h3 className="text-lg font-bold text-white mb-2 flex items-center gap-2">
              <Mic className="w-5 h-5 text-indigo-400" /> Clonar una Nueva Voz de Marca
            </h3>
            <p className="text-xs text-slate-400 mb-6">
              Sube un audio de referencia limpio (formato WAV o MP3 de 10 a 60 segundos) para que el motor
              VoiceStudio clone el timbre y entonación. La voz aparecerá inmediatamente en tu DataTable de Voces.
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
                  placeholder="Ej. Vocero Oficial E-MIS@RIO"
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

        {/* ======================================================== */}
        {/* TAB 4: DATATABLE DE REUNIONES BILINGÜES                  */}
        {/* ======================================================== */}
        {activeTab === 'meetings' && (
          <div className="mt-8 space-y-4">
            <DataTable<Meeting>
              title="Salas de Traducción Simultánea"
              subtitle="Reuniones con transcripción automática por voz ASR y síntesis de traducción simultánea."
              data={meetings}
              columns={meetingColumns}
              searchFields={['title', 'source_language', 'target_language', 'status']}
              searchPlaceholder="Buscar por título o idioma de la sala..."
              segments={meetingSegments}
              onCreate={() => setIsMeetingModalOpen(true)}
              createLabel="Crear Nueva Sala"
              defaultPageSize={5}
              rowKey={(m) => m.id}
              actions={(m) => (
                <div className="flex items-center justify-end gap-1.5">
                  <button
                    onClick={() => setViewingMeeting(m)}
                    title="Ver Transcripción en Vivo"
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600 text-emerald-300 hover:text-white text-[11px] transition-colors cursor-pointer"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Ver Log</span>
                  </button>
                  <button
                    onClick={() => setDeletingMeetingId(m.id)}
                    title="Eliminar Sala"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-red-900/40 text-slate-400 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            />
          </div>
        )}

        {/* ======================================================== */}
        {/* TAB 5: ASISTENTE DE IA (LLMs)                           */}
        {/* ======================================================== */}
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

        {/* ======================================================== */}
        {/* TAB 6: INTEGRACIONES Y PASARELAS DE PAGO                 */}
        {/* ======================================================== */}
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

      {/* ======================================================== */}
      {/* MODAL: CREAR SALA DE REUNIÓN                             */}
      {/* ======================================================== */}
      {isMeetingModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Radio className="w-5 h-5 text-emerald-400" />
                Crear Nueva Sala Bilingüe
              </h3>
              <button
                onClick={() => setIsMeetingModalOpen(false)}
                className="text-slate-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateMeeting} className="space-y-4">
              <div>
                <label className="block text-xs text-slate-400 mb-1">Título de la Reunión</label>
                <input
                  type="text"
                  required
                  value={newMeetingTitle}
                  onChange={(e) => setNewMeetingTitle(e.target.value)}
                  placeholder="Ej. Junta Directiva Internacional"
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Idioma Origen</label>
                  <select
                    value={newMeetingSourceLang}
                    onChange={(e) => setNewMeetingSourceLang(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white uppercase"
                  >
                    <option value="es">Español (ES)</option>
                    <option value="en">Inglés (EN)</option>
                    <option value="pt">Portugués (PT)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-slate-400 mb-1">Idioma Destino</label>
                  <select
                    value={newMeetingTargetLang}
                    onChange={(e) => setNewMeetingTargetLang(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-xs text-white uppercase"
                  >
                    <option value="en">Inglés (EN)</option>
                    <option value="es">Español (ES)</option>
                    <option value="pt">Portugués (PT)</option>
                  </select>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsMeetingModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white bg-slate-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-500 shadow cursor-pointer"
                >
                  Iniciar Sala
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: VER TRANSCRIPCIÓN Y LOG DE REUNIÓN                */}
      {/* ======================================================== */}
      {viewingMeeting && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-xl w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Radio className="w-5 h-5 text-emerald-400" />
                  {viewingMeeting.title}
                </h3>
                <span className="text-[11px] text-slate-400 font-mono">
                  {viewingMeeting.source_language.toUpperCase()} ➔ {viewingMeeting.target_language.toUpperCase()} · Estado: {viewingMeeting.status}
                </span>
              </div>
              <button
                onClick={() => setViewingMeeting(null)}
                className="text-slate-500 hover:text-white p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="max-h-[350px] overflow-y-auto space-y-3 bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs">
              {viewingMeeting.transcript_log && viewingMeeting.transcript_log.length > 0 ? (
                viewingMeeting.transcript_log.map((entry, i) => (
                  <div key={i} className="border-b border-slate-850 pb-2.5 last:border-0 last:pb-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] text-cyan-400 font-mono font-bold">
                        [{entry.speaker}]
                      </span>
                      <span className="text-[10px] text-slate-500">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleTimeString() : ''}
                      </span>
                    </div>
                    <p className="text-slate-200">{entry.original_text}</p>
                    <p className="text-emerald-400 italic text-[11px] mt-1 pl-3 border-l-2 border-emerald-500/40">
                      ➔ {entry.translated_text}
                    </p>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-slate-500">
                  Esperando intervenciones de audio para transcribir y sintetizar.
                </div>
              )}
            </div>

            <div className="flex justify-end pt-2">
              <button
                onClick={() => setViewingMeeting(null)}
                className="px-4 py-2 rounded-xl text-xs bg-slate-800 text-slate-300 hover:text-white"
              >
                Cerrar Visor
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE REUNIÓN                  */}
      {/* ======================================================== */}
      {deletingMeetingId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-sm">Eliminar Sala de Reunión</h3>
            </div>
            <p className="text-xs text-slate-400">
              ¿Estás seguro de que deseas eliminar esta sala y todo su registro de traducción bilingüe?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingMeetingId(null)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteMeeting(deletingMeetingId)}
                className="px-3 py-1.5 rounded-lg text-xs bg-red-600 hover:bg-red-500 text-white font-semibold cursor-pointer"
              >
                Eliminar Sala
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL: CONFIRMAR ELIMINACIÓN DE VOZ                      */}
      {/* ======================================================== */}
      {deletingVoiceId && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-red-400">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <h3 className="font-bold text-white text-sm">Eliminar Voz Clonada</h3>
            </div>
            <p className="text-xs text-slate-400">
              ¿Estás seguro de que deseas eliminar esta voz clonada de tu catálogo?
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingVoiceId(null)}
                className="px-3 py-1.5 rounded-lg text-xs bg-slate-800 text-slate-300 hover:text-white"
              >
                Cancelar
              </button>
              <button
                onClick={() => handleDeleteVoice(deletingVoiceId)}
                className="px-3 py-1.5 rounded-lg text-xs bg-red-600 hover:bg-red-500 text-white font-semibold cursor-pointer"
              >
                Eliminar Voz
              </button>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  );
}
