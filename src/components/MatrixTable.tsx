import React, { useState } from 'react';
import { Organismo } from '../types';
import { getMaturityGrade } from './OrganismoCard';
import { Check, X, Search, Info, HelpCircle, ExternalLink, Edit } from 'lucide-react';

const isValidUrl = (url: string | undefined): boolean => {
  if (!url) return false;
  const u = url.trim().toLowerCase();
  return u !== '' && u !== 'null' && u !== 's/d' && u !== '-' && u !== 'no tiene' && u !== 'no' && u !== 'sin datos';
};

const ensureAbsoluteUrl = (url: string | undefined): string => {
  if (!isValidUrl(url)) return '';
  const trimmed = url!.trim();
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

interface MatrixTableProps {
  organismos: Organismo[];
  onEdit?: (org: Organismo) => void;
}

export default function MatrixTable({ organismos, onEdit }: MatrixTableProps) {
  const [rowSearch, setRowSearch] = useState('');
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});

  const toggleReview = (orgId: number, colLabel: string) => {
    const key = `${orgId}-${colLabel}`;
    setExpandedReviews(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const columnsDef = [
    // Eje 1: Servicios Ciudadanos
    { 
      label: 'Trámites Online', 
      check: (o: Organismo) => o.tramitesOnline?.toLowerCase().trim() === 'tiene' || o.tramitesOnline?.toLowerCase().trim() === 'si' || o.tramitesOnline?.toLowerCase().trim() === 'sí',
      badgeColor: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40',
      headerBg: 'bg-cyan-50/80 dark:bg-cyan-950/30',
      renderDetails: (o: Organismo, isExpanded: boolean, onToggle: () => void) => (
        <div className="text-[10px] mt-1 space-y-0.5 text-slate-500">
          {o.qTramitesOnline ? <span className="font-semibold text-cyan-600 dark:text-cyan-400 block">{o.qTramitesOnline} tráms</span> : null}
          {isValidUrl(o.enlaceTramitesOnline) && (
            <a href={ensureAbsoluteUrl(o.enlaceTramitesOnline)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-cyan-500 hover:underline">
              <span>Enlace</span> <ExternalLink className="h-2 w-2" />
            </a>
          )}
        </div>
      )
    },
    { 
      label: 'Guía de Trámites', 
      check: (o: Organismo) => o.guiaTramites?.toLowerCase().trim() === 'tiene' || o.guiaTramites?.toLowerCase().trim() === 'si' || o.guiaTramites?.toLowerCase().trim() === 'sí',
      badgeColor: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40',
      headerBg: 'bg-cyan-50/80 dark:bg-cyan-950/30',
      renderDetails: (o: Organismo, isExpanded: boolean, onToggle: () => void) => (
        <div className="text-[10px] mt-1 space-y-0.5 text-slate-500">
          {o.qTramitesGuia ? <span className="font-semibold text-cyan-600 dark:text-cyan-400 block">{o.qTramitesGuia} tráms</span> : null}
          {isValidUrl(o.enlaceGuia) && (
            <a href={ensureAbsoluteUrl(o.enlaceGuia)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-cyan-500 hover:underline">
              <span>Enlace</span> <ExternalLink className="h-2 w-2" />
            </a>
          )}
        </div>
      )
    },
    { 
      label: 'Turnos Online', 
      check: (o: Organismo) => o.turnosOnline?.toLowerCase().trim() === 'tiene' || o.turnosOnline?.toLowerCase().trim() === 'si' || o.turnosOnline?.toLowerCase().trim() === 'sí',
      badgeColor: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40',
      headerBg: 'bg-cyan-50/80 dark:bg-cyan-950/30',
      renderDetails: (o: Organismo, isExpanded: boolean, onToggle: () => void) => isValidUrl(o.enlaceTurnosOnline) ? (
        <a href={ensureAbsoluteUrl(o.enlaceTurnosOnline)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-cyan-500 hover:underline mt-1">
          <span>Turnero</span> <ExternalLink className="h-2.5 w-2.5" />
        </a>
      ) : null
    },
    { 
      label: 'Seguimiento Digital', 
      check: (o: Organismo) => o.seguimientoTramites?.toLowerCase().trim() === 'tiene' || o.seguimientoTramites?.toLowerCase().trim() === 'si' || o.seguimientoTramites?.toLowerCase().trim() === 'sí',
      badgeColor: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40',
      headerBg: 'bg-cyan-50/80 dark:bg-cyan-950/30',
    },
    { 
      label: 'Atención Digital', 
      check: (o: Organismo) => o.atencionDigital?.toLowerCase().trim() === 'tiene' || o.atencionDigital?.toLowerCase().trim() === 'si' || o.atencionDigital?.toLowerCase().trim() === 'sí',
      badgeColor: 'bg-cyan-50 dark:bg-cyan-950/20 text-cyan-700 dark:text-cyan-400 border-cyan-200 dark:border-cyan-800/40',
      headerBg: 'bg-cyan-50/80 dark:bg-cyan-950/30',
    },
    // Eje 2: Eficiencia Interna
    { 
      label: 'Expediente Digital', 
      check: (o: Organismo) => o.expedienteDigital?.toLowerCase().trim() === 'tiene' || o.expedienteDigital?.toLowerCase().trim() === 'si' || o.expedienteDigital?.toLowerCase().trim() === 'sí',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
      headerBg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    },
    { 
      label: 'Tienen Firma Digital', 
      check: (o: Organismo) => o.firmaDigital?.toLowerCase().trim() === 'tiene' || o.firmaDigital?.toLowerCase().trim() === 'si' || o.firmaDigital?.toLowerCase().trim() === 'sí',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
      headerBg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
      renderDetails: (o: Organismo, isExpanded: boolean, onToggle: () => void) => o.resenaFirma ? (
        <div className="flex flex-col items-center">
          <button
            onClick={onToggle}
            className="mt-1 text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
          >
            {isExpanded ? 'Ocultar nota' : 'Ver nota'}
          </button>
          {isExpanded && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1.5 leading-tight max-w-[160px] mx-auto whitespace-normal bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded border border-slate-150 dark:border-slate-800/60 shadow-sm animate-fadeIn">
              "{o.resenaFirma}"
            </p>
          )}
        </div>
      ) : null
    },
    { 
      label: 'Contratado Doco', 
      check: (o: Organismo) => o.tieneDoco?.toLowerCase().trim() === 'tiene' || o.tieneDoco?.toLowerCase().trim() === 'si' || o.tieneDoco?.toLowerCase().trim() === 'sí',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
      headerBg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
    },
    { 
      label: 'Uso de SiiF', 
      check: (o: Organismo) => o.usaSiif?.toLowerCase().trim() === 'tiene' || o.usaSiif?.toLowerCase().trim() === 'si' || o.usaSiif?.toLowerCase().trim() === 'sí',
      badgeColor: 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800/40',
      headerBg: 'bg-emerald-50/80 dark:bg-emerald-950/30',
      renderDetails: (o: Organismo, isExpanded: boolean, onToggle: () => void) => o.resenaSiif ? (
        <div className="flex flex-col items-center">
          <button
            onClick={onToggle}
            className="mt-1 text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
          >
            {isExpanded ? 'Ocultar nota' : 'Ver nota'}
          </button>
          {isExpanded && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1.5 leading-tight max-w-[160px] mx-auto whitespace-normal bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded border border-slate-150 dark:border-slate-800/60 shadow-sm animate-fadeIn">
              "{o.resenaSiif}"
            </p>
          )}
        </div>
      ) : null
    },
    // Eje 3: Identidad Web
    { 
      label: 'Sitio Web Oficial', 
      check: (o: Organismo) => o.tieneWeb,
      badgeColor: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40',
      headerBg: 'bg-indigo-50/80 dark:bg-indigo-950/30',
      renderDetails: (o: Organismo, isExpanded: boolean, onToggle: () => void) => isValidUrl(o.enlaceWebGov) ? (
        <a href={ensureAbsoluteUrl(o.enlaceWebGov)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-indigo-500 hover:underline mt-1">
          <span>Portal</span> <ExternalLink className="h-2 w-2" />
        </a>
      ) : null
    },
    { 
      label: 'Sitio Web Propio', 
      check: (o: Organismo) => o.tieneWebPropia,
      badgeColor: 'bg-indigo-50 dark:bg-indigo-950/20 text-indigo-700 dark:text-indigo-400 border-indigo-200 dark:border-indigo-800/40',
      headerBg: 'bg-indigo-50/80 dark:bg-indigo-950/30',
      renderDetails: (o: Organismo, isExpanded: boolean, onToggle: () => void) => isValidUrl(o.enlaceWebPropia) ? (
        <a href={ensureAbsoluteUrl(o.enlaceWebPropia)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-0.5 text-[10px] text-indigo-500 hover:underline mt-1">
          <span>Propio</span> <ExternalLink className="h-2 w-2" />
        </a>
      ) : null
    },
    // Eje 4: Innovación y Procesos
    { 
      label: 'Análisis de Procesos', 
      check: (o: Organismo) => o.analisisProcesos?.toLowerCase().trim() === 'tiene' || o.analisisProcesos?.toLowerCase().trim() === 'hizo' || o.analisisProcesos?.toLowerCase().trim() === 'si' || o.analisisProcesos?.toLowerCase().trim() === 'sí',
      badgeColor: 'bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800/40',
      headerBg: 'bg-violet-50/80 dark:bg-violet-950/30',
    },
    { 
      label: 'IA en Procesos', 
      check: (o: Organismo) => o.usaIA,
      badgeColor: 'bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800/40',
      headerBg: 'bg-violet-50/80 dark:bg-violet-950/30',
      renderDetails: (o: Organismo, isExpanded: boolean, onToggle: () => void) => o.resenaIa ? (
        <div className="flex flex-col items-center">
          <button
            onClick={onToggle}
            className="mt-1 text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
          >
            {isExpanded ? 'Ocultar nota' : 'Ver nota'}
          </button>
          {isExpanded && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1.5 leading-tight max-w-[160px] mx-auto whitespace-normal bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded border border-slate-150 dark:border-slate-800/60 shadow-sm animate-fadeIn">
              "{o.resenaIa}"
            </p>
          )}
        </div>
      ) : null
    },
    { 
      label: 'Tiene Chatbot', 
      check: (o: Organismo) => o.chatbot,
      badgeColor: 'bg-violet-50 dark:bg-violet-950/20 text-violet-700 dark:text-violet-400 border-violet-200 dark:border-violet-800/40',
      headerBg: 'bg-violet-50/80 dark:bg-violet-950/30',
      renderDetails: (o: Organismo, isExpanded: boolean, onToggle: () => void) => o.chatbotResena ? (
        <div className="flex flex-col items-center">
          <button
            onClick={onToggle}
            className="mt-1 text-[9px] font-bold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 hover:underline cursor-pointer"
          >
            {isExpanded ? 'Ocultar nota' : 'Ver nota'}
          </button>
          {isExpanded && (
            <p className="text-[10px] text-slate-500 dark:text-slate-400 italic mt-1.5 leading-tight max-w-[160px] mx-auto whitespace-normal bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded border border-slate-150 dark:border-slate-800/60 shadow-sm animate-fadeIn">
              "{o.chatbotResena}"
            </p>
          )}
        </div>
      ) : null
    }
  ];

  // Filtrar organismos por nombre (filas)
  const filteredOrganismos = organismos.filter(o =>
    o.nombre.toLowerCase().includes(rowSearch.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg">
            Matriz Comparativa de Capacidades Digitales
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Organismos gubernamentales en las filas y variables reguladas en las columnas, con reseñas detalladas en la misma fila.
          </p>
        </div>
        
        {/* Búsqueda de Organismos (Filas) */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500"
            placeholder="Filtrar organismos..."
            value={rowSearch}
            onChange={(e) => setRowSearch(e.target.value)}
          />
          <Search className="absolute left-2.5 top-2.2 h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
        </div>
      </div>

      {organismos.length === 0 ? (
        <div className="text-center py-8 text-slate-400 dark:text-slate-500 text-sm">
          No hay datos de organismos para renderizar la matriz.
        </div>
      ) : (
        <div className="relative overflow-x-auto rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm bg-white dark:bg-slate-900">
          <table className="w-full text-xs text-center border-separate border-spacing-0">
            <thead className="sticky top-0 z-30 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300">
              <tr>
                {/* Primera columna: Nombre del Organismo */}
                <th className="sticky left-0 z-40 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold px-4 py-3 border-b border-r border-slate-200 dark:border-slate-800 text-left min-w-[240px] max-w-[240px] shadow-[3px_0_6px_rgba(0,0,0,0.05)] dark:shadow-[3px_0_6px_rgba(0,0,0,0.2)]">
                  Organismo / Institución
                </th>
                {/* Columnas dinámicas: Variables del IMDP */}
                {columnsDef.map((col, idx) => (
                  <th 
                    key={idx} 
                    className={`px-3 py-3 border-b border-r border-slate-200 dark:border-slate-800 font-bold min-w-[160px] max-w-[190px] text-center ${col.headerBg}`}
                  >
                    <div className="text-[11px] font-bold text-slate-800 dark:text-slate-200 leading-tight">
                      {col.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredOrganismos.map((org, i) => {
                const score = getMaturityGrade(org);
                return (
                  <tr key={i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                    {/* Celda del Organismo (Sticky Left) */}
                    <td className="sticky left-0 z-20 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-800 text-left min-w-[240px] max-w-[240px] shadow-[3px_0_6px_rgba(0,0,0,0.05)] dark:shadow-[3px_0_6px_rgba(0,0,0,0.2)] p-3">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-start justify-between gap-1">
                          <span className="font-semibold text-slate-800 dark:text-slate-200 leading-tight text-xs block pr-4">
                            {org.nombre}
                          </span>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(org)}
                              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-250 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer shrink-0"
                              title={`Editar ${org.nombre}`}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500">
                            {org.tipo || 'Organismo'}
                          </span>
                          <span className="text-[10px] font-bold font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded">
                            {score}%
                          </span>
                        </div>
                      </div>
                    </td>

                    {/* Celdas de Capacidades y Reseñas */}
                    {columnsDef.map((col, idx) => {
                      const ok = col.check(org);
                      return (
                        <td
                          key={idx}
                          className={`p-3 border-b border-r border-slate-200 dark:border-slate-800 transition-colors ${
                            ok
                              ? 'bg-emerald-500/[0.04] dark:bg-emerald-500/[0.02]'
                              : 'bg-rose-500/[0.02] dark:bg-rose-500/[0.01]'
                          }`}
                        >
                          <div className="flex flex-col items-center justify-center w-full min-h-[45px]">
                            {ok ? (
                              <>
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                                  <Check className="h-3 w-3 shrink-0" />
                                  <span>SÍ</span>
                                </span>
                                {col.renderDetails && col.renderDetails(
                                  org,
                                  !!expandedReviews[`${org.id}-${col.label}`],
                                  () => toggleReview(org.id, col.label)
                                )}

                              </>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/40 px-2 py-0.5 rounded">
                                <X className="h-3 w-3 shrink-0" />
                                <span>NO</span>
                              </span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Info and Weighting Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Navigation Info */}
        <div className="flex items-start gap-2.5 bg-blue-50/50 dark:bg-slate-950/30 border border-blue-100 dark:border-slate-800/80 p-4 rounded-xl text-xs text-slate-700 dark:text-slate-300 shadow-sm">
          <Info className="h-4.5 w-4.5 text-blue-500 shrink-0 mt-0.5" />
          <div>
            <h5 className="font-semibold text-blue-900 dark:text-blue-400 mb-1">Visualización horizontal y vertical</h5>
            <p className="leading-relaxed">
              Puedes desplazarte horizontalmente para ver todas las variables digitales y verticalmente por toda la página para recorrer los 41 organismos. La primera columna con el nombre de cada institución permanecerá visible en todo momento.
            </p>
          </div>
        </div>

        {/* Maturity Weighting Legend */}
        <div className="flex items-start gap-2.5 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-800/80 p-4 rounded-xl text-xs text-slate-700 dark:text-slate-300 shadow-sm">
          <HelpCircle className="h-4.5 w-4.5 text-indigo-500 shrink-0 mt-0.5" />
          <div className="w-full">
            <h5 className="font-semibold text-slate-900 dark:text-slate-200 mb-1.5 flex items-center gap-1.5">
              Criterio de Ponderación (Índice de Madurez)
            </h5>
            <p className="leading-relaxed mb-3 text-slate-550 dark:text-slate-400">
              El porcentaje de madurez digital de cada organismo se calcula de forma automatizada distribuyendo 100 puntos en base a las siguientes capacidades activas:
            </p>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded px-2">
                <span className="font-medium">Trámites Online</span>
                <span className="font-bold text-blue-600 dark:text-blue-400 font-mono">20%</span>
              </div>
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded px-2">
                <span className="font-medium">Sitio Web Oficial</span>
                <span className="font-bold text-slate-650 dark:text-slate-400 font-mono">10%</span>
              </div>
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded px-2">
                <span className="font-medium">Sitio Web Propio</span>
                <span className="font-bold text-slate-550 dark:text-slate-550 font-mono">5%</span>
              </div>
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded px-2">
                <span className="font-medium">Guía de Trámites</span>
                <span className="font-bold text-slate-650 dark:text-slate-400 font-mono">10%</span>
              </div>
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded px-2">
                <span className="font-medium">Expediente Digital</span>
                <span className="font-bold text-slate-650 dark:text-slate-400 font-mono">10%</span>
              </div>
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded px-2">
                <span className="font-medium">Tienen Firma Digital</span>
                <span className="font-bold text-slate-650 dark:text-slate-400 font-mono">10%</span>
              </div>
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded px-2">
                <span className="font-medium">Turnos Online</span>
                <span className="font-bold text-slate-550 dark:text-slate-550 font-mono">5%</span>
              </div>
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded px-2">
                <span className="font-medium">Seguimiento Trám.</span>
                <span className="font-bold text-slate-550 dark:text-slate-500 font-mono">5%</span>
              </div>
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded px-2">
                <span className="font-medium">Atención Digital</span>
                <span className="font-bold text-slate-550 dark:text-slate-550 font-mono">5%</span>
              </div>
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded px-2">
                <span className="font-medium">Contratado Doco / SiiF</span>
                <span className="font-bold text-slate-550 dark:text-slate-550 font-mono">5% c/u</span>
              </div>
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded col-span-2 px-2">
                <span className="font-medium">Tienen IA en sus procesos o Chatbot / Analisis de Procesos con Gcia. Innovacion</span>
                <span className="font-bold text-slate-550 dark:text-slate-500 font-mono">5% c/u</span>
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}

