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
  const [columnSearch, setColumnSearch] = useState('');

  const variables = [
    { label: 'Sitio Web General', check: (o: Organismo) => o.tieneWeb },
    { label: 'Dominio Propio (Indep.)', check: (o: Organismo) => o.tieneWebPropia },
    { label: 'Guía de Trámites', check: (o: Organismo) => o.guiaTramites?.toLowerCase().trim() === 'tiene' || o.guiaTramites?.toLowerCase().trim() === 'si' || o.guiaTramites?.toLowerCase().trim() === 'sí' },
    { label: 'Tramites Online', check: (o: Organismo) => o.tramitesOnline?.toLowerCase().trim() === 'tiene' || o.tramitesOnline?.toLowerCase().trim() === 'si' || o.tramitesOnline?.toLowerCase().trim() === 'sí' },
    { label: 'Turnos Online', check: (o: Organismo) => o.turnosOnline?.toLowerCase().trim() === 'tiene' || o.turnosOnline?.toLowerCase().trim() === 'si' || o.turnosOnline?.toLowerCase().trim() === 'sí' },
    { label: 'Expediente Digital', check: (o: Organismo) => o.expedienteDigital?.toLowerCase().trim() === 'tiene' || o.expedienteDigital?.toLowerCase().trim() === 'si' || o.expedienteDigital?.toLowerCase().trim() === 'sí' },
    { label: 'Seguimiento Digital', check: (o: Organismo) => o.seguimientoTramites?.toLowerCase().trim() === 'tiene' || o.seguimientoTramites?.toLowerCase().trim() === 'si' || o.seguimientoTramites?.toLowerCase().trim() === 'sí' },
    { label: 'Atención Digital', check: (o: Organismo) => o.atencionDigital?.toLowerCase().trim() === 'tiene' || o.atencionDigital?.toLowerCase().trim() === 'si' || o.atencionDigital?.toLowerCase().trim() === 'sí' },
    { label: 'Tienen Firma Digital', check: (o: Organismo) => o.firmaDigital?.toLowerCase().trim() === 'tiene' || o.firmaDigital?.toLowerCase().trim() === 'si' || o.firmaDigital?.toLowerCase().trim() === 'sí' },
    { label: 'Analisis de Procesos con Gcia. Innovacion', check: (o: Organismo) => o.analisisProcesos?.toLowerCase().trim() === 'tiene' || o.analisisProcesos?.toLowerCase().trim() === 'hizo' || o.analisisProcesos?.toLowerCase().trim() === 'si' || o.analisisProcesos?.toLowerCase().trim() === 'sí' },
    { label: 'Contratado Doco', check: (o: Organismo) => o.tieneDoco?.toLowerCase().trim() === 'tiene' || o.tieneDoco?.toLowerCase().trim() === 'si' || o.tieneDoco?.toLowerCase().trim() === 'sí' },
    { label: 'Usan SiiF', check: (o: Organismo) => o.usaSiif?.toLowerCase().trim() === 'tiene' || o.usaSiif?.toLowerCase().trim() === 'si' || o.usaSiif?.toLowerCase().trim() === 'sí' },
    { label: 'Tienen IA en sus procesos', check: (o: Organismo) => o.usaIA },
    { label: 'Chatbot Integrado', check: (o: Organismo) => o.chatbot }
  ];

  // Filter columns (organismos) by search input if needed
  const filteredOrganismos = organismos.filter(o =>
    o.nombre.toLowerCase().includes(columnSearch.toLowerCase())
  );

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div>
          <h3 className="font-display font-bold text-slate-800 dark:text-slate-100 text-lg">
            Matriz Comparativa de Capacidades Digitales
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Vista horizontal completa de variables reguladas de digitalización pública.
          </p>
        </div>
        
        {/* Sub-Búsqueda de Columnas */}
        <div className="relative w-full sm:w-64">
          <input
            type="text"
            className="w-full pl-8 pr-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-xs focus:outline-none focus:ring-1.5 focus:ring-blue-500"
            placeholder="Filtrar organismos en matriz..."
            value={columnSearch}
            onChange={(e) => setColumnSearch(e.target.value)}
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
                <th className="sticky left-0 z-40 bg-slate-100 dark:bg-slate-900 text-slate-800 dark:text-slate-200 font-bold px-4 py-3 border-b border-r border-slate-200 dark:border-slate-800 text-left min-w-[220px] max-w-[220px] shadow-[3px_0_6px_rgba(0,0,0,0.05)] dark:shadow-[3px_0_6px_rgba(0,0,0,0.2)]">
                  Variable de Digitalización
                </th>
                {filteredOrganismos.map((org, i) => {
                  const score = getMaturityGrade(org);
                  return (
                    <th key={i} className="px-3 py-3 border-b border-r border-slate-200 dark:border-slate-800 font-bold min-w-[170px] max-w-[210px] truncate group bg-slate-50 dark:bg-slate-950 relative">
                      <div className="flex flex-col items-center gap-1.5 w-full">
                        <div className="flex items-center justify-center gap-1 w-full px-1">
                          <span className="truncate block text-[13px] text-slate-800 dark:text-slate-200" title={org.nombre}>
                            {org.nombre}
                          </span>
                          {onEdit && (
                            <button
                              onClick={() => onEdit(org)}
                              className="p-1 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-md transition-colors cursor-pointer shrink-0"
                              title={`Editar ${org.nombre}`}
                            >
                              <Edit className="h-3.5 w-3.5" />
                            </button>
                          )}
                        </div>
                        <span className="text-xs font-bold font-mono bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded shadow-sm">
                          {score}% madurez
                        </span>
                      </div>
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {variables.map((v, idx) => (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                  <td className="sticky left-0 z-20 bg-white dark:bg-slate-900 font-semibold px-4 py-3 border-b border-r border-slate-200 dark:border-slate-800 text-left min-w-[220px] max-w-[220px] text-slate-700 dark:text-slate-300 shadow-[3px_0_6px_rgba(0,0,0,0.05)] dark:shadow-[3px_0_6px_rgba(0,0,0,0.2)]">
                    <span>{v.label}</span>
                  </td>
                  {filteredOrganismos.map((org, i) => {
                    const ok = v.check(org);
                    return (
                      <td
                        key={i}
                        className={`p-2 border-b border-r border-slate-200 dark:border-slate-800 transition-colors ${
                          ok
                            ? 'bg-emerald-500/10 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 font-bold'
                            : 'bg-rose-500/5 dark:bg-rose-500/2 text-rose-500/70'
                        }`}
                      >
                        <div className="flex items-center justify-center gap-1">
                           {ok ? (
                            v.label === 'Dominio Propio (Indep.)' && isValidUrl(org.enlaceWebPropia) ? (
                              <a
                                href={ensureAbsoluteUrl(org.enlaceWebPropia)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded cursor-pointer transition"
                                title={`Visitar sitio propio de ${org.nombre}`}
                              >
                                <Check className="h-3 w-3 shrink-0" />
                                <span>Sí</span>
                                <ExternalLink className="h-2.5 w-2.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              </a>
                            ) : v.label === 'Sitio Web General' && isValidUrl(org.enlaceWebGov) ? (
                              <a
                                href={ensureAbsoluteUrl(org.enlaceWebGov)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 bg-emerald-100 hover:bg-emerald-200 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-400 font-bold px-1.5 py-0.5 rounded cursor-pointer transition"
                                title={`Ver en Portal de Gobierno para ${org.nombre}`}
                              >
                                <Check className="h-3 w-3 shrink-0" />
                                <span>Sí</span>
                                <ExternalLink className="h-2.5 w-2.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
                              </a>
                            ) : (
                              <>
                                <Check className="h-3.5 w-3.5 bg-emerald-100 dark:bg-emerald-950/40 rounded-full p-0.5" />
                                <span>Sí</span>
                              </>
                            )
                          ) : (
                            <>
                              <X className="h-3.5 w-3.5 bg-rose-100 dark:bg-rose-950/40 rounded-full p-0.5" />
                              <span>No</span>
                            </>
                          )}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))}
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
            <h5 className="font-semibold text-blue-900 dark:text-blue-400 mb-1">Navegación horizontal fluida</h5>
            <p className="leading-relaxed">
              Puedes arrastrar horizontalmente con el botón central del mouse o deslizar con dos dedos en touchpads para recorrer los distintos organismos de la matriz comparativa de capacidades digitales.
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
                <span className="font-bold text-slate-550 dark:text-slate-500 font-mono">5%</span>
              </div>
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded px-2">
                <span className="font-medium">Seguimiento Trám.</span>
                <span className="font-bold text-slate-550 dark:text-slate-500 font-mono">5%</span>
              </div>
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded px-2">
                <span className="font-medium">Atención Digital</span>
                <span className="font-bold text-slate-550 dark:text-slate-500 font-mono">5%</span>
              </div>
              <div className="flex items-center justify-between p-1 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800/50 rounded px-2">
                <span className="font-medium">Contratado Doco / SiiF</span>
                <span className="font-bold text-slate-550 dark:text-slate-500 font-mono">5% c/u</span>
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
