import React, { useState, useEffect } from 'react';
import { Organismo } from '../types';
import { X, Save, History, Loader2, ArrowRight } from 'lucide-react';

interface OrganismoEditModalProps {
  organismo: Organismo;
  onClose: () => void;
  onSaved: (updated: Organismo) => void;
}

export default function OrganismoEditModal({ organismo, onClose, onSaved }: OrganismoEditModalProps) {
  const [formData, setFormData] = useState<Partial<Organismo>>(organismo);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<'edit' | 'history'>('edit');
  const [historyDocs, setHistoryDocs] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const res = await fetch(`/api/organismos/${organismo.id}/history`);
      if (res.ok) {
        const data = await res.json();
        setHistoryDocs(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'history' && organismo.id) {
      loadHistory();
    }
  }, [activeTab]);

  const handleChange = (field: keyof Organismo, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!organismo.id) return;
    setIsSaving(true);
    try {
      const res = await fetch(`/api/organismos/${organismo.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (!res.ok) throw new Error('Failed to update');
      const updated = await res.json();
      onSaved(updated);
    } catch (e) {
      console.error(e);
      alert('Error al guardar. Intenta nuevamente.');
    } finally {
      setIsSaving(false);
    }
  };

  // Helper para renderizar los switches de palanca (Verde para Activo, Rojo para Inactivo)
  const renderSwitch = (
    label: string,
    value: boolean | string | undefined,
    onChange: (checked: boolean) => void
  ) => {
    const isChecked = typeof value === 'boolean'
      ? value
      : (value === 'Si' || value === 'Tiene' || value === 'Hizo');

    return (
      <div className="flex items-center justify-between p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm">
        <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">{label}</span>
        <button
          type="button"
          onClick={() => onChange(!isChecked)}
          className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            isChecked ? 'bg-emerald-500' : 'bg-rose-500'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
              isChecked ? 'translate-x-5.5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>
    );
  };

  // Función para renderizar los campos del snapshot del historial de forma gráfica y amigable
  const renderSnapshotFields = (snapshotStr: string, idx: number) => {
    try {
      const currentSnap = JSON.parse(snapshotStr);
      
      const normalizeVal = (v: any): string => {
        if (typeof v === 'boolean') return v ? 'Si' : 'No';
        if (!v) return 'No';
        const s = v.toString().trim().toLowerCase();
        if (s === 'si' || s === 'sí' || s === 'tiene' || s === 'hizo') return 'Si';
        return 'No';
      };

      const getDiffsList = (curr: any, prev: any) => {
        const diffs: { label: string; from: string; to: string }[] = [];
        const fields = [
          { key: 'tieneWeb', label: 'Sitio Web Oficial' },
          { key: 'tieneWebPropia', label: 'Dominio Propio / Web Propia' },
          { key: 'guiaTramites', label: 'Guía de Trámites' },
          { key: 'tramitesOnline', label: 'Trámites Online' },
          { key: 'turnosOnline', label: 'Turnos Online' },
          { key: 'expedienteDigital', label: 'Expediente Digital' },
          { key: 'firmaDigital', label: 'Tienen Firma Digital' },
          { key: 'tieneDoco', label: 'Contratado Doco' },
          { key: 'usaSiif', label: 'Uso de SiiF' },
          { key: 'analisisProcesos', label: 'Analisis de Procesos con Gcia. Innovacion' },
          { key: 'usaIA', label: 'Tienen IA en sus procesos' },
          { key: 'chatbot', label: 'Tiene Chatbot' }
        ];

        fields.forEach(f => {
          const valCurr = normalizeVal(curr[f.key]);
          const valPrev = normalizeVal(prev[f.key]);
          if (valCurr !== valPrev) {
            diffs.push({
              label: f.label,
              from: valPrev,
              to: valCurr
            });
          }
        });
        return diffs;
      };

      const prevItem = historyDocs[idx + 1];

      if (!prevItem) {
        // Es el primer registro / Línea Base Inicial
        const fields = [
          { label: 'Web Oficial', val: currentSnap.tieneWeb },
          { label: 'Web Propia', val: currentSnap.tieneWebPropia },
          { label: 'Tienen IA en sus procesos', val: currentSnap.usaIA },
          { label: 'Chatbot', val: currentSnap.chatbot },
          { label: 'Guía Trámites', val: currentSnap.guiaTramites },
          { label: 'Trám. Online', val: currentSnap.tramitesOnline },
          { label: 'Turnos Online', val: currentSnap.turnosOnline },
          { label: 'Exp. Digital', val: currentSnap.expedienteDigital },
          { label: 'Tienen Firma Digital', val: currentSnap.firmaDigital },
          { label: 'Contratado Doco', val: currentSnap.tieneDoco },
          { label: 'SiiF', val: currentSnap.usaSiif },
          { label: 'Analisis de Procesos con Gcia. Innovacion', val: currentSnap.analisisProcesos }
        ];

        return (
          <div className="mt-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block mb-2">
              Estado Inicial / Línea Base
            </span>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {fields.map((f, i) => {
                const yes = normalizeVal(f.val) === 'Si';
                return (
                  <div key={i} className="flex items-center justify-between text-xs p-1.5 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850/60">
                    <span className="text-slate-550 dark:text-slate-400 font-medium truncate mr-1" title={f.label}>
                      {f.label}
                    </span>
                    <span className={`px-1.5 py-0.5 rounded-full text-[9px] font-bold ${
                      yes 
                        ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-455'
                    }`}>
                      {yes ? 'SÍ' : 'NO'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        );
      }

      // Comparar contra la versión previa del historial
      const prevSnap = JSON.parse(prevItem.snapshot);
      const changes = getDiffsList(currentSnap, prevSnap);

      if (changes.length === 0) {
        return (
          <div className="mt-2 text-xs text-slate-400 dark:text-slate-500 italic">
            No hubo cambios en las variables de digitalización (se actualizaron otros campos o metadatos).
          </div>
        );
      }

      return (
        <div className="mt-3 pt-3 border-t border-slate-150 dark:border-slate-800">
          <span className="text-[10px] font-bold text-slate-450 dark:text-slate-500 uppercase tracking-wider block mb-2">
            Evolución de Variables (Antes ➔ Después)
          </span>
          <div className="space-y-1.5">
            {changes.map((c, i) => {
              const activeNow = c.to === 'Si';
              return (
                <div key={i} className="flex items-center gap-2 text-xs">
                  <span className="font-semibold text-slate-700 dark:text-slate-350 min-w-[150px]">{c.label}:</span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-950 text-slate-500 font-bold">
                    {c.from === 'Si' ? 'SÍ' : 'NO'}
                  </span>
                  <ArrowRight className="w-3 h-3 text-slate-400 shrink-0" />
                  <span className={`px-1.5 py-0.5 rounded font-extrabold ${
                    activeNow
                      ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400'
                      : 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-455'
                  }`}>
                    {activeNow ? 'SÍ' : 'NO'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );
    } catch (e) {
      return <div className="text-xs text-rose-500">Error al analizar los cambios históricos de esta versión.</div>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">

        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900">
          <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-100">
            {organismo.nombre}
          </h2>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 px-2 bg-white dark:bg-slate-900">
          <button
            onClick={() => setActiveTab('edit')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
              activeTab === 'edit'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            Editar Indicadores
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'history'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <History className="w-4 h-4" />
            Historial
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5">
          {activeTab === 'edit' ? (
            <form id="edit-form" onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                {/* Sitio Web Oficial */}
                <div className="space-y-2 col-span-1 md:col-span-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Sitio Web Oficial</span>
                    <button
                      type="button"
                      onClick={() => handleChange('tieneWeb', !formData.tieneWeb)}
                      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData.tieneWeb ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          formData.tieneWeb ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {formData.tieneWeb && (
                    <input
                      type="url"
                      placeholder="Ej: https://..."
                      value={formData.enlaceWeb || ''}
                      onChange={(e) => handleChange('enlaceWeb', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-2"
                    />
                  )}
                </div>

                {/* Web Propia */}
                <div className="space-y-2 col-span-1 md:col-span-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Dominio Propio / Web Propia</span>
                    <button
                      type="button"
                      onClick={() => handleChange('tieneWebPropia', !formData.tieneWebPropia)}
                      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData.tieneWebPropia ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          formData.tieneWebPropia ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {formData.tieneWebPropia && (
                    <input
                      type="url"
                      placeholder="Ej: https://..."
                      value={formData.enlaceWebPropia || ''}
                      onChange={(e) => handleChange('enlaceWebPropia', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-2"
                    />
                  )}
                </div>

                 {/* Guía de Trámites */}
                <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Guía de Trámites</span>
                    <button
                      type="button"
                      onClick={() => handleChange('guiaTramites', (formData.guiaTramites === 'Tiene' || formData.guiaTramites === 'Si') ? 'No' : 'Si')}
                      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        (formData.guiaTramites === 'Tiene' || formData.guiaTramites === 'Si') ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          (formData.guiaTramites === 'Tiene' || formData.guiaTramites === 'Si') ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {(formData.guiaTramites === 'Tiene' || formData.guiaTramites === 'Si') && (
                    <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <input
                        type="url"
                        placeholder="Enlace Guía (Ej: https://...)"
                        value={formData.enlaceGuia || ''}
                        onChange={(e) => handleChange('enlaceGuia', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <div>
                        <label className="text-[11px] font-bold text-slate-450 dark:text-slate-500 block mb-1">CANTIDAD DE TRÁMITES EN LA GUÍA</label>
                        <input
                          type="number"
                          placeholder="Cantidad de trámites"
                          value={formData.qTramitesGuia !== undefined ? formData.qTramitesGuia : ''}
                          onChange={(e) => handleChange('qTramitesGuia', parseInt(e.target.value, 10) || 0)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Trámites Online */}
                <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Trámites Online</span>
                    <button
                      type="button"
                      onClick={() => handleChange('tramitesOnline', (formData.tramitesOnline === 'Tiene' || formData.tramitesOnline === 'Si') ? 'No' : 'Si')}
                      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        (formData.tramitesOnline === 'Tiene' || formData.tramitesOnline === 'Si') ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          (formData.tramitesOnline === 'Tiene' || formData.tramitesOnline === 'Si') ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {(formData.tramitesOnline === 'Tiene' || formData.tramitesOnline === 'Si') && (
                    <div className="space-y-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <input
                        type="url"
                        placeholder="Enlace Trámites (Ej: https://...)"
                        value={formData.enlaceTramitesOnline || ''}
                        onChange={(e) => handleChange('enlaceTramitesOnline', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                      <div>
                        <label className="text-[11px] font-bold text-slate-450 dark:text-slate-500 block mb-1">CANTIDAD DE TRÁMITES ONLINE</label>
                        <input
                          type="number"
                          placeholder="Cantidad de trámites online"
                          value={formData.qTramitesOnline !== undefined ? formData.qTramitesOnline : ''}
                          onChange={(e) => handleChange('qTramitesOnline', parseInt(e.target.value, 10) || 0)}
                          className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                        />
                      </div>
                    </div>
                  )}
                </div>

                {/* Turnos Online */}
                <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Turnos Online</span>
                    <button
                      type="button"
                      onClick={() => handleChange('turnosOnline', (formData.turnosOnline === 'Tiene' || formData.turnosOnline === 'Si') ? 'No' : 'Si')}
                      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        (formData.turnosOnline === 'Tiene' || formData.turnosOnline === 'Si') ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          (formData.turnosOnline === 'Tiene' || formData.turnosOnline === 'Si') ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {(formData.turnosOnline === 'Tiene' || formData.turnosOnline === 'Si') && (
                    <input
                      type="url"
                      placeholder="Enlace Turnos (Ej: https://...)"
                      value={formData.enlaceTurnosOnline || ''}
                      onChange={(e) => handleChange('enlaceTurnosOnline', e.target.value)}
                      className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none mt-2"
                    />
                  )}
                </div>

                {/* Expediente Digital */}
                {renderSwitch('Expediente Digital', formData.expedienteDigital, (checked) => 
                  handleChange('expedienteDigital', checked ? 'Si' : 'No')
                )}

                 {/* Firma Digital */}
                <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tienen Firma Digital</span>
                    <button
                      type="button"
                      onClick={() => handleChange('firmaDigital', (formData.firmaDigital === 'Si' || formData.firmaDigital === 'Tiene') ? 'No' : 'Si')}
                      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        (formData.firmaDigital === 'Si' || formData.firmaDigital === 'Tiene') ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          (formData.firmaDigital === 'Si' || formData.firmaDigital === 'Tiene') ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {(formData.firmaDigital === 'Si' || formData.firmaDigital === 'Tiene') && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <label className="text-[11px] font-bold text-slate-450 dark:text-slate-500 block mb-1">RESEÑA DE LA FIRMA DIGITAL</label>
                      <textarea
                        rows={2}
                        placeholder="Escribí una reseña sobre la Firma Digital en este organismo..."
                        value={formData.resenaFirma || ''}
                        onChange={(e) => handleChange('resenaFirma', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Análisis de Procesos */}
                {renderSwitch('Analisis de Procesos con Gcia. Innovacion', formData.analisisProcesos, (checked) => 
                  handleChange('analisisProcesos', checked ? 'Hizo' : 'No')
                )}

                {/* DOCO */}
                {renderSwitch('Contratado Doco', formData.tieneDoco, (checked) => 
                  handleChange('tieneDoco', checked ? 'Si' : 'No')
                )}

                {/* SiiF */}
                <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Uso de SiiF</span>
                    <button
                      type="button"
                      onClick={() => handleChange('usaSiif', (formData.usaSiif === 'Si' || formData.usaSiif === 'Tiene') ? 'No' : 'Si')}
                      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        (formData.usaSiif === 'Si' || formData.usaSiif === 'Tiene') ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          (formData.usaSiif === 'Si' || formData.usaSiif === 'Tiene') ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {(formData.usaSiif === 'Si' || formData.usaSiif === 'Tiene') && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <label className="text-[11px] font-bold text-slate-450 dark:text-slate-500 block mb-1">RESEÑA DEL USO DE SIIF</label>
                      <textarea
                        rows={2}
                        placeholder="Escribí una reseña sobre el Uso de SiiF en este organismo..."
                        value={formData.resenaSiif || ''}
                        onChange={(e) => handleChange('resenaSiif', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Tienen IA en sus procesos */}
                <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tienen IA en sus procesos</span>
                    <button
                      type="button"
                      onClick={() => handleChange('usaIA', !formData.usaIA)}
                      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData.usaIA ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          formData.usaIA ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {formData.usaIA && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <label className="text-[11px] font-bold text-slate-450 dark:text-slate-500 block mb-1">RESEÑA DE IA EN SUS PROCESOS</label>
                      <textarea
                        rows={2}
                        placeholder="Escribí una reseña sobre el Uso de Inteligencia Artificial en este organismo..."
                        value={formData.resenaIa || ''}
                        onChange={(e) => handleChange('resenaIa', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>

                {/* Tiene Chatbot */}
                <div className="space-y-2 p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 col-span-1 md:col-span-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-300">Tiene Chatbot</span>
                    <button
                      type="button"
                      onClick={() => handleChange('chatbot', !formData.chatbot)}
                      className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        formData.chatbot ? 'bg-emerald-500' : 'bg-rose-500'
                      }`}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                          formData.chatbot ? 'translate-x-5.5' : 'translate-x-0'
                        }`}
                      />
                    </button>
                  </div>
                  {formData.chatbot && (
                    <div className="mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/80">
                      <label className="text-[11px] font-bold text-slate-450 dark:text-slate-500 block mb-1">RESEÑA DEL CHATBOT</label>
                      <textarea
                        rows={2}
                        placeholder="Escribí una reseña sobre el chatbot de este organismo..."
                        value={formData.chatbotResena || ''}
                        onChange={(e) => handleChange('chatbotResena', e.target.value)}
                        className="w-full p-2.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}
                </div>



              </div>
            </form>
          ) : (
            <div className="space-y-4">
              {loadingHistory ? (
                <div className="flex justify-center p-8">
                  <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                </div>
              ) : historyDocs.length === 0 ? (
                <div className="text-center p-8 text-slate-500 text-sm">
                  No hay cambios registrados todavía.
                </div>
              ) : (
                <div className="space-y-3">
                  {historyDocs.map((doc, idx) => (
                    <div key={idx} className="p-4 border border-slate-200 dark:border-slate-800 rounded-xl text-sm bg-white dark:bg-slate-900 shadow-sm">
                      <div className="flex justify-between items-center mb-1 pb-1 border-b border-slate-100 dark:border-slate-800">
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {doc.userId || 'Usuario Local'}
                        </span>
                        <span className="text-xs text-slate-400 font-mono">
                          {new Date(doc.createdAt).toLocaleString('es-AR')}
                        </span>
                      </div>
                      {renderSnapshotFields(doc.snapshot, idx)}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'edit' && (
          <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-850 rounded-lg transition"
            >
              Cancelar
            </button>
            <button
              type="submit"
              form="edit-form"
              disabled={isSaving}
              className="flex items-center gap-2 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg disabled:opacity-50 transition"
            >
              {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Guardar Cambios
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
