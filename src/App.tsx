import React, { useState, useEffect, useMemo } from 'react';
import { Organismo, FilterState, Stats } from './types';
import { fetchOrganismos } from './utils/dataParser';
import StatsGrid from './components/StatsGrid';
import FilterSidebar from './components/FilterSidebar';
import OrganismoCard, { getMaturityGrade } from './components/OrganismoCard';
import MatrixTable from './components/MatrixTable';
import DigitalMaturityChart from './components/DigitalMaturityChart';
import OrganismoEditModal from './components/OrganismoEditModal';
import GeneralHistory from './components/GeneralHistory';
import { AnimatePresence, motion } from 'motion/react';
import { 
  Building2, 
  Moon, 
  Sun, 
  RefreshCw, 
  AlertCircle, 
  LayoutGrid, 
  Grid3X3, 
  BarChart3, 
  Sparkle,
  Github,
  Clock,
  ArrowRightCircle
} from 'lucide-react';

const INITIAL_FILTERS: FilterState = {
  search: '',
  tipo: 'ALL',
  tieneWeb: false,
  tieneWebPropia: false,
  guiaTramites: false,
  tramitesOnline: false,
  turnosOnline: false,
  expedienteDigital: false,
  usaIAOrChatbot: false,
  firmaDigital: false,
  analisisProcesos: false,
  tieneDoco: false,
  usaSiif: false
};

