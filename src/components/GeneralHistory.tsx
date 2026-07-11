import React, { useEffect, useState } from 'react';
import { Loader2, History, ArrowRight, User, Check, X, RefreshCw, Search } from 'lucide-react';
import { apiUrl } from '../lib/api';

interface HistoryItem {
  id: number;
  organismoId: number;
  organismoNombre: string;
  userId: string;
  snapshot: string;
  createdAt: string;
}

interface GeneralHistoryProps {
  token?: string | null;
}

export default function GeneralHistory({ token }: GeneralHistoryProps) {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const res = await fetch(apiUrl('/api/history'), {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      });
      if (res.ok) {
        const data = await res.json();
        setHistory(data);
      }
    } catch (e) {
      console.error('Error fetching general history:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // Normaliza valores a "Si" o "No"
  const normalize = (v: any): string => {
    if (typeof v === 'boolean') return v ? 'Si' : 'No';
    if (!v) return 'No';
    const s = v.toString().trim().toLowerCase();
    if (s === 'si' || s === 'sí' || s === 'tiene' || s === 'hizo') return 'Si';
    return 'No';
  };

  const getDiffs = (currentSnap: any, prevSnap: any) => {
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
      const valCurrent = normalize(currentSnap[f.key]);
      const valPrev = normalize(prevSnap[f.key]);
      if (valCurrent !== valPrev) {
        diffs.push({
          label: f.label,
          from: valPrev,
          to: valCurrent
        });
      }
    });
    return diffs;
  };

  const renderSnapshotDetails = (item: HistoryItem, idx: number) => {
    try {
      const currentSnap = JSON.parse(item.snapshot);
      
      // Buscar el siguiente elemento en la lista que sea del mismo organismo (sería el estado anterior)
      const prevItem = history.slice(idx + 1).find(h => h.organismoId === item.organismoId);
      
      if (!prevItem) {
        // Es la línea base o primer registro histórico de ese organismo
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
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {fields.map((f, i) => {
                const yes = normalize(f.val) === 'Si';
                return (
                  <div key={i} className="flex items-center justify-between text-xs p-2 rounded bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850/60">
                    <span className="text-slate-500 dark:text-slate-400 font-medium truncate mr-1" title={f.label}>
                      {f.label}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      yes 
                        ? 'bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400' 
                        : 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
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

      // Comparar con el anterior
      const prevSnap = JSON.parse(prevItem.snapshot);
      const changes = getDiffs(currentSnap, prevSnap);

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
                      : 'bg-rose-100 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
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
      return <div className="text-xs text-rose-500 mt-2">Error al analizar los cambios de esta versión.</div>;
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-12 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl min-h-[300px]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500 mb-3" />
        <span className="text-sm text-slate-500 font-semibold">Cargando bitácora de actividad general...</span>
      </div>
    );
  }

  const filteredHistory = history.filter(item => 
    item.organismoNombre.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.userId || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 text-left">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg flex items-center gap-2">
            <History className="h-5 w-5 text-blue-500" />
            Historial y Evolución General de Indicadores
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Auditoría interactiva en tiempo real de los cambios y digitalización del sector público.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Search bar */}
          <div className="relative w-full sm:w-64">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Search className="h-4 w-4" />
            </div>
            <input
              type="text"
              placeholder="Buscar por organismo o usuario..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 text-xs text-slate-700 dark:text-slate-350 focus:bg-white dark:focus:bg-slate-900 focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 outline-none transition"
            />
          </div>
          <button
            onClick={fetchHistory}
            className="p-2 text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-sm transition cursor-pointer flex items-center justify-center"
            title="Actualizar historial"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-sm">
          No hay registros de cambios en la base de datos todavía.
        </div>
      ) : filteredHistory.length === 0 ? (
        <div className="text-center py-12 text-slate-400 dark:text-slate-500 text-xs italic">
          No se encontraron registros de cambios que coincidan con tu búsqueda.
        </div>
      ) : (
        <div className="relative border-l border-slate-200 dark:border-slate-800 ml-4 space-y-6 py-2">
          {filteredHistory.map((item, idx) => (
            <div key={item.id} className="relative pl-6">
              {/* Timeline marker */}
              <div className="absolute -left-2 top-1.5 w-4 h-4 rounded-full bg-blue-100 dark:bg-blue-950 border-2 border-blue-500 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-500" />
              </div>

              {/* Event card */}
              <div className="bg-slate-50 dark:bg-slate-900/50 hover:bg-slate-100/50 dark:hover:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4 transition-all">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-850 dark:text-slate-100 text-sm">
                      {item.organismoNombre}
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span className="text-xs font-medium bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {item.userId || 'Usuario Local'}
                    </span>
                  </div>
                  <span className="text-xs text-slate-400 dark:text-slate-500 font-mono">
                    {new Date(item.createdAt).toLocaleString('es-AR')}
                  </span>
                </div>

                {renderSnapshotDetails(item, history.indexOf(item))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
