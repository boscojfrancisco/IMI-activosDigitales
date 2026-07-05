import React from 'react';
import { Organismo } from '../types';
import { motion } from 'motion/react';
import { 
  Globe, 
  BookOpen, 
  Laptop, 
  CalendarCheck, 
  FileText, 
  Bot, 
  Sparkles, 
  ExternalLink, 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Edit,
  FileSignature,
  GitBranch,
  ShieldCheck,
  Coins
} from 'lucide-react';

interface OrganismoCardProps {
  organismo: Organismo;
  onEdit?: (org: Organismo) => void;
}

export function getMaturityGrade(org: Organismo): number {
  let score = 0;
  const isYes = (val: string | undefined) => {
    if (!val) return false;
    const v = val.toLowerCase().trim();
    return v === 'tiene' || v === 'si' || v === 'sí' || v === 'hizo';
  };
  
  // 1. Eje 3: Identidad Web (15%)
  if (org.tieneWeb) score += 10;
  if (org.tieneWebPropia) score += 5;

  // 2. Eje 1: Servicios Ciudadanos (45%)
  if (isYes(org.guiaTramites)) score += 10;
  if (isYes(org.tramitesOnline)) score += 20;
  if (isYes(org.turnosOnline)) score += 5;
  if (isYes(org.seguimientoTramites)) score += 5;
  if (isYes(org.atencionDigital)) score += 5;

  // 3. Eje 2: Eficiencia Interna (30%)
  if (isYes(org.expedienteDigital)) score += 10;
  if (isYes(org.firmaDigital)) score += 10;
  if (isYes(org.tieneDoco)) score += 5;
  if (isYes(org.usaSiif)) score += 5;

  // 4. Eje 4: Innovación y Procesos (10%)
  if (isYes(org.analisisProcesos)) score += 5;
  if (org.chatbot || org.usaIA) score += 5;

  return score;
}

