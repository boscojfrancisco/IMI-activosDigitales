import React, { useMemo } from 'react';
import { Organismo } from '../types';
import { getMaturityGrade } from './OrganismoCard';
import { Award, Layers, TrendingUp, Sparkles } from 'lucide-react';

interface DigitalMaturityChartProps {
  organismos: Organismo[];
}

export default function DigitalMaturityChart({ organismos }: DigitalMaturityChartProps) {
  
  // 1. Calculate Top 5 digitized agencies
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

  // 2. Average maturity by Type
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

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
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
  );
}
