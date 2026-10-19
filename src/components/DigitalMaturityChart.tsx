import React, { useMemo, useState } from 'react';
import { Organismo } from '../types';
import { getMaturityGrade } from './OrganismoCard';
import { Award, Layers, TrendingUp, Sparkles, ShieldCheck, UserCheck, Cpu, Database, ChevronDown, ChevronUp, Info, HelpCircle } from 'lucide-react';

interface DigitalMaturityChartProps {
  organismos: Organismo[];
  variant?: 'all' | 'macro' | 'details';
}

export default function DigitalMaturityChart({ organismos, variant = 'all' }: DigitalMaturityChartProps) {
  const [showWeights, setShowWeights] = useState(false);
  
  // Normalizador de texto
  const isYes = (val: string | undefined) => {
    if (!val) return false;
    const v = val.toLowerCase().trim();
    return v === 'tiene' || v === 'si' || v === 'sí' || v === 'hizo';
  };

  // 1. Calcular el IMDP General, Subíndices y Adopción Provincial
  const provincialStats = useMemo(() => {
    const totalCount = organismos.length;
    if (totalCount === 0) {
      return { 
        imdp: 0, idc: 0, ide: 0, iio: 0, ipw: 0, 
        counts: {
          web: 0, webPropia: 0, guia: 0, tramites: 0, turnos: 0, 
          seguimiento: 0, atencion: 0, expediente: 0, firma: 0, 
          doco: 0, siif: 0, procesos: 0, iaOrChatbot: 0
        } 
      };
    }

    let sumIMDP = 0;
    let sumIDC = 0; // Ciudadano (max 45%)
    let sumIDE = 0; // Interna (max 30%)
    let sumIIO = 0; // Innovación (max 10%)
    let sumIPW = 0; // Web/Identidad (max 15%)

    // Contadores para entender de dónde salen
    let countWeb = 0;
    let countWebPropia = 0;
    let countGuia = 0;
    let countTramites = 0;
    let countTurnos = 0;
    let countSeguimiento = 0;
    let countAtencion = 0;
    let countExpediente = 0;
    let countFirma = 0;
    let countDoco = 0;
    let countSiif = 0;
    let countProcesos = 0;
    let countIAOrChatbot = 0;

    organismos.forEach(org => {
      const score = getMaturityGrade(org);
      sumIMDP += score;

      // Evaluar presencia individual
      if (org.tieneWeb) countWeb++;
      if (org.tieneWebPropia) countWebPropia++;
      if (isYes(org.guiaTramites)) countGuia++;
      if (isYes(org.tramitesOnline)) countTramites++;
      if (isYes(org.turnosOnline)) countTurnos++;
      if (isYes(org.seguimientoTramites)) countSeguimiento++;
      if (isYes(org.atencionDigital)) countAtencion++;
      if (isYes(org.expedienteDigital)) countExpediente++;
      if (isYes(org.firmaDigital)) countFirma++;
      if (isYes(org.tieneDoco)) countDoco++;
      if (isYes(org.usaSiif)) countSiif++;
      if (isYes(org.analisisProcesos)) countProcesos++;
      if (org.chatbot || org.usaIA) countIAOrChatbot++;

      // bloques para subíndices
      let idcScore = 0;
      if (isYes(org.guiaTramites)) idcScore += 10;
      if (isYes(org.tramitesOnline)) idcScore += 20;
      if (isYes(org.turnosOnline)) idcScore += 5;
      if (isYes(org.seguimientoTramites)) idcScore += 5;
      if (isYes(org.atencionDigital)) idcScore += 5;
      sumIDC += (idcScore / 45) * 100;

      let ideScore = 0;
      if (isYes(org.expedienteDigital)) ideScore += 10;
      if (isYes(org.firmaDigital)) ideScore += 10;
      if (isYes(org.tieneDoco)) ideScore += 5;
      if (isYes(org.usaSiif)) ideScore += 5;
      sumIDE += (ideScore / 30) * 100;

      let iioScore = 0;
      if (isYes(org.analisisProcesos)) iioScore += 5;
      if (org.chatbot || org.usaIA) iioScore += 5;
      sumIIO += (iioScore / 10) * 100;

      let ipwScore = 0;
      if (org.tieneWeb) ipwScore += 10;
      if (org.tieneWebPropia) ipwScore += 5;
      sumIPW += (ipwScore / 15) * 100;
    });

    return {
      imdp: Math.round(sumIMDP / totalCount),
      idc: Math.round(sumIDC / totalCount),
      ide: Math.round(sumIDE / totalCount),
      iio: Math.round(sumIIO / totalCount),
      ipw: Math.round(sumIPW / totalCount),
      counts: {
        web: countWeb,
        webPropia: countWebPropia,
        guia: countGuia,
        tramites: countTramites,
        turnos: countTurnos,
        seguimiento: countSeguimiento,
        atencion: countAtencion,
        expediente: countExpediente,
        firma: countFirma,
        doco: countDoco,
        siif: countSiif,
        procesos: countProcesos,
        iaOrChatbot: countIAOrChatbot
      }
    };
  }, [organismos]);

  // 2. Calcular el Top 5
  const topAgencies = useMemo(() => {
    return [...organismos]
      .map(org => ({
        nombre: org.nombre,
        tipo: org.tipo,
        score: getMaturityGrade(org)
      }))
      .sort((a, b) => b.score - a.score || a.nombre.localeCompare(b.nombre))
      .slice(0, 5);
  }, [organismos]);

  // 3. Promedio por Tipo/Nivel
  const typeAverages = useMemo(() => {
    const map: Record<string, { totalScore: number; count: number }> = {};
    organismos.forEach(org => {
      const g = getMaturityGrade(org);
      const t = org.tipo || 'Otro';
      if (!map[t]) {
        map[t] = { totalScore: 0, count: 0 };
      }
      map[t].totalScore += g;
      map[t].count += 1;
    });

    return Object.entries(map)
      .map(([tipo, data]) => ({
        tipo,
        promedio: Math.round(data.totalScore / data.count),
        count: data.count
      }))
      .sort((a, b) => b.promedio - a.promedio);
  }, [organismos]);

  const maturityDistribution = useMemo(() => {
    const levels = [
      { label: 'Inicial', range: '0–25%', count: 0, color: 'bg-slate-400 dark:bg-slate-500' },
      { label: 'En desarrollo', range: '26–50%', count: 0, color: 'bg-amber-500' },
      { label: 'Avanzado', range: '51–75%', count: 0, color: 'bg-blue-500' },
      { label: 'Líder', range: '76–100%', count: 0, color: 'bg-emerald-500' }
    ];

    organismos.forEach(org => {
      const score = getMaturityGrade(org);
      const index = score <= 25 ? 0 : score <= 50 ? 1 : score <= 75 ? 2 : 3;
      levels[index].count += 1;
    });

    return levels.map(level => ({
      ...level,
      percentage: organismos.length ? Math.round((level.count / organismos.length) * 100) : 0
    }));
  }, [organismos]);

  const total = organismos.length;

  return (
    <div className="space-y-6">
      
      {/* 1. SECCIÓN PRINCIPAL: ÍNDICE GENERAL DE MADUREZ PROVINCIAL (IMDP) */}
      {variant !== 'details' && (
      <section aria-labelledby="imdp-title" className="border-b border-slate-200/80 dark:border-slate-800/80 pb-5 text-slate-900 dark:text-white">
        
        {/* Grid rígido de 12 columnas para evitar encogimiento lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 lg:gap-6 items-center">
          
          {/* Indicador de avance provincial */}
          <div className="lg:col-span-5 flex items-center gap-4 min-w-0">
            <div
              className="relative h-20 w-20 shrink-0"
              role="progressbar"
              aria-label="Madurez provincial"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={provincialStats.imdp}
            >
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 100 100" aria-hidden="true">
                <circle cx="50" cy="50" r="44" fill="none" strokeWidth="7" className="stroke-slate-200 dark:stroke-slate-800" />
                <circle
                  cx="50"
                  cy="50"
                  r="44"
                  fill="none"
                  strokeWidth="7"
                  strokeLinecap="round"
                  strokeDasharray={`${2 * Math.PI * 44}`}
                  strokeDashoffset={`${2 * Math.PI * 44 * (1 - provincialStats.imdp / 100)}`}
                  className="stroke-[#527eaf] dark:stroke-[#9fc3ec] transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-2 rounded-full bg-white dark:bg-slate-950 flex flex-col items-center justify-center">
                <span className="font-mono text-2xl font-extrabold tracking-tight text-[#527eaf] dark:text-[#9fc3ec] leading-none">
                  {provincialStats.imdp}%
                </span>
                <span className="text-[9px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mt-1">
                  avance
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-[#527eaf] dark:text-[#9fc3ec] uppercase tracking-widest block">Indicador Macro</span>
              <h2 id="imdp-title" className="text-xl font-bold font-display tracking-tight mt-0.5">
                Índice de Madurez Digital Provincial
              </h2>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
                Puntaje compuesto que evalúa la digitalización de Corrientes sobre las 14 variables de madurez reales.
              </p>
              <button
                onClick={() => setShowWeights(!showWeights)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-[#527eaf] hover:text-[#365f8b] dark:text-[#9fc3ec] dark:hover:text-white transition cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showWeights ? 'Ocultar Origen de Datos' : 'Ver de dónde salen estos números'}
                {showWeights ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Lado Derecho: Los 4 subíndices de gobierno (col-span 7) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-3 w-full">
            {/* IDC */}
            <div className="min-w-0 px-1">
              <div className="flex justify-between items-center gap-1">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider leading-tight truncate">Servicios Ciudadanos</span>
                <span className="text-sm font-bold font-mono text-emerald-500 dark:text-emerald-400 shrink-0">{provincialStats.idc}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-emerald-500 dark:bg-emerald-400 rounded-full" style={{ width: `${provincialStats.idc}%` }} />
              </div>
            </div>

            {/* IDE */}
            <div className="min-w-0 px-1">
              <div className="flex justify-between items-center gap-1">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider leading-tight truncate">Eficiencia Interna</span>
                <span className="text-sm font-bold font-mono text-blue-500 dark:text-blue-400 shrink-0">{provincialStats.ide}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-blue-500 dark:bg-blue-400 rounded-full" style={{ width: `${provincialStats.ide}%` }} />
              </div>
            </div>

            {/* IIO */}
            <div className="min-w-0 px-1">
              <div className="flex justify-between items-center gap-1">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider leading-tight truncate">Innovación</span>
                <span className="text-sm font-bold font-mono text-fuchsia-500 dark:text-fuchsia-400 shrink-0">{provincialStats.iio}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-fuchsia-500 dark:bg-fuchsia-400 rounded-full" style={{ width: `${provincialStats.iio}%` }} />
              </div>
            </div>

            {/* IPW */}
            <div className="min-w-0 px-1">
              <div className="flex justify-between items-center gap-1">
                <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 uppercase tracking-wider leading-tight truncate">Identidad Web</span>
                <span className="text-sm font-bold font-mono text-teal-500 dark:text-teal-400 shrink-0">{provincialStats.ipw}%</span>
              </div>
              <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden mt-2">
                <div className="h-full bg-teal-500 dark:bg-teal-400 rounded-full" style={{ width: `${provincialStats.ipw}%` }} />
              </div>
            </div>
          </div>

        </div>

        {/* Panel Desplegable de Ponderaciones y Adopción Provincial Real */}
        {showWeights && (
          <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn text-xs">
            
            {/* Bloque 1 - Servicios al Ciudadano */}
            <div className="space-y-3 bg-white/80 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                Servicios al Ciudadano (45%)
              </span>
              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    <span>Trámites Online</span>
                    <span className="font-bold text-emerald-400 font-mono">20%</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provincialStats.counts.tramites} de {total} ({Math.round(provincialStats.counts.tramites/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    <span>Guía de Trámites</span>
                    <span className="font-bold text-emerald-400 font-mono">10%</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provincialStats.counts.guia} de {total} ({Math.round(provincialStats.counts.guia/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    <span>Turnos Online</span>
                    <span className="font-bold text-emerald-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provincialStats.counts.turnos} de {total} ({Math.round(provincialStats.counts.turnos/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    <span>Seguimiento Digital</span>
                    <span className="font-bold text-emerald-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provincialStats.counts.seguimiento} de {total} ({Math.round(provincialStats.counts.seguimiento/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    <span>Atención Digital</span>
                    <span className="font-bold text-emerald-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provincialStats.counts.atencion} de {total} ({Math.round(provincialStats.counts.atencion/total * 100)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 2 - Eficiencia Interna */}
            <div className="space-y-3 bg-white/80 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <span className="font-bold text-blue-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
                <Database className="w-3.5 h-3.5 shrink-0" />
                Eficiencia Interna (30%)
              </span>
              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    <span>Expediente Digital</span>
                    <span className="font-bold text-blue-400 font-mono">10%</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provincialStats.counts.expediente} de {total} ({Math.round(provincialStats.counts.expediente/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    <span>Tienen Firma Digital</span>
                    <span className="font-bold text-blue-400 font-mono">10%</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provincialStats.counts.firma} de {total} ({Math.round(provincialStats.counts.firma/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    <span>Contratado Doco</span>
                    <span className="font-bold text-blue-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provincialStats.counts.doco} de {total} ({Math.round(provincialStats.counts.doco/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    <span>Uso de SiiF</span>
                    <span className="font-bold text-blue-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provincialStats.counts.siif} de {total} ({Math.round(provincialStats.counts.siif/total * 100)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 3 - Identidad Web */}
            <div className="space-y-3 bg-white/80 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <span className="font-bold text-teal-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                Identidad Web (15%)
              </span>
              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    <span>Sitio Web Oficial</span>
                    <span className="font-bold text-teal-400 font-mono">10%</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provincialStats.counts.web} de {total} ({Math.round(provincialStats.counts.web/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    <span>Sitio Web Propio</span>
                    <span className="font-bold text-teal-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provincialStats.counts.webPropia} de {total} ({Math.round(provincialStats.counts.webPropia/total * 100)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 4 - Innovación */}
            <div className="space-y-3 bg-white/80 dark:bg-slate-950/30 p-3 rounded-xl border border-slate-200 dark:border-slate-700/50">
              <span className="font-bold text-fuchsia-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                Innovación (10%)
              </span>
              <div className="space-y-2 text-slate-700 dark:text-slate-300">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    <span>Optimización Procesos</span>
                    <span className="font-bold text-fuchsia-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provincialStats.counts.procesos} de {total} ({Math.round(provincialStats.counts.procesos/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-700 dark:text-slate-200">
                    <span>Uso IA o Chatbot</span>
                    <span className="font-bold text-fuchsia-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-600 dark:text-slate-400 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{provincialStats.counts.iaOrChatbot} de {total} ({Math.round(provincialStats.counts.iaOrChatbot/total * 100)}%)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </section>
      )}

      {/* 2. GRÁFICOS SECUNDARIOS */}
      {variant !== 'macro' && (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {/* Chart 1: Top 5 Agencies */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="font-display font-bold text-slate-850 dark:text-slate-100 text-sm flex items-center gap-2 mb-4">
            <Award className="h-4.5 w-4.5 text-amber-500" />
            Top 5: Liderazgo Digital de Corrientes
          </h3>
          
          {topAgencies.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              Sin datos para clasificar
            </div>
          ) : (
            <div className="space-y-4">
              {topAgencies.map((agency, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between items-center text-xs">
                    <div className="flex items-center gap-2 truncate">
                      <span className="font-mono text-[10px] w-4.5 h-4.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200 truncate" title={agency.nombre}>
                        {agency.nombre}
                      </span>
                    </div>
                    <span className="font-bold text-blue-600 dark:text-blue-400 font-mono shrink-0">
                      {agency.score}%
                    </span>
                  </div>
                  
                  {/* Visual Bar */}
                  <div className="relative h-2 w-full bg-slate-100 dark:bg-slate-800/80 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-700"
                      style={{ width: `${agency.score}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-slate-400 dark:text-slate-500 block pl-6">
                    Nivel: {agency.tipo}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Chart 2: Average maturity by institution tier */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="font-display font-bold text-slate-850 dark:text-slate-100 text-sm flex items-center gap-2 mb-4">
            <Layers className="h-4.5 w-4.5 text-indigo-500" />
            Madurez Digital Promedio por Nivel
          </h3>

          {typeAverages.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">
              Cargando niveles
            </div>
          ) : (
            <div className="space-y-4.5">
              {typeAverages.map((tier, i) => {
                // Determine color representing average grade
                const barColor = tier.promedio >= 75 
                  ? 'from-emerald-400 to-emerald-600'
                  : tier.promedio >= 50 
                  ? 'from-blue-400 to-indigo-500' 
                  : 'from-amber-400 to-amber-500';

                return (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {tier.tipo || 'Desconocido'} ({tier.count} {tier.count === 1 ? 'ente' : 'entes'})
                      </span>
                      <span className="font-bold text-slate-900 dark:text-slate-200 font-mono">
                        {tier.promedio}%
                      </span>
                    </div>

                    {/* Visual Bar */}
                    <div className="h-4.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-lg overflow-hidden relative">
                      <div 
                        className={`h-full bg-gradient-to-r ${barColor} rounded-r-sm transition-all duration-700 flex items-center pl-2`}
                        style={{ width: `${tier.promedio}%` }}
                      >
                        <span className="text-[9px] font-bold text-white leading-none whitespace-nowrap overflow-hidden">
                          {tier.promedio >= 20 ? `${tier.promedio}%` : ''}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Chart 3: distribution by maturity range */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm">
          <h3 className="font-display font-bold text-slate-850 dark:text-slate-100 text-sm flex items-center gap-2 mb-1">
            <TrendingUp className="h-4.5 w-4.5 text-emerald-500" />
            Organismos por nivel de madurez
          </h3>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-5">
            Distribución según el puntaje individual de cada organismo.
          </p>

          {organismos.length === 0 ? (
            <div className="py-8 text-center text-xs text-slate-400 dark:text-slate-500">Sin organismos para clasificar</div>
          ) : (
            <div className="space-y-5">
              {maturityDistribution.map(level => (
                <div key={level.label} className="space-y-1.5">
                  <div className="flex items-center justify-between gap-3 text-xs">
                    <div className="min-w-0">
                      <span className="font-semibold text-slate-800 dark:text-slate-200">{level.label}</span>
                      <span className="ml-2 text-[10px] text-slate-500 dark:text-slate-400">{level.range}</span>
                    </div>
                    <span className="shrink-0 font-mono font-bold text-slate-700 dark:text-slate-300">
                      {level.count} <span className="font-normal text-slate-500 dark:text-slate-400">({level.percentage}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 w-full rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-700 ${level.color}`} style={{ width: `${level.percentage}%` }} />
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 dark:text-slate-400">
            Total analizado: <span className="font-semibold text-slate-700 dark:text-slate-300">{organismos.length} organismos</span>
          </div>
        </div>
      </div>
      )}

    </div>
  );
}
