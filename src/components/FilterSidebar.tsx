import React from 'react';
import { FilterState } from '../types';
import { Search, SlidersHorizontal, RefreshCw, Download, Sparkles, Filter } from 'lucide-react';

interface FilterSidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  tiposDisponibles: string[];
  onReset: () => void;
  onExport: () => void;
  onRefresh: () => void;
  loading: boolean;
  sortBy: string;
  setSortBy: (val: string) => void;
}

export default function FilterSidebar({
  filters,
  setFilters,
  tiposDisponibles,
  onReset,
  onExport,
  onRefresh,
  loading,
  sortBy,
  setSortBy
}: FilterSidebarProps) {
  
  const handleCheckboxChange = (key: keyof FilterState) => {
    setFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  return (
    <aside className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-5 sticky top-6">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h3 className="font-display font-semibold text-slate-900 dark:text-slate-100 flex items-center gap-2">
          <Filter className="h-4 w-4 text-blue-500" />
          Filtros de Búsqueda
        </h3>
        <button
          onClick={onReset}
          className="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1 cursor-pointer"
        >
          Limpiar
        </button>
      </div>

      {/* Buscar */}
      <div className="space-y-1.5">
        <label htmlFor="searchInput" className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
          Búsqueda rápida
        </label>
        <div className="relative">
          <input
            id="searchInput"
            type="text"
            className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-slate-800 rounded-xl bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 max-h-12"
            placeholder="Ej: Ministerio de Salud..."
            value={filters.search}
            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
          />
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400 dark:text-slate-500" />
        </div>
      </div>


      {/* Filtros booleanos */}
      <div className="space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <span className="block text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
          Requisitos de digitalización
        </span>

        <div className="space-y-2.5">
          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              id="hasWebFilter"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 accent-blue-600 cursor-pointer"
              checked={filters.tieneWeb}
              onChange={() => handleCheckboxChange('tieneWeb')}
            />
            <span>Tiene Sitio Web Oficial</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              id="hasWebPropiaFilter"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 accent-blue-600 cursor-pointer"
              checked={filters.tieneWebPropia}
              onChange={() => handleCheckboxChange('tieneWebPropia')}
            />
            <span>Tiene Sitio Web Propio (Independiente)</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              id="hasOnlineGuias"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 accent-blue-600 cursor-pointer"
              checked={filters.guiaTramites}
              onChange={() => handleCheckboxChange('guiaTramites')}
            />
            <span>Guía de Trámites</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              id="hasOnlineForms"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 accent-blue-600 cursor-pointer"
              checked={filters.tramitesOnline}
              onChange={() => handleCheckboxChange('tramitesOnline')}
            />
            <span>Trámites Online</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              id="hasTurnosOnline"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 accent-blue-600 cursor-pointer"
              checked={filters.turnosOnline}
              onChange={() => handleCheckboxChange('turnosOnline')}
            />
            <span>Permite Turnos Online</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              id="hasExpedienteDigital"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 accent-blue-600 cursor-pointer"
              checked={filters.expedienteDigital}
              onChange={() => handleCheckboxChange('expedienteDigital')}
            />
            <span>Usa Expediente Digital</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              id="hasFirmaDigital"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 accent-blue-600 cursor-pointer"
              checked={filters.firmaDigital}
              onChange={() => handleCheckboxChange('firmaDigital')}
            />
            <span>Tienen Firma Digital</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              id="hasAnalisisProcesos"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 accent-blue-600 cursor-pointer"
              checked={filters.analisisProcesos}
              onChange={() => handleCheckboxChange('analisisProcesos')}
            />
            <span>Analisis de Procesos con Gcia. Innovacion</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              id="hasDoco"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 accent-blue-600 cursor-pointer"
              checked={filters.tieneDoco}
              onChange={() => handleCheckboxChange('tieneDoco')}
            />
            <span>Contratado Doco</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              id="usesSiif"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 accent-blue-600 cursor-pointer"
              checked={filters.usaSiif}
              onChange={() => handleCheckboxChange('usaSiif')}
            />
            <span>Usan SiiF</span>
          </label>

          <label className="flex items-center gap-2.5 cursor-pointer text-sm text-slate-700 dark:text-slate-300 select-none">
            <input
              type="checkbox"
              id="usesIA"
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-950 accent-blue-600 cursor-pointer"
              checked={filters.usaIAOrChatbot}
              onChange={() => handleCheckboxChange('usaIAOrChatbot')}
            />
            <span className="flex items-center gap-1.5">
              Tienen IA en sus procesos o Chatbot
              <Sparkles className="h-3.5 w-3.5 text-amber-500 animate-pulse" />
            </span>
          </label>
        </div>
      </div>

      {/* Utilidades de Acciones rápidas */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex flex-col gap-2">
        <button
          onClick={onRefresh}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs rounded-xl transition cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
          Sincronizar Planilla
        </button>

        <button
          onClick={onExport}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/40 text-blue-600 dark:text-blue-400 font-semibold text-xs rounded-xl transition cursor-pointer"
        >
          <Download className="h-3.5 w-3.5" />
          Exportar Datos (JSON)
        </button>
      </div>
    </aside>
  );
}
