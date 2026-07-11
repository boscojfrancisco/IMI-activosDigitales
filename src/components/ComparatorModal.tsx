import React from 'react';
import { Organismo } from '../types';
import { getMaturityGrade } from './OrganismoCard';
import { 
  X, Check, AlertCircle, Building2, Award, Activity, Globe, 
  BookOpen, Laptop, CalendarCheck, FileText, FileSignature, 
  GitBranch, ShieldCheck, Coins, Bot, Sparkles, ExternalLink
} from 'lucide-react';

interface ComparatorModalProps {
  organismos: Organismo[];
  onClose: () => void;
}

export default function ComparatorModal({ organismos, onClose }: ComparatorModalProps) {
  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-emerald-500 dark:text-emerald-450';
    if (score >= 50) return 'text-blue-500 dark:text-blue-400';
    return 'text-amber-500 dark:text-amber-400';
  };

  const getBarColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 50) return 'bg-blue-500';
    return 'bg-amber-500';
  };

  // Helper for boolean/yes check
  const isYes = (val: string | boolean | undefined) => {
    if (typeof val === 'boolean') return val;
    if (!val) return false;
    const v = val.toLowerCase().trim();
    return v === 'tiene' || v === 'si' || v === 'sí' || v === 'hizo';
  };

  // Compute sub-indices
  const computeEjeScore = (org: Organismo, ejeNum: number): { score: number; max: number } => {
    let score = 0;
    if (ejeNum === 1) {
      // Eje 1: Servicios Ciudadanos (45%)
      if (isYes(org.guiaTramites)) score += 10;
      if (isYes(org.tramitesOnline)) score += 20;
      if (isYes(org.turnosOnline)) score += 5;
      if (isYes(org.seguimientoTramites)) score += 5;
      if (isYes(org.atencionDigital)) score += 5;
      return { score, max: 45 };
    }
    if (ejeNum === 2) {
      // Eje 2: Eficiencia Interna (30%)
      if (isYes(org.expedienteDigital)) score += 10;
      if (isYes(org.firmaDigital)) score += 10;
      if (isYes(org.tieneDoco)) score += 5;
      if (isYes(org.usaSiif)) score += 5;
      return { score, max: 30 };
    }
    if (ejeNum === 3) {
      // Eje 3: Identidad Web (15%)
      if (org.tieneWeb) score += 10;
      if (org.tieneWebPropia) score += 5;
      return { score, max: 15 };
    }
    if (ejeNum === 4) {
      // Eje 4: Innovación y Procesos (10%)
      if (isYes(org.analisisProcesos)) score += 5;
      if (org.chatbot || org.usaIA) score += 5;
      return { score, max: 10 };
    }
    return { score: 0, max: 100 };
  };

  const variables = [
    { label: 'Sitio Web Oficial', key: 'tieneWeb', icon: Globe, weight: '10%', eje: 'Eje 3: Identidad Web' },
    { label: 'Sitio Web Propio', key: 'tieneWebPropia', icon: Sparkles, weight: '5%', eje: 'Eje 3: Identidad Web' },
    { label: 'Guía de Trámites', key: 'guiaTramites', icon: BookOpen, weight: '10%', eje: 'Eje 1: Servicios Ciudadanos' },
    { label: 'Trámites Online', key: 'tramitesOnline', icon: Laptop, weight: '20%', eje: 'Eje 1: Servicios Ciudadanos' },
    { label: 'Turnos Online', key: 'turnosOnline', icon: CalendarCheck, weight: '5%', eje: 'Eje 1: Servicios Ciudadanos' },
    { label: 'Seguimiento Digital', key: 'seguimientoTramites', icon: Activity, weight: '5%', eje: 'Eje 1: Servicios Ciudadanos' },
    { label: 'Atención Digital', key: 'atencionDigital', icon: AlertCircle, weight: '5%', eje: 'Eje 1: Servicios Ciudadanos' },
    { label: 'Expediente Digital', key: 'expedienteDigital', icon: FileText, weight: '10%', eje: 'Eje 2: Eficiencia Interna' },
    { label: 'Tienen Firma Digital', key: 'firmaDigital', icon: FileSignature, weight: '10%', eje: 'Eje 2: Eficiencia Interna', reviewKey: 'resenaFirma' },
    { label: 'Contratado Doco', key: 'tieneDoco', icon: ShieldCheck, weight: '5%', eje: 'Eje 2: Eficiencia Interna' },
    { label: 'Uso de SiiF', key: 'usaSiif', icon: Coins, weight: '5%', eje: 'Eje 2: Eficiencia Interna', reviewKey: 'resenaSiif' },
    { label: 'Analisis de Procesos con Gcia. Innovacion', key: 'analisisProcesos', icon: GitBranch, weight: '5%', eje: 'Eje 4: Innovación y Procesos' },
    { label: 'Tienen IA en sus procesos', key: 'usaIA', icon: Bot, weight: '5%', eje: 'Eje 4: Innovación y Procesos', customCheck: (o: Organismo) => o.usaIA || o.chatbot, reviewKey: 'resenaIa' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-slate-50 dark:bg-slate-950 w-full max-w-5xl rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[90vh] border border-slate-200 dark:border-slate-800">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900">
          <div className="flex items-center gap-2.5">
            <div className="h-8 w-8 rounded-lg bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white shadow-sm">
              <Award className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 font-display">
                Comparador Side-by-Side de Organismos
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Analizando diferencias en madurez e infraestructura digital.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6 space-y-6">
          
          {/* Organismos Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {organismos.map((org, i) => {
              const score = getMaturityGrade(org);
              return (
                <div 
                  key={org.id} 
                  className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm space-y-4 relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
                  
                  <div>
                    <span className="text-[9px] uppercase font-extrabold tracking-wider text-slate-400 dark:text-slate-500">
                      {org.tipo || 'Organismo'}
                    </span>
                    <h3 className="font-bold text-slate-800 dark:text-slate-100 text-sm leading-tight mt-1 line-clamp-2 h-10">
                      {org.nombre}
                    </h3>
                  </div>

                  {/* Score */}
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <div className="flex items-end justify-between mb-1.5">
                      <span className="text-xs text-slate-500 dark:text-slate-450">Madurez Digital:</span>
                      <span className={`text-xl font-black font-mono leading-none ${getScoreColor(score)}`}>
                        {score}%
                      </span>
                    </div>
                    <div className="h-2 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${getBarColor(score)}`} style={{ width: `${score}%` }} />
                    </div>
                  </div>

                  {/* Ejes Radar-style progress list */}
                  <div className="space-y-2 text-xs pt-3 border-t border-slate-100 dark:border-slate-800/80">
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                      Desglose por Ejes
                    </span>
                    {[1, 2, 3, 4].map(ejeNum => {
                      const { score: ejeScore, max: ejeMax } = computeEjeScore(org, ejeNum);
                      const pct = Math.round((ejeScore / ejeMax) * 100);
                      const ejeNames = ['Servicios Ciudadanos', 'Eficiencia Interna', 'Identidad Web', 'Innovación y Procesos'];
                      return (
                        <div key={ejeNum} className="space-y-1">
                          <div className="flex justify-between text-[11px] font-medium text-slate-600 dark:text-slate-400">
                            <span className="truncate pr-2">{ejeNames[ejeNum - 1]}</span>
                            <span className="font-mono font-bold">{ejeScore}/{ejeMax} ({pct}%)</span>
                          </div>
                          <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-800/50 rounded-full overflow-hidden">
                            <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}

            {/* Empty Slots */}
            {Array.from({ length: 3 - organismos.length }).map((_, idx) => (
              <div 
                key={idx} 
                className="hidden md:flex flex-col items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl p-6 text-center text-slate-450 bg-slate-50/50 dark:bg-slate-900/10 min-h-[220px]"
              >
                <Building2 className="h-8 w-8 text-slate-300 dark:text-slate-700 mb-2" />
                <span className="text-xs font-semibold text-slate-400 dark:text-slate-600">Espacio de comparación vacío</span>
                <p className="text-[10px] text-slate-400 dark:text-slate-600 max-w-[180px] mt-1 leading-normal">
                  Puedes seleccionar hasta 3 organismos en la matriz para compararlos.
                </p>
              </div>
            ))}
          </div>

          {/* Matrix side-by-side rows */}
          <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-sm">
            <div className="p-4 bg-slate-50 dark:bg-slate-950 border-b border-slate-200 dark:border-slate-850">
              <h3 className="font-bold text-xs text-slate-800 dark:text-slate-200 uppercase tracking-wider">
                Grilla Comparativa de Capacidades
              </h3>
            </div>
            
            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {variables.map((v, vIdx) => {
                const Icon = v.icon;
                return (
                  <div key={vIdx} className="grid grid-cols-1 md:grid-cols-4 items-center p-4 gap-3 hover:bg-slate-50/40 dark:hover:bg-slate-800/10 transition-colors">
                    {/* Variable Header Column */}
                    <div className="col-span-1 flex items-start gap-2">
                      <div className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400 shrink-0">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="font-bold text-slate-800 dark:text-slate-250 text-xs block leading-tight">
                          {v.label}
                        </span>
                        <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500">
                          {v.eje} • Peso: {v.weight}
                        </span>
                      </div>
                    </div>

                    {/* Value Columns for each Organism */}
                    {organismos.map((org) => {
                      const hasVar = v.customCheck ? v.customCheck(org) : isYes(org[v.key as keyof Organismo] as string | boolean | undefined);
                      const reviewText = v.reviewKey ? org[v.reviewKey as keyof Organismo] as string : undefined;

                      return (
                        <div key={org.id} className="col-span-1 flex flex-col items-center md:items-start text-center md:text-left md:border-l border-slate-100 dark:border-slate-800/80 md:pl-4 min-h-[40px] justify-center">
                          {hasVar ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/40 px-2 py-0.5 rounded">
                                <Check className="h-3 w-3 shrink-0" />
                                SÍ
                              </span>
                              {reviewText && (
                                <p className="text-[10px] text-slate-500 dark:text-slate-400 italic leading-tight max-w-[200px] mt-1 bg-slate-50 dark:bg-slate-950/50 p-1.5 rounded border border-slate-150 dark:border-slate-850/60">
                                  "{reviewText}"
                                </p>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/40 px-2 py-0.5 rounded">
                              <X className="h-3 w-3 shrink-0" />
                              NO
                            </span>
                          )}
                        </div>
                      );
                    })}

                    {/* Fills if less than 3 organisms */}
                    {Array.from({ length: 3 - organismos.length }).map((_, idx) => (
                      <div key={idx} className="hidden md:block col-span-1 text-slate-300 dark:text-slate-800 text-center">-</div>
                    ))}
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-850 bg-white dark:bg-slate-900 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-bold rounded-xl transition cursor-pointer"
          >
            Cerrar Comparación
          </button>
        </div>

      </div>
    </div>
  );
}
