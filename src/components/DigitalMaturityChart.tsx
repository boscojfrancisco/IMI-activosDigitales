import React, { useMemo, useState } from 'react';
import { Organismo } from '../types';
import { getMaturityGrade } from './OrganismoCard';
import { Award, Layers, TrendingUp, Sparkles, ShieldCheck, UserCheck, Cpu, Database, ChevronDown, ChevronUp, Info, HelpCircle } from 'lucide-react';

interface DigitalMaturityChartProps {
  organismos: Organismo[];
}

export default function DigitalMaturityChart({ organismos }: DigitalMaturityChartProps) {
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

  const total = organismos.length;

  return (
    <div className="space-y-6">
      
      {/* 1. SECCIÓN PRINCIPAL: ÍNDICE GENERAL DE MADUREZ PROVINCIAL (IMDP) */}
      <div className="bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 text-white rounded-2xl p-6 shadow-md">
        
        {/* Grid rígido de 12 columnas para evitar encogimiento lateral */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Lado Izquierdo: Velocímetro e info general (col-span 5) */}
          <div className="lg:col-span-5 flex items-center gap-5 shrink-0">
            <div className="relative flex items-center justify-center w-24 h-24 rounded-full bg-slate-800/50 border-4 border-blue-500/30 shrink-0 shadow-lg">
              {/* Círculo interior */}
              <div className="absolute inset-2 rounded-full bg-slate-950 flex flex-col items-center justify-center border border-slate-800">
                <span className="font-mono text-3xl font-extrabold text-blue-400 leading-none">
                  {provincialStats.imdp}%
                </span>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider mt-1">
                  Madurez
                </span>
              </div>
            </div>
            <div>
              <span className="text-xs font-bold text-blue-400 uppercase tracking-widest block">Indicador Macro</span>
              <h2 className="text-xl font-bold font-display tracking-tight mt-0.5">
                Índice de Madurez Digital Provincial
              </h2>
              <p className="text-xs text-slate-350 dark:text-slate-400 mt-1 max-w-sm leading-relaxed">
                Puntaje compuesto que evalúa la digitalización de Corrientes sobre las 14 variables de madurez reales.
              </p>
              <button
                onClick={() => setShowWeights(!showWeights)}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-blue-400 hover:text-blue-300 transition cursor-pointer"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                {showWeights ? 'Ocultar Origen de Datos' : 'Ver de dónde salen estos números'}
                {showWeights ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Lado Derecho: Los 4 subíndices de gobierno (col-span 7) */}
          <div className="lg:col-span-7 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full">
            {/* IDC */}
            <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Servicios Ciudadanos</span>
                <UserCheck className="w-4 h-4 text-emerald-400 shrink-0" />
              </div>
              <div className="mt-3">
                <span className="text-lg font-bold font-mono text-emerald-400">{provincialStats.idc}%</span>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-emerald-400 rounded-full" style={{ width: `${provincialStats.idc}%` }} />
                </div>
              </div>
            </div>

            {/* IDE */}
            <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Eficiencia Interna</span>
                <Database className="w-4 h-4 text-blue-400 shrink-0" />
              </div>
              <div className="mt-3">
                <span className="text-lg font-bold font-mono text-blue-400">{provincialStats.ide}%</span>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-blue-400 rounded-full" style={{ width: `${provincialStats.ide}%` }} />
                </div>
              </div>
            </div>

            {/* IIO */}
            <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Innovación</span>
                <Cpu className="w-4 h-4 text-fuchsia-400 shrink-0" />
              </div>
              <div className="mt-3">
                <span className="text-lg font-bold font-mono text-fuchsia-400">{provincialStats.iio}%</span>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-fuchsia-400 rounded-full" style={{ width: `${provincialStats.iio}%` }} />
                </div>
              </div>
            </div>

            {/* IPW */}
            <div className="bg-slate-950/40 border border-slate-850 p-3 rounded-xl flex flex-col justify-between shadow-sm">
              <div className="flex justify-between items-start gap-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider leading-tight">Identidad Web</span>
                <Sparkles className="w-4 h-4 text-teal-400 shrink-0" />
              </div>
              <div className="mt-3">
                <span className="text-lg font-bold font-mono text-teal-400">{provincialStats.ipw}%</span>
                <div className="h-1.5 w-full bg-slate-800 rounded-full overflow-hidden mt-1.5">
                  <div className="h-full bg-teal-400 rounded-full" style={{ width: `${provincialStats.ipw}%` }} />
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Panel Desplegable de Ponderaciones y Adopción Provincial Real */}
        {showWeights && (
          <div className="mt-6 pt-6 border-t border-slate-800/80 grid grid-cols-1 md:grid-cols-4 gap-4 animate-fadeIn text-xs">
            
            {/* Bloque 1 - Servicios al Ciudadano */}
            <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-slate-850/50">
              <span className="font-bold text-emerald-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
                <UserCheck className="w-3.5 h-3.5 shrink-0" />
                Servicios al Ciudadano (45%)
              </span>
              <div className="space-y-2 text-slate-300">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-200">
                    <span>Trámites Online</span>
                    <span className="font-bold text-emerald-400 font-mono">20%</span>
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-white">{provincialStats.counts.tramites} de {total} ({Math.round(provincialStats.counts.tramites/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-200">
                    <span>Guía de Trámites</span>
                    <span className="font-bold text-emerald-400 font-mono">10%</span>
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-white">{provincialStats.counts.guia} de {total} ({Math.round(provincialStats.counts.guia/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-200">
                    <span>Turnos Online</span>
                    <span className="font-bold text-emerald-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-white">{provincialStats.counts.turnos} de {total} ({Math.round(provincialStats.counts.turnos/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-200">
                    <span>Seguimiento Digital</span>
                    <span className="font-bold text-emerald-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-white">{provincialStats.counts.seguimiento} de {total} ({Math.round(provincialStats.counts.seguimiento/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-200">
                    <span>Atención Digital</span>
                    <span className="font-bold text-emerald-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-white">{provincialStats.counts.atencion} de {total} ({Math.round(provincialStats.counts.atencion/total * 100)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 2 - Eficiencia Interna */}
            <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-slate-850/50">
              <span className="font-bold text-blue-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
                <Database className="w-3.5 h-3.5 shrink-0" />
                Eficiencia Interna (30%)
              </span>
              <div className="space-y-2 text-slate-300">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-200">
                    <span>Expediente Digital</span>
                    <span className="font-bold text-blue-400 font-mono">10%</span>
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-white">{provincialStats.counts.expediente} de {total} ({Math.round(provincialStats.counts.expediente/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-200">
                    <span>Tienen Firma Digital</span>
                    <span className="font-bold text-blue-400 font-mono">10%</span>
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-white">{provincialStats.counts.firma} de {total} ({Math.round(provincialStats.counts.firma/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-200">
                    <span>Contratado Doco</span>
                    <span className="font-bold text-blue-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-white">{provincialStats.counts.doco} de {total} ({Math.round(provincialStats.counts.doco/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-200">
                    <span>Uso de SiiF</span>
                    <span className="font-bold text-blue-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-white">{provincialStats.counts.siif} de {total} ({Math.round(provincialStats.counts.siif/total * 100)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 3 - Identidad Web */}
            <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-slate-850/50">
              <span className="font-bold text-teal-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
                <Sparkles className="w-3.5 h-3.5 shrink-0" />
                Identidad Web (15%)
              </span>
              <div className="space-y-2 text-slate-300">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-200">
                    <span>Sitio Web Oficial</span>
                    <span className="font-bold text-teal-400 font-mono">10%</span>
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-white">{provincialStats.counts.web} de {total} ({Math.round(provincialStats.counts.web/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-200">
                    <span>Sitio Web Propio</span>
                    <span className="font-bold text-teal-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-white">{provincialStats.counts.webPropia} de {total} ({Math.round(provincialStats.counts.webPropia/total * 100)}%)</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Bloque 4 - Innovación */}
            <div className="space-y-3 bg-slate-950/30 p-3 rounded-xl border border-slate-850/50">
              <span className="font-bold text-fuchsia-400 flex items-center gap-1.5 border-b border-slate-800/80 pb-1">
                <Cpu className="w-3.5 h-3.5 shrink-0" />
                Innovación (10%)
              </span>
              <div className="space-y-2 text-slate-300">
                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-200">
                    <span>Optimización Procesos</span>
                    <span className="font-bold text-fuchsia-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-white">{provincialStats.counts.procesos} de {total} ({Math.round(provincialStats.counts.procesos/total * 100)}%)</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-[11px] font-medium text-slate-200">
                    <span>Uso IA o Chatbot</span>
                    <span className="font-bold text-fuchsia-400 font-mono">5%</span>
                  </div>
                  <div className="text-[10px] text-slate-450 mt-0.5 flex justify-between">
                    <span>Adopción Provincial:</span>
                    <span className="font-semibold text-white">{provincialStats.counts.iaOrChatbot} de {total} ({Math.round(provincialStats.counts.iaOrChatbot/total * 100)}%)</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 2. GRÁFICOS SECUNDARIOS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
      </div>

    </div>
  );
}