const OrganismoCard: React.FC<OrganismoCardProps> = ({ organismo, onEdit }) => {
  const grade = getMaturityGrade(organismo);

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

  const getPropiaHostname = (urlStr: string) => {
    try {
      let target = urlStr.trim();
      if (!target.startsWith('http://') && !target.startsWith('https://')) {
        target = 'https://' + target;
      }
      return new URL(target).hostname;
    } catch {
      return urlStr;
    }
  };

  // Determine maturity color scheme
  const getMaturityColor = (score: number) => {
    if (score >= 80) return { bg: 'bg-emerald-50 dark:bg-emerald-950/20', border: 'border-emerald-200 dark:border-emerald-800/60', text: 'text-emerald-700 dark:text-emerald-400', progress: 'bg-emerald-500', label: 'Excelente' };
    if (score >= 50) return { bg: 'bg-blue-50 dark:bg-blue-950/20', border: 'border-blue-200 dark:border-blue-800/65', text: 'text-blue-700 dark:text-blue-400', progress: 'bg-blue-500', label: 'Intermedio' };
    return { bg: 'bg-amber-50 dark:bg-amber-950/20', border: 'border-amber-200 dark:border-amber-800/60', text: 'text-amber-700 dark:text-amber-400', progress: 'bg-amber-500', label: 'Básico' };
  };

  const statusStyle = getMaturityColor(grade);

  const renderDigitalIndicator = (label: string, value: string | boolean, icon: React.ComponentType<{ className?: string }>) => {
    const Icon = icon;
    const isYes = typeof value === 'boolean' 
      ? value 
      : value?.toLowerCase().trim() === 'tiene' || value?.toLowerCase().trim() === 'si' || value?.toLowerCase().trim() === 'sí' || value?.toLowerCase().trim() === 'hizo';

    return (
      <div className="flex items-center justify-between py-1.5 border-b border-slate-100 dark:border-slate-800/80 last:border-0">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-400">
          <Icon className="h-3.5 w-3.5 text-slate-400 dark:text-slate-500" />
          <span>{label}</span>
        </div>
        {isYes ? (
          <span className="flex items-center gap-1 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full">
            <CheckCircle2 className="h-3 w-3" />
            SÍ
          </span>
        ) : (
          <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800/50 px-2 py-0.5 rounded-full">
            <XCircle className="h-3 w-3" />
            NO
          </span>
        )}
      </div>
    );
  };

  return (
    <motion.article
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.25 }}
      className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between glow-hover relative overflow-hidden group"
    >
      {/* Decorative gradient band for level */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500" />

      <div>
        {/* Header (Title & Badge) */}
        <div className="flex items-start justify-between mb-4 mt-1">
          <div className="flex flex-col gap-2 items-start">
            <span className="text-[10px] uppercase font-bold tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-md">
              {organismo.tipo || 'Organismo'}
            </span>
            <h4 className="font-display font-bold text-slate-800 dark:text-slate-100 text-base leading-tight pr-4">
              {organismo.nombre}
            </h4>
          </div>
          {onEdit && (
            <button
              onClick={() => onEdit(organismo)}
              className="p-1.5 text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 bg-slate-50 hover:bg-blue-50 dark:bg-slate-800 dark:hover:bg-blue-900/30 rounded-lg transition-colors cursor-pointer"
              aria-label="Editar organismo"
            >
              <Edit className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Digital Maturity Indicator */}
        <div className={`p-3 rounded-xl border ${statusStyle.bg} ${statusStyle.border} mb-4`}>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1">
              Madurez Digital:
              <span className={`font-bold ${statusStyle.text}`}>{statusStyle.label}</span>
            </span>
            <span className={`text-sm font-extrabold font-mono ${statusStyle.text}`}>{grade}%</span>
          </div>
          <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
            <div className={`h-full rounded-full transition-all duration-500 ${statusStyle.progress}`} style={{ width: `${grade}%` }} />
          </div>
        </div>

        {/* Capability Indicators Checklist */}
        <div className="space-y-0.5 mb-4 bg-slate-50 dark:bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-100 dark:border-slate-900">
          {renderDigitalIndicator('Sitio Web Oficial', organismo.tieneWeb, Globe)}
          {renderDigitalIndicator('Dominio Propio (Independiente)', organismo.tieneWebPropia, Sparkles)}
          {renderDigitalIndicator('Guía de Trámites', organismo.guiaTramites, BookOpen)}
          {renderDigitalIndicator('Tramites Online', organismo.tramitesOnline, Laptop)}
          {renderDigitalIndicator('Turnos por Turnero', organismo.turnosOnline, CalendarCheck)}
          {renderDigitalIndicator('Expediente Digital', organismo.expedienteDigital, FileText)}
          {renderDigitalIndicator('Tienen Firma Digital', organismo.firmaDigital, FileSignature)}
          {renderDigitalIndicator('Analisis de Procesos con Gcia. Innovacion', organismo.analisisProcesos, GitBranch)}
          {renderDigitalIndicator('Contratado Doco', organismo.tieneDoco, ShieldCheck)}
          {renderDigitalIndicator('Usa SiiF', organismo.usaSiif, Coins)}
          {renderDigitalIndicator('Tienen IA en sus procesos', (organismo.chatbot || organismo.usaIA), Bot)}
        </div>

        {/* Reseñas y Notas de Implementación */}
        {(organismo.resenaSiif || organismo.resenaFirma || organismo.resenaIa || organismo.chatbotResena) && (
          <div className="mb-4 p-3 bg-slate-50 dark:bg-slate-950 border border-slate-100 dark:border-slate-850 rounded-xl space-y-2.5 text-[11px] text-slate-650 dark:text-slate-400">
            <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">Notas de Implementación</span>
            
            {organismo.resenaSiif && (
              <div className="space-y-0.5">
                <span className="font-bold text-slate-700 dark:text-slate-350 block">Uso de SiiF:</span>
                <p className="italic leading-normal pl-2 border-l border-slate-200 dark:border-slate-800">{organismo.resenaSiif}</p>
              </div>
            )}

            {organismo.resenaFirma && (
              <div className="space-y-0.5">
                <span className="font-bold text-slate-700 dark:text-slate-350 block">Firma Digital:</span>
                <p className="italic leading-normal pl-2 border-l border-slate-200 dark:border-slate-800">{organismo.resenaFirma}</p>
              </div>
            )}

            {organismo.resenaIa && (
              <div className="space-y-0.5">
                <span className="font-bold text-slate-700 dark:text-slate-350 block">IA en sus Procesos:</span>
                <p className="italic leading-normal pl-2 border-l border-slate-200 dark:border-slate-800">{organismo.resenaIa}</p>
              </div>
            )}

            {organismo.chatbotResena && (
              <div className="space-y-0.5">
                <span className="font-bold text-slate-700 dark:text-slate-350 block">Chatbot:</span>
                <p className="italic leading-normal pl-2 border-l border-slate-200 dark:border-slate-800">{organismo.chatbotResena}</p>
              </div>
            )}
          </div>
        )}

      </div>

      {/* Action / Redirection Links */}
      <div className="space-y-2 mt-auto">
        {/* Web Propia Link */}
        {isValidUrl(organismo.enlaceWebPropia) ? (
          <a
            href={ensureAbsoluteUrl(organismo.enlaceWebPropia)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-sm transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-yellow-300 animate-pulse" />
              Web Propia ({getPropiaHostname(organismo.enlaceWebPropia)})
            </span>
            <ExternalLink className="h-3 w-3" />
          </a>
        ) : null}

        {/* Web Portal de Gobierno Link */}
        {isValidUrl(organismo.enlaceWebGov) ? (
          <a
            href={ensureAbsoluteUrl(organismo.enlaceWebGov)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800/80 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 hover:text-blue-600 dark:hover:text-blue-400 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-blue-500" />
              Web Portal de Gobierno
            </span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        ) : null}

        {/* Guide Link */}
        {(organismo.guiaTramites?.toLowerCase().trim() === 'tiene' || organismo.guiaTramites?.toLowerCase().trim() === 'si' || organismo.guiaTramites?.toLowerCase().trim() === 'sí') && isValidUrl(organismo.enlaceGuia) ? (
          <a
            href={ensureAbsoluteUrl(organismo.enlaceGuia)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 bg-violet-50 hover:bg-violet-100 dark:bg-violet-950/20 dark:hover:bg-violet-950/40 text-violet-700 dark:text-violet-300 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <BookOpen className="h-3.5 w-3.5 text-violet-500" />
              Guía de Trámites ({organismo.qTramitesGuia ? `${organismo.qTramitesGuia} tráms` : 'Ver todos'})
            </span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        ) : null}

        {/* Online Procedures Link */}
        {(organismo.tramitesOnline?.toLowerCase().trim() === 'tiene' || organismo.tramitesOnline?.toLowerCase().trim() === 'si' || organismo.tramitesOnline?.toLowerCase().trim() === 'sí') && isValidUrl(organismo.enlaceTramitesOnline) ? (
          <a
            href={ensureAbsoluteUrl(organismo.enlaceTramitesOnline)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <Laptop className="h-3.5 w-3.5 text-emerald-500" />
              Iniciar Trámite Online ({organismo.qTramitesOnline ? `${organismo.qTramitesOnline} tráms` : 'Ver todos'})

            </span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        ) : null}

        {/* Turnos Online Link */}
        {(organismo.turnosOnline?.toLowerCase().trim() === 'tiene' || organismo.turnosOnline?.toLowerCase().trim() === 'si' || organismo.turnosOnline?.toLowerCase().trim() === 'sí') && isValidUrl(organismo.enlaceTurnosOnline) ? (
          <a
            href={ensureAbsoluteUrl(organismo.enlaceTurnosOnline)}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-between px-3 py-2 bg-amber-50 hover:bg-amber-100 dark:bg-amber-950/20 dark:hover:bg-amber-950/40 text-amber-700 dark:text-amber-300 font-semibold text-xs rounded-xl transition cursor-pointer"
          >
            <span className="flex items-center gap-1.5">
              <CalendarCheck className="h-3.5 w-3.5 text-amber-500" />
              Turnos Online
            </span>
            <ExternalLink className="h-3 w-3 opacity-60" />
          </a>
        ) : null}

        {/* Sync Meta */}
        <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 dark:border-slate-800 text-[10px] text-slate-400 dark:text-slate-500 font-mono">
          <span className="flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            Actualizado:
          </span>
          <span>{organismo.dateActualizacion || 'S/D'}</span>
        </div>
      </div>
    </motion.article>
  );
};

export default OrganismoCard;