export default function App() {
  const [organismos, setOrganismos] = useState<Organismo[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // UI views and themes
  const [activeTab, setActiveTab] = useState<'matrix' | 'charts' | 'history'>('matrix');
  const [filters, setFilters] = useState<FilterState>(INITIAL_FILTERS);
  const [sortBy, setSortBy] = useState<string>('nombre_asc');
  const [editingOrg, setEditingOrg] = useState<Organismo | null>(null);
  const [isDark, setIsDark] = useState<boolean>(() => {
    // Check local storage or media preferences
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return false;
  });

  // Clock
  const [currentTime, setCurrentTime] = useState(new Date());

  // Apply visual theme class
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  // Live timer tick
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch initial data
  const loadData = async (isRef = false) => {
    if (isRef) setRefreshing(true);
    else setLoading(true);
    setError(null);
    try {
      const data = await fetchOrganismos();
      setOrganismos(data);
    } catch (err: any) {
      setError(err?.message || 'Ocurrió un error al rescatar los datos de Corrientes.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Derive unique organism types for the filter select
  const tiposDisponibles = useMemo(() => {
    const typesSet = new Set<string>();
    organismos.forEach(org => {
      if (org.tipo) typesSet.add(org.tipo);
    });
    return Array.from(typesSet).sort();
  }, [organismos]);

  // 1. Base list of organisms filtered ONLY by general text search and type dropdown
  const baseFilteredList = useMemo(() => {
    let result = [...organismos];

    // Text Search Filter
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase().trim();
      result = result.filter(org => org.nombre.toLowerCase().includes(q));
    }

    // Select Level/Type Filter
    if (filters.tipo !== 'ALL') {
      result = result.filter(org => org.tipo === filters.tipo);
    }

    return result;
  }, [organismos, filters.search, filters.tipo]);

  // Compute stats on the BASE FILTERED dataset (stable when clicking top-toggles)
  const currentStats = useMemo((): Stats => {
    let conWeb = 0;
    let conWebPropia = 0;
    let conGuia = 0;
    let conTramitesOnline = 0;
    let conTurnosOnline = 0;
    let conExpedienteDigital = 0;
    let conChatbotOrIA = 0;
    let conSeguimiento = 0;
    let conFirmaDigital = 0;
    let conAnalisisProcesos = 0;
    let conDoco = 0;
    let conSiif = 0;

    baseFilteredList.forEach(org => {
      if (org.tieneWeb) conWeb++;
      if (org.tieneWebPropia) conWebPropia++;
      if (org.guiaTramites?.toLowerCase().trim() === 'tiene' || org.guiaTramites?.toLowerCase().trim() === 'si' || org.guiaTramites?.toLowerCase().trim() === 'sí') conGuia++;
      if (org.tramitesOnline?.toLowerCase().trim() === 'tiene' || org.tramitesOnline?.toLowerCase().trim() === 'si' || org.tramitesOnline?.toLowerCase().trim() === 'sí') conTramitesOnline++;
      if (org.turnosOnline?.toLowerCase().trim() === 'tiene' || org.turnosOnline?.toLowerCase().trim() === 'si' || org.turnosOnline?.toLowerCase().trim() === 'sí') conTurnosOnline++;
      if (org.expedienteDigital?.toLowerCase().trim() === 'tiene' || org.expedienteDigital?.toLowerCase().trim() === 'si' || org.expedienteDigital?.toLowerCase().trim() === 'sí') conExpedienteDigital++;
      if (org.chatbot || org.usaIA) conChatbotOrIA++;
      if (org.seguimientoTramites?.toLowerCase().trim() === 'tiene' || org.seguimientoTramites?.toLowerCase().trim() === 'si' || org.seguimientoTramites?.toLowerCase().trim() === 'sí') conSeguimiento++;
      if (org.firmaDigital?.toLowerCase().trim() === 'tiene' || org.firmaDigital?.toLowerCase().trim() === 'si' || org.firmaDigital?.toLowerCase().trim() === 'sí') conFirmaDigital++;
      if (org.analisisProcesos?.toLowerCase().trim() === 'tiene' || org.analisisProcesos?.toLowerCase().trim() === 'hizo' || org.analisisProcesos?.toLowerCase().trim() === 'si' || org.analisisProcesos?.toLowerCase().trim() === 'sí') conAnalisisProcesos++;
      if (org.tieneDoco?.toLowerCase().trim() === 'tiene' || org.tieneDoco?.toLowerCase().trim() === 'si' || org.tieneDoco?.toLowerCase().trim() === 'sí') conDoco++;
      if (org.usaSiif?.toLowerCase().trim() === 'tiene' || org.usaSiif?.toLowerCase().trim() === 'si' || org.usaSiif?.toLowerCase().trim() === 'sí') conSiif++;
    });

    return {
      total: baseFilteredList.length,
      conWeb,
      conWebPropia,
      conGuia,
      conTramitesOnline,
      conTurnosOnline,
      conExpedienteDigital,
      conChatbotOrIA,
      conSeguimiento,
      conFirmaDigital,
      conAnalisisProcesos,
      conDoco,
      conSiif
    };
  }, [baseFilteredList]);

  // Process and filter data for the active list
  const filteredAndSortedList = useMemo(() => {
    let result = [...baseFilteredList];

    // Capability Toggle Filters
    if (filters.tieneWeb) {
      result = result.filter(org => org.tieneWeb);
    }
    if (filters.tieneWebPropia) {
      result = result.filter(org => org.tieneWebPropia);
    }
    if (filters.guiaTramites) {
      result = result.filter(org => org.guiaTramites?.toLowerCase().trim() === 'tiene' || org.guiaTramites?.toLowerCase().trim() === 'si' || org.guiaTramites?.toLowerCase().trim() === 'sí');
    }
    if (filters.tramitesOnline) {
      result = result.filter(org => org.tramitesOnline?.toLowerCase().trim() === 'tiene' || org.tramitesOnline?.toLowerCase().trim() === 'si' || org.tramitesOnline?.toLowerCase().trim() === 'sí');
    }
    if (filters.turnosOnline) {
      result = result.filter(org => org.turnosOnline?.toLowerCase().trim() === 'tiene' || org.turnosOnline?.toLowerCase().trim() === 'si' || org.turnosOnline?.toLowerCase().trim() === 'sí');
    }
    if (filters.expedienteDigital) {
      result = result.filter(org => org.expedienteDigital?.toLowerCase().trim() === 'tiene' || org.expedienteDigital?.toLowerCase().trim() === 'si' || org.expedienteDigital?.toLowerCase().trim() === 'sí');
    }
    if (filters.usaIAOrChatbot) {
      result = result.filter(org => org.usaIA || org.chatbot);
    }
    if (filters.firmaDigital) {
      result = result.filter(org => org.firmaDigital?.toLowerCase().trim() === 'tiene' || org.firmaDigital?.toLowerCase().trim() === 'si' || org.firmaDigital?.toLowerCase().trim() === 'sí');
    }
    if (filters.analisisProcesos) {
      result = result.filter(org => org.analisisProcesos?.toLowerCase().trim() === 'tiene' || org.analisisProcesos?.toLowerCase().trim() === 'hizo' || org.analisisProcesos?.toLowerCase().trim() === 'si' || org.analisisProcesos?.toLowerCase().trim() === 'sí');
    }
    if (filters.tieneDoco) {
      result = result.filter(org => org.tieneDoco?.toLowerCase().trim() === 'tiene' || org.tieneDoco?.toLowerCase().trim() === 'si' || org.tieneDoco?.toLowerCase().trim() === 'sí');
    }
    if (filters.usaSiif) {
      result = result.filter(org => org.usaSiif?.toLowerCase().trim() === 'tiene' || org.usaSiif?.toLowerCase().trim() === 'si' || org.usaSiif?.toLowerCase().trim() === 'sí');
    }

    // Sort algorithms
    result.sort((a, b) => {
      if (sortBy === 'nombre_asc') {
        return a.nombre.localeCompare(b.nombre);
      }
      if (sortBy === 'nombre_desc') {
        return b.nombre.localeCompare(a.nombre);
      }
      if (sortBy === 'matur_desc') {
        return getMaturityGrade(b) - getMaturityGrade(a) || a.nombre.localeCompare(b.nombre);
      }
      if (sortBy === 'matur_asc') {
        return getMaturityGrade(a) - getMaturityGrade(b) || a.nombre.localeCompare(b.nombre);
      }
      if (sortBy === 'tram_desc') {
        return (b.qTramitesGuia || 0) - (a.qTramitesGuia || 0) || a.nombre.localeCompare(b.nombre);
      }
      return 0;
    });

    return result;
  }, [baseFilteredList, filters, sortBy]);

  // Utility Actions
  const handleResetFilters = () => {
    setFilters(INITIAL_FILTERS);
    setSortBy('nombre_asc');
  };

  const handleExportDataJson = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(filteredAndSortedList, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `digitalizacion_corrientes_${new Date().toISOString().split('T')[0]}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200 antialiased font-sans pb-16">
      
      {/* Top Ambient glow accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[300px] bg-blue-500/10 dark:bg-blue-500/5 blur-[120px] pointer-events-none rounded-full" />
      <div className="absolute top-1/3 left-0 w-[400px] h-[300px] bg-violet-500/5 dark:bg-violet-500/2 blur-[100px] pointer-events-none rounded-full" />

      {/* Main Container */}
      <div id="appContainer" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* Navigation Bar / Top Header */}
        <header className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Building2 className="h-5.5 w-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-display font-extrabold text-lg sm:text-xl text-slate-900 dark:text-slate-50 tracking-tight">
                  Monitor de Digitalización Pública
                </h1>
                <span className="flex items-center gap-1 text-[10px] bg-emerald-100 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 font-bold px-2 py-0.5 rounded-full">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Corrientes
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Estado de digitalización y trámites de organismos provinciales en tiempo real.
              </p>
            </div>
          </div>

          {/* Quick Stats/Actions & Dark Toggle */}
          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* Clock Widget */}
            <div className="hidden md:flex items-center gap-2 px-3.5 py-1.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400 font-mono shadow-sm">
              <Clock className="h-3.5 w-3.5 text-blue-500 shrink-0" />
              <span>{currentTime.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
            </div>

            {/* Dark Mode toggle */}
            <button
              onClick={() => setIsDark(!isDark)}
              className="p-2.5 rounded-xl bg-white hover:bg-slate-100 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 transition shadow-sm cursor-pointer"
              title="Cambiar tema visual"
              aria-label="Toggle dark mode"
            >
              {isDark ? <Sun className="h-4 w-4 text-amber-500" /> : <Moon className="h-4 w-4 text-indigo-500" />}
            </button>
          </div>
        </header>

        {/* Loading Indicator */}
        {loading ? (
          <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3 py-16">
            <div className="h-10 w-10 border-3 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">
              Conectando con Google Sheets y descargando datos en vivo...
            </span>
          </div>
        ) : error ? (
          <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-2xl p-6 my-8 flex items-start gap-4 max-w-2xl mx-auto">
            <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
            <div className="space-y-2">
              <h3 className="font-semibold text-red-900 dark:text-red-300">Error al descargar datos</h3>
              <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
              <button
                onClick={() => loadData()}
                className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-semibold text-xs rounded-xl transition cursor-pointer"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                Reintentar Conexión
              </button>
            </div>
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Aggregate Stats Row */}
            <StatsGrid
              stats={currentStats}
              filters={filters}
              setFilters={setFilters}
              onResetFilters={handleResetFilters}
            />

            {/* Dashboard Workspace */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
              
              {/* Left Column - Filters Panel */}
              <div className="lg:col-span-1">
                <FilterSidebar
                  filters={filters}
                  setFilters={setFilters}
                  tiposDisponibles={tiposDisponibles}
                  onReset={handleResetFilters}
                  onExport={handleExportDataJson}
                  onRefresh={() => loadData(true)}
                  loading={refreshing}
                  sortBy={sortBy}
                  setSortBy={setSortBy}
                />
              </div>

              {/* Right Column - Results Display */}
              <div className="lg:col-span-3 space-y-6">
                
                {/* Tab Navigator & Filter Metainfo bar */}
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-2.5 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                  
                  {/* Sliding Tabs */}
                  <div className="flex bg-slate-100 dark:bg-slate-950 p-1 rounded-xl w-full sm:w-auto relative select-none">
                    <button
                      onClick={() => setActiveTab('matrix')}
                      className={`relative z-10 flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                        activeTab === 'matrix' ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Grid3X3 className="h-3.5 w-3.5" />
                      Matriz
                    </button>
                    <button
                      onClick={() => setActiveTab('charts')}
                      className={`relative z-10 flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                        activeTab === 'charts' ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <BarChart3 className="h-3.5 w-3.5" />
                      Métricas
                    </button>
                    <button
                      onClick={() => setActiveTab('history')}
                      className={`relative z-10 flex-1 sm:flex-initial px-4 py-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-2 transition cursor-pointer ${
                        activeTab === 'history' ? 'text-blue-600 dark:text-blue-400 bg-white dark:bg-slate-900 shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                      }`}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      Historial
                    </button>
                  </div>

                  {/* Results Count Summary */}
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 font-mono">
                    {filteredAndSortedList.length} de {organismos.length} organismos encontrados
                  </div>
                </div>

                {/* Sub-Views container based on Active Tab */}
                <div className="min-h-[400px]">
                  <AnimatePresence mode="wait">
                    {activeTab === 'matrix' && (
                      <motion.div
                        key="matrix-view"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <MatrixTable organismos={filteredAndSortedList} onEdit={setEditingOrg} />
                      </motion.div>
                    )}

                    {activeTab === 'charts' && (
                      <motion.div
                        key="charts-view"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <DigitalMaturityChart organismos={filteredAndSortedList} />
                      </motion.div>
                    )}

                    {activeTab === 'history' && (
                      <motion.div
                        key="history-view"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.2 }}
                      >
                        <GeneralHistory />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

              </div>

            </div>

          </motion.div>
        )}

      </div>

      <AnimatePresence>
        {editingOrg && (
          <OrganismoEditModal
            organismo={editingOrg}
            onClose={() => setEditingOrg(null)}
            onSaved={(updated) => {
              setOrganismos(prev => prev.map(o => o.id === updated.id ? updated : o));
              setEditingOrg(null);
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
