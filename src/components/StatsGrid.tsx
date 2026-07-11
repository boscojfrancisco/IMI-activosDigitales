import React from 'react';
import { Stats, FilterState } from '../types';
import { Globe, BookOpen, Laptop, CalendarCheck, FileSpreadsheet, Bot, Eye, X, Link } from 'lucide-react';

interface StatsGridProps {
  stats: Stats;
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  onResetFilters: () => void;
  staleCount: number;
}

export default function StatsGrid({ stats, filters, setFilters, onResetFilters, staleCount }: StatsGridProps) {
  // Check if any filter is active currently
  const isAnyFilterActive = 
    filters.tipo !== 'ALL' || 
    filters.search.trim() !== '' || 
    filters.tieneWeb || 
    filters.tieneWebPropia || 
    filters.guiaTramites || 
    filters.tramitesOnline || 
    filters.turnosOnline || 
    filters.expedienteDigital || 
    filters.usaIAOrChatbot ||
    filters.staleOnly;

  const cards = [
    {
      title: 'Total Organismos',
      value: stats.total,
      percentage: 'Todos',
      icon: Eye,
      color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40',
      description: isAnyFilterActive ? 'Haga clic para limpiar' : 'Entes en el monitor',
      filterKey: 'clear',
      isActive: isAnyFilterActive,
      activeStyles: 'border-blue-500/70 dark:border-blue-400 ring-2 ring-blue-500/20 bg-blue-50/60 dark:bg-blue-950/40 shadow-blue-100/30 dark:shadow-none',
      tooltip: isAnyFilterActive ? 'Restablecer todos los filtros y ver todos los organismos' : 'Mostrando todos los organismos'
    },
    {
      title: 'Portal Web',
      value: stats.conWeb,
      percentage: `${stats.total > 0 ? Math.round((stats.conWeb / stats.total) * 100) : 0}%`,
      icon: Globe,
      color: 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40',
      description: 'en corrientes.gob.ar',
      filterKey: 'tieneWeb',
      isActive: filters.tieneWeb,
      activeStyles: 'border-emerald-500 dark:border-emerald-400 ring-2 ring-emerald-500/20 bg-emerald-50/60 dark:bg-emerald-950/40 shadow-emerald-100/30 dark:shadow-none',
      tooltip: filters.tieneWeb ? 'Quitar filtro: Portal Web' : 'Filtrar por: Con Portal Web'
    },
    {
      title: 'Web Propia',
      value: stats.conWebPropia,
      percentage: `${stats.total > 0 ? Math.round((stats.conWebPropia / stats.total) * 100) : 0}%`,
      icon: Link,
      color: 'text-teal-600 dark:text-teal-400 bg-teal-50 dark:bg-teal-950/40',
      description: 'Enlaces externos web',
      filterKey: 'tieneWebPropia',
      isActive: filters.tieneWebPropia,
      activeStyles: 'border-teal-500 dark:border-teal-400 ring-2 ring-teal-500/20 bg-teal-50/60 dark:bg-teal-950/40 shadow-teal-100/30 dark:shadow-none',
      tooltip: filters.tieneWebPropia ? 'Quitar filtro: Web Propia' : 'Filtrar por: Con Web Propia'
    },
    {
      title: 'Guía de Trámites',
      value: stats.conGuia,
      percentage: `${stats.total > 0 ? Math.round((stats.conGuia / stats.total) * 100) : 0}%`,
      icon: BookOpen,
      color: 'text-violet-600 dark:text-violet-400 bg-violet-50 dark:bg-violet-950/40',
      description: 'Listado de requisitos',
      filterKey: 'guiaTramites',
      isActive: filters.guiaTramites,
      activeStyles: 'border-violet-500 dark:border-violet-400 ring-2 ring-violet-500/20 bg-violet-50/60 dark:bg-violet-950/40 shadow-violet-100/30 dark:shadow-none',
      tooltip: filters.guiaTramites ? 'Quitar filtro: Guía de Trámites' : 'Filtrar por: Con Guía de Trámites'
    },
    {
      title: 'Tramites Online',
      value: stats.conTramitesOnline,
      percentage: `${stats.total > 0 ? Math.round((stats.conTramitesOnline / stats.total) * 100) : 0}%`,
      icon: Laptop,
      color: 'text-cyan-600 dark:text-cyan-400 bg-cyan-100 dark:bg-cyan-950/40',
      description: 'Digitalizados fin-a-fin',
      filterKey: 'tramitesOnline',
      isActive: filters.tramitesOnline,
      activeStyles: 'border-cyan-500 dark:border-cyan-400 ring-2 ring-cyan-500/20 bg-cyan-50/60 dark:bg-cyan-950/40 shadow-cyan-100/30 dark:shadow-none',
      tooltip: filters.tramitesOnline ? 'Quitar filtro: Tramites Online' : 'Filtrar por: Con Tramites Online'
    },
    {
      title: 'Turnos Online',
      value: stats.conTurnosOnline,
      percentage: `${stats.total > 0 ? Math.round((stats.conTurnosOnline / stats.total) * 100) : 0}%`,
      icon: CalendarCheck,
      color: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40',
      description: 'Reserva digital/Turnero',
      filterKey: 'turnosOnline',
      isActive: filters.turnosOnline,
      activeStyles: 'border-amber-500 dark:border-amber-400 ring-2 ring-amber-500/20 bg-amber-50/60 dark:bg-amber-950/40 shadow-amber-100/30 dark:shadow-none',
      tooltip: filters.turnosOnline ? 'Quitar filtro: Turnos Online' : 'Filtrar por: Con Turnos Online'
    },
    {
      title: 'Expediente Digital',
      value: stats.conExpedienteDigital,
      percentage: `${stats.total > 0 ? Math.round((stats.conExpedienteDigital / stats.total) * 100) : 0}%`,
      icon: FileSpreadsheet,
      color: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/40',
      description: 'Sistemas cero papel',
      filterKey: 'expedienteDigital',
      isActive: filters.expedienteDigital,
      activeStyles: 'border-indigo-500 dark:border-indigo-400 ring-2 ring-indigo-500/20 bg-indigo-50/60 dark:bg-indigo-950/40 shadow-indigo-100/30 dark:shadow-none',
      tooltip: filters.expedienteDigital ? 'Quitar filtro: Expediente Digital' : 'Filtrar por: Con Expediente Digital'
    },
    {
      title: 'Uso de IA / Chatbot',
      value: stats.conChatbotOrIA,
      percentage: `${stats.total > 0 ? Math.round((stats.conChatbotOrIA / stats.total) * 100) : 0}%`,
      icon: Bot,
      color: 'text-fuchsia-600 dark:text-fuchsia-400 bg-fuchsia-50 dark:bg-fuchsia-950/40',
      description: 'Soporte inteligente',
      filterKey: 'usaIAOrChatbot',
      isActive: filters.usaIAOrChatbot,
      activeStyles: 'border-fuchsia-500 dark:border-fuchsia-400 ring-2 ring-fuchsia-500/20 bg-fuchsia-50/60 dark:bg-fuchsia-950/40 shadow-fuchsia-100/30 dark:shadow-none',
      tooltip: filters.usaIAOrChatbot ? 'Quitar filtro: Uso de IA/Chatbot' : 'Filtrar por: Con Inteligencia Artificial o Chatbot'
    }
  ];

  const handleCardClick = (filterKey: string) => {
    if (filterKey === 'clear') {
      onResetFilters();
    } else {
      setFilters(prev => ({
        ...prev,
        [filterKey]: !prev[filterKey as keyof FilterState]
      }));
    }
  };

  return (
    <div id="statsGrid" className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-8">
      {staleCount > 0 && (
        <div className="col-span-2 md:col-span-4 lg:col-span-8 flex items-center justify-between p-3.5 bg-amber-50 dark:bg-amber-955/20 border border-amber-250 dark:border-amber-900/30 rounded-2xl text-xs text-amber-800 dark:text-amber-300 shadow-sm animate-pulse-subtle">
          <div className="flex items-center gap-2">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-ping" />
            <span>
              Hay <strong>{staleCount}</strong> organismo(s) con datos sin actualizar por más de 90 días (Revisión Pendiente).
            </span>
          </div>
          <button
            onClick={() => setFilters(prev => ({ ...prev, staleOnly: !prev.staleOnly }))}
            className={`px-3 py-1.5 bg-amber-100 hover:bg-amber-200 dark:bg-amber-900/50 dark:hover:bg-amber-800 text-[11px] font-bold rounded-lg transition cursor-pointer select-none border border-amber-300 dark:border-amber-800 flex items-center gap-1.5 ${
              filters.staleOnly ? 'ring-2 ring-amber-500/30 bg-amber-200 dark:bg-amber-800' : ''
            }`}
          >
            {filters.staleOnly ? 'Mostrar todos' : 'Filtrar desactualizados'}
          </button>
        </div>
      )}
      {cards.map((card, i) => {
        const isClickable = card.filterKey !== 'clear' || isAnyFilterActive;
        const outerClasses = card.isActive
          ? `border ${card.activeStyles}`
          : 'bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 hover:shadow-md';

        return (
          <button
            key={i}
            onClick={() => handleCardClick(card.filterKey)}
            title={card.tooltip}
            disabled={card.filterKey === 'clear' && !isAnyFilterActive}
            className={`w-full text-left rounded-2xl p-4 shadow-sm transition-all duration-200 flex flex-col justify-between select-none ${outerClasses} ${
              isClickable ? 'cursor-pointer hover:-translate-y-0.5 active:scale-[0.98]' : 'opacity-85'
            }`}
          >
            <div className="flex items-center justify-between mb-3 w-full">
              <div className={`p-2 rounded-xl transition-colors ${card.color}`}>
                <card.icon className="h-5 w-5 shrink-0" />
              </div>
              
              {card.filterKey === 'clear' && isAnyFilterActive ? (
                <span className="flex items-center gap-1 text-[10px] font-bold bg-rose-100 dark:bg-rose-950/40 text-rose-700 dark:text-rose-400 px-2 py-0.5 rounded-full ring-1 ring-rose-500/25 animate-pulse">
                  <X className="h-2.5 w-2.5 shrink-0" />
                  Limpiar
                </span>
              ) : (
                <span className={`text-xs font-mono font-semibold px-2 py-0.5 rounded-full transition-colors ${
                  card.isActive 
                    ? 'bg-slate-900 text-slate-100 dark:bg-slate-55 text-slate-50' 
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300'
                }`}>
                  {card.percentage}
                </span>
              )}
            </div>

            <div className="w-full">
              <div className="text-2xl font-extrabold font-mono tracking-tight text-slate-800 dark:text-slate-100">
                {card.value}
              </div>
              <div className="text-xs font-bold text-slate-700 dark:text-slate-300 mt-1 line-clamp-1 flex items-center gap-1">
                {card.isActive && card.filterKey !== 'clear' && (
                  <span className="h-1.5 w-1.5 rounded-full bg-current shrink-0 animate-ping" />
                )}
                <span>{card.title}</span>
              </div>
              <div className="text-[10px] text-slate-400 dark:text-slate-500 mt-0.5 line-clamp-1">
                {card.description}
              </div>
            </div>
          </button>
        );
      })}
    </div>
  );
}
