import React, { useState } from 'react';
import { Organismo } from '../types';
import { getMaturityGrade } from './OrganismoCard';
import { 
  Check, X, Search, Info, HelpCircle, ExternalLink, Edit,
  Printer, Clock, Award, ShieldCheck, Bot, Sparkles, BookOpen, 
  Laptop, CalendarCheck, Globe, FileText, CheckCircle2, XCircle, Calendar
} from 'lucide-react';

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
  comparedOrgIds: number[];
  onToggleCompare: (id: number) => void;
}

export default function MatrixTable({ organismos, onEdit, comparedOrgIds, onToggleCompare }: MatrixTableProps) {
  const [rowSearch, setRowSearch] = useState('');
  const [expandedReviews, setExpandedReviews] = useState<Record<string, boolean>>({});
  const [expandedOrgId, setExpandedOrgId] = useState<number | null>(null);
  const [simulatedKeys, setSimulatedKeys] = useState<Record<string, boolean>>({});

  const toggleReview = (orgId: number, colLabel: string) => {
    const key = `${orgId}-${colLabel}`;
    setExpandedReviews(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleToggleExpand = (id: number) => {
    if (expandedOrgId === id) {
      setExpandedOrgId(null);
    } else {
      setExpandedOrgId(id);
      setSimulatedKeys({}); // Reset simulation on switch
    }
  };

  const isYes = (val: string | boolean | undefined) => {
    if (typeof val === 'boolean') return val;
    if (!val) return false;
    const v = val.toLowerCase().trim();
    return v === 'tiene' || v === 'si' || v === 'sí' || v === 'hizo';
  };

  const getStaleness = (org: Organismo) => {
    if (!org.updatedAt) return { days: 0, status: 'stale', color: 'bg-rose-500 text-rose-500', text: 'Revisión pendiente (Sin fecha)' };
    const date = new Date(org.updatedAt);
    const diffTime = Math.abs(new Date().getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays <= 30) {
      return { days: diffDays, status: 'recent', color: 'bg-emerald-500 text-emerald-600 dark:text-emerald-400', text: `Actualizado hace ${diffDays} días (Reciente)` };
    } else if (diffDays <= 90) {
      return { days: diffDays, status: 'medium', color: 'bg-amber-500 text-amber-600 dark:text-amber-400', text: `Actualizado hace ${diffDays} días (Vigente)` };
    } else {
      return { days: diffDays, status: 'stale', color: 'bg-rose-500 text-rose-600 dark:text-rose-455', text: `Revisión pendiente (+${diffDays} días)` };
    }
  };

  const getMissingIndicators = (org: Organismo) => {
    const missing: { label: string; key: string; weight: number }[] = [];
    if (!org.tieneWeb) missing.push({ label: 'Sitio Web Oficial', key: 'tieneWeb', weight: 10 });
    if (!org.tieneWebPropia) missing.push({ label: 'Sitio Web Propio', key: 'tieneWebPropia', weight: 5 });
    if (!isYes(org.guiaTramites)) missing.push({ label: 'Guía de Trámites', key: 'guiaTramites', weight: 10 });
    if (!isYes(org.tramitesOnline)) missing.push({ label: 'Trámites Online', key: 'tramitesOnline', weight: 20 });
    if (!isYes(org.turnosOnline)) missing.push({ label: 'Turnos Online', key: 'turnosOnline', weight: 5 });
    if (!isYes(org.seguimientoTramites)) missing.push({ label: 'Seguimiento Digital (Trámites)', key: 'seguimientoTramites', weight: 5 });
    if (!isYes(org.atencionDigital)) missing.push({ label: 'Atención Digital', key: 'atencionDigital', weight: 5 });
    if (!isYes(org.expedienteDigital)) missing.push({ label: 'Expediente Digital', key: 'expedienteDigital', weight: 10 });
    if (!isYes(org.firmaDigital)) missing.push({ label: 'Tienen Firma Digital', key: 'firmaDigital', weight: 10 });
    if (!isYes(org.tieneDoco)) missing.push({ label: 'Contratado Doco', key: 'tieneDoco', weight: 5 });
    if (!isYes(org.usaSiif)) missing.push({ label: 'Uso de SiiF', key: 'usaSiif', weight: 5 });
    if (!isYes(org.analisisProcesos)) missing.push({ label: 'Analisis de Procesos con Gcia. Innovacion', key: 'analisisProcesos', weight: 5 });
    if (!org.usaIA && !org.chatbot) missing.push({ label: 'Tienen IA en sus procesos', key: 'usaIA', weight: 5 });

    return missing;
  };

  const getMedals = (org: Organismo) => {
    return [
      {
        id: 'cero_papel',
        label: 'Cero Papel',
        icon: ShieldCheck,
        description: 'Expediente Digital + Firma Digital + Contratado DOCO',
        active: isYes(org.expedienteDigital) && isYes(org.firmaDigital) && isYes(org.tieneDoco)
      },
      {
        id: 'pionero_tech',
        label: 'Pionero Tecnológico',
        icon: Bot,
        description: 'Usa IA/Chatbot + Análisis de procesos con la Gcia. de Innovación',
        active: (org.usaIA || org.chatbot) && isYes(org.analisisProcesos)
      },
      {
        id: 'ciudadano_conectado',
        label: 'Ciudadano Conectado',
        icon: Globe,
        description: 'Tiene Trámites Online + Turnos Online + Atención Digital',
        active: isYes(org.tramitesOnline) && isYes(org.turnosOnline) && isYes(org.atencionDigital)
      },
      {
        id: 'excelencia',
        label: 'Madurez Excelente',
        icon: Award,
        description: 'Puntaje de madurez digital del 80% o superior',
        active: getMaturityGrade(org) >= 80
      },
      {
        id: 'actualizado',
        label: 'Rápida Actualización',
        icon: Clock,
        description: 'Datos actualizados en los últimos 30 días',
        active: (() => {
          if (!org.updatedAt) return false;
          const date = new Date(org.updatedAt);
          const diffTime = Math.abs(new Date().getTime() - date.getTime());
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          return diffDays <= 30;
        })()
      }
    ];
  };

  const handlePrintReport = (org: Organismo) => {
    const score = getMaturityGrade(org);
    const medals = getMedals(org);
    const staleness = getStaleness(org);

    const printWindow = window.open('', '_blank', 'width=850,height=900');
    if (!printWindow) {
      alert('Por favor habilite los popups en su navegador para generar la ficha.');
      return;
    }

    const htmlContent = `
      <html>
        <head>
          <title>Ficha Digital - ${org.nombre}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
            body {
              font-family: 'Inter', sans-serif;
              color: #1e293b;
              margin: 40px;
              line-height: 1.5;
            }
            .header {
              text-align: center;
              border-bottom: 3px solid #2563eb;
              padding-bottom: 16px;
              margin-bottom: 24px;
            }
            .header h1 {
              font-size: 22px;
              margin: 0;
              color: #0f172a;
              font-weight: 800;
            }
            .header p {
              margin: 4px 0 0 0;
              font-size: 11px;
              color: #64748b;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            .meta-grid {
              display: grid;
              grid-template-cols: 2fr 1fr;
              gap: 20px;
              margin-bottom: 24px;
            }
            .meta-card {
              border: 1px solid #e2e8f0;
              border-radius: 12px;
              padding: 18px;
              background-color: #f8fafc;
            }
            .score-circle {
              text-align: center;
              border: 4px solid #2563eb;
              border-radius: 12px;
              padding: 18px;
              background-color: #eff6ff;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
            }
            .score-val {
              font-size: 38px;
              font-weight: 900;
              color: #1d4ed8;
              margin: 6px 0;
            }
            .section-title {
              font-size: 15px;
              font-weight: 700;
              border-bottom: 1px solid #cbd5e1;
              padding-bottom: 5px;
              margin-top: 24px;
              margin-bottom: 12px;
              color: #0f172a;
              text-transform: uppercase;
              letter-spacing: 0.5px;
            }
            .indicator-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 24px;
              font-size: 12.5px;
            }
            .indicator-table th, .indicator-table td {
              border: 1px solid #cbd5e1;
              padding: 8px 10px;
              text-align: left;
            }
            .indicator-table th {
              background-color: #f1f5f9;
              font-weight: 700;
            }
            .badge {
              display: inline-block;
              padding: 2px 6px;
              font-size: 10px;
              font-weight: 700;
              border-radius: 4px;
              text-align: center;
            }
            .badge-yes {
              background-color: #dcfce7;
              color: #166534;
            }
            .badge-no {
              background-color: #f1f5f9;
              color: #475569;
            }
            .medals-list {
              display: flex;
              gap: 8px;
              flex-wrap: wrap;
              margin-bottom: 16px;
            }
            .medal-tag {
              border: 1px solid #e2e8f0;
              padding: 5px 10px;
              border-radius: 6px;
              font-size: 11px;
              font-weight: 600;
              background-color: #f8fafc;
              display: flex;
              align-items: center;
              gap: 5px;
            }
            .medal-active {
              border-color: #fed7aa;
              background-color: #fff7ed;
              color: #c2410c;
            }
            .footer {
              text-align: center;
              font-size: 10px;
              color: #94a3b8;
              border-top: 1px solid #e2e8f0;
              padding-top: 16px;
              margin-top: 40px;
            }
            @media print {
              body { margin: 15px; }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Monitor de Digitalización Pública</h1>
            <p>Ficha Técnica Ejecutiva • Provincia de Corrientes</p>
          </div>

          <div class="meta-grid">
            <div class="meta-card">
              <h3 style="margin: 0 0 8px 0; font-size:15px; color:#1e3a8a;">${org.nombre}</h3>
              <p style="font-size:12.5px; margin: 4px 0;"><strong>Tipo:</strong> ${org.tipo || 'Desconocido'}</p>
              <p style="font-size:12.5px; margin: 4px 0;"><strong>Datos:</strong> ${staleness.text}</p>
              <p style="font-size:12.5px; margin: 4px 0;"><strong>Sincronizado:</strong> ${org.updatedAt ? new Date(org.updatedAt).toLocaleString('es-AR') : 'S/D'}</p>
            </div>
            <div class="score-circle">
              <div style="font-size:10px; font-weight:700; text-transform:uppercase; color:#2563eb;">Índice IMDP</div>
              <div class="score-val">${score}%</div>
              <div style="font-size:9.5px; color:#64748b; font-weight:600;">MADUREZ DIGITAL</div>
            </div>
          </div>

          <h2 class="section-title">Logros y Hitos (Medallas)</h2>
          <div class="medals-list">
            ${medals.map(m => `
              <div class="medal-tag ${m.active ? 'medal-active' : ''}" style="${!m.active ? 'opacity: 0.35;' : ''}">
                <span>${m.active ? '🏆' : '🔒'}</span>
                <strong>${m.label}</strong>
              </div>
            `).join('')}
          </div>

          <h2 class="section-title">Detalle de Variables IMDP</h2>
          <table class="indicator-table">
            <thead>
              <tr>
                <th style="width: 35%;">Variable Pautada</th>
                <th style="width: 15%;">Cumple</th>
                <th>Detalles / Enlaces de Implementación</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Sitio Web Oficial</td>
                <td><span class="badge ${org.tieneWeb ? 'badge-yes' : 'badge-no'}">${org.tieneWeb ? 'SÍ' : 'NO'}</span></td>
                <td>${org.enlaceWebGov || '-'}</td>
              </tr>
              <tr>
                <td>Sitio Web Propio (Dominio Propio)</td>
                <td><span class="badge ${org.tieneWebPropia ? 'badge-yes' : 'badge-no'}">${org.tieneWebPropia ? 'SÍ' : 'NO'}</span></td>
                <td>${org.enlaceWebPropia || '-'}</td>
              </tr>
              <tr>
                <td>Guía de Trámites</td>
                <td><span class="badge ${isYes(org.guiaTramites) ? 'badge-yes' : 'badge-no'}">${isYes(org.guiaTramites) ? 'SÍ' : 'NO'}</span></td>
                <td>${org.qTramitesGuia ? `${org.qTramitesGuia} trámites catalogados.` : ''} ${org.enlaceGuia || ''}</td>
              </tr>
              <tr>
                <td>Trámites Online</td>
                <td><span class="badge ${isYes(org.tramitesOnline) ? 'badge-yes' : 'badge-no'}">${isYes(org.tramitesOnline) ? 'SÍ' : 'NO'}</span></td>
                <td>${org.qTramitesOnline ? `${org.qTramitesOnline} trámites online.` : ''} ${org.enlaceTramitesOnline || ''}</td>
              </tr>
              <tr>
                <td>Turnos Online</td>
                <td><span class="badge ${isYes(org.turnosOnline) ? 'badge-yes' : 'badge-no'}">${isYes(org.turnosOnline) ? 'SÍ' : 'NO'}</span></td>
                <td>${org.enlaceTurnosOnline || '-'}</td>
              </tr>
              <tr>
                <td>Seguimiento Digital (Seguimiento de Trámites)</td>
                <td><span class="badge ${isYes(org.seguimientoTramites) ? 'badge-yes' : 'badge-no'}">${isYes(org.seguimientoTramites) ? 'SÍ' : 'NO'}</span></td>
                <td>-</td>
              </tr>
              <tr>
                <td>Atención Digital</td>
                <td><span class="badge ${isYes(org.atencionDigital) ? 'badge-yes' : 'badge-no'}">${isYes(org.atencionDigital) ? 'SÍ' : 'NO'}</span></td>
                <td>-</td>
              </tr>
              <tr>
                <td>Expediente Digital</td>
                <td><span class="badge ${isYes(org.expedienteDigital) ? 'badge-yes' : 'badge-no'}">${isYes(org.expedienteDigital) ? 'SÍ' : 'NO'}</span></td>
                <td>-</td>
              </tr>
              <tr>
                <td>Tienen Firma Digital</td>
                <td><span class="badge ${isYes(org.firmaDigital) ? 'badge-yes' : 'badge-no'}">${isYes(org.firmaDigital) ? 'SÍ' : 'NO'}</span></td>
                <td>${org.resenaFirma || '-'}</td>
              </tr>
              <tr>
                <td>Contratado Doco</td>
                <td><span class="badge ${isYes(org.tieneDoco) ? 'badge-yes' : 'badge-no'}">${isYes(org.tieneDoco) ? 'SÍ' : 'NO'}</span></td>
                <td>-</td>
              </tr>
              <tr>
                <td>Uso de SiiF</td>
                <td><span class="badge ${isYes(org.usaSiif) ? 'badge-yes' : 'badge-no'}">${isYes(org.usaSiif) ? 'SÍ' : 'NO'}</span></td>
                <td>${org.resenaSiif || '-'}</td>
              </tr>
              <tr>
                <td>Analisis de Procesos con Gcia. Innovacion</td>
                <td><span class="badge ${isYes(org.analisisProcesos) ? 'badge-yes' : 'badge-no'}">${isYes(org.analisisProcesos) ? 'SÍ' : 'NO'}</span></td>
                <td>-</td>
              </tr>
              <tr>
                <td>Tienen IA en sus procesos</td>
                <td><span class="badge ${(org.usaIA || org.chatbot) ? 'badge-yes' : 'badge-no'}">${(org.usaIA || org.chatbot) ? 'SÍ' : 'NO'}</span></td>
                <td>${org.resenaIa || ''} ${org.chatbotResena || ''}</td>
              </tr>
            </tbody>
          </table>

          <div class="footer">
            Ficha Técnica de Madurez Digital de la Gerencia de Innovación • Provincia de Corrientes.
          </div>

          <script>
            window.onload = function() {
              window.print();
              setTimeout(function() { window.close(); }, 500);
            }
          </script>
        </body>
      </html>
    `;

    printWindow.document.write(htmlContent);
    printWindow.document.close();
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
                  <React.Fragment key={org.id || i}>
                    <tr className="hover:bg-slate-50/50 dark:hover:bg-slate-800/20 transition-colors">
                      {/* Celda del Organismo (Sticky Left) */}
                      <td className="sticky left-0 z-20 bg-white dark:bg-slate-900 border-b border-r border-slate-200 dark:border-slate-800 text-left min-w-[260px] max-w-[260px] shadow-[3px_0_6px_rgba(0,0,0,0.05)] dark:shadow-[3px_0_6px_rgba(0,0,0,0.2)] p-3">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                            <input
                              type="checkbox"
                              checked={comparedOrgIds.includes(org.id)}
                              onChange={() => onToggleCompare(org.id)}
                              disabled={!comparedOrgIds.includes(org.id) && comparedOrgIds.length >= 3}
                              className="h-3.5 w-3.5 rounded border-slate-350 dark:border-slate-800 text-blue-600 focus:ring-blue-500 cursor-pointer"
                              title={comparedOrgIds.includes(org.id) ? 'Quitar de la comparación' : comparedOrgIds.length >= 3 ? 'Máximo 3 organismos' : 'Agregar al comparador'}
                            />
                            <span 
                              className={`h-2.5 w-2.5 rounded-full shrink-0 ${getStaleness(org).color.split(' ')[0]}`} 
                              title={getStaleness(org).text}
                            />
                            <span className="font-semibold text-slate-800 dark:text-slate-200 leading-tight text-xs block truncate max-w-[170px]" title={org.nombre}>
                              {org.nombre}
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1 mt-0.5">
                            <div className="flex items-center gap-1.5">
                              <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500">
                                {org.tipo || 'Organismo'}
                              </span>
                              <span className="text-[10px] font-bold font-mono bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-1.5 py-0.2 rounded">
                                {score}%
                              </span>
                            </div>
                            <div className="flex items-center gap-1 shrink-0">
                              {onEdit && (
                                <button
                                  onClick={() => onEdit(org)}
                                  className="p-1 text-slate-450 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded transition-colors cursor-pointer"
                                  title={`Editar ${org.nombre}`}
                                >
                                  <Edit className="h-3.5 w-3.5" />
                                </button>
                              )}
                              <button
                                onClick={() => handleToggleExpand(org.id)}
                                className={`p-1 rounded transition-colors cursor-pointer ${
                                  expandedOrgId === org.id 
                                    ? 'text-blue-600 bg-blue-50 dark:text-blue-400 dark:bg-blue-955/40' 
                                    : 'text-slate-450 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                                }`}
                                title="Ver Ficha y Recomendaciones"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>
                            </div>
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

                    {/* Ficha Expandida de Recomendaciones, Logros e Impacto */}
                    {expandedOrgId === org.id && (
                      <tr className="bg-slate-50/50 dark:bg-slate-950/20">
                        <td colSpan={columnsDef.length + 1} className="p-5 border-b border-slate-200 dark:border-slate-800 text-left">
                          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fadeIn">
                            
                            {/* Columna 1: Plan de Acción y Simulador */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm space-y-4">
                              <div className="flex items-center justify-between">
                                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-250 uppercase tracking-wider">
                                  Plan de Acción y Simulador
                                </h4>
                                <span className="text-[10px] font-bold bg-blue-50 dark:bg-blue-955/40 text-blue-700 dark:text-blue-400 px-2 py-0.5 rounded-full font-mono">
                                  Base: {score}%
                                </span>
                              </div>
                              
                              <div className="space-y-2.5 max-h-[220px] overflow-y-auto pr-1">
                                {getMissingIndicators(org).length === 0 ? (
                                  <div className="text-center py-6 text-slate-400 dark:text-slate-500 text-xs italic">
                                    ¡Este organismo ya alcanzó el 100% de madurez!
                                  </div>
                                ) : (
                                  getMissingIndicators(org).map((item) => (
                                    <label key={item.key} className="flex items-start gap-2.5 p-2 rounded-xl border border-slate-100 dark:border-slate-850 hover:bg-slate-50/50 dark:hover:bg-slate-950/50 transition cursor-pointer select-none">
                                      <input
                                        type="checkbox"
                                        checked={!!simulatedKeys[item.key]}
                                        onChange={() => setSimulatedKeys(prev => ({ ...prev, [item.key]: !prev[item.key] }))}
                                        className="mt-0.5 h-3.5 w-3.5 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                                      />
                                      <div className="text-xs">
                                        <span className="font-semibold text-slate-700 dark:text-slate-350 block">{item.label}</span>
                                        <span className="text-[10px] text-blue-600 dark:text-blue-400 font-bold font-mono">+{item.weight}% de madurez</span>
                                      </div>
                                    </label>
                                  ))
                                )}
                              </div>

                              {getMissingIndicators(org).length > 0 && (
                                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between">
                                  <div className="text-xs">
                                    <span className="text-slate-550 dark:text-slate-400 block font-medium">Puntaje Simulado:</span>
                                    <span className="text-[10px] text-slate-400 dark:text-slate-500 block">({Object.values(simulatedKeys).filter(Boolean).length} agregados)</span>
                                  </div>
                                  <div className="text-right">
                                    <span className="text-lg font-black font-mono text-blue-600 dark:text-blue-400 leading-none">
                                      {score + getMissingIndicators(org).reduce((acc, curr) => acc + (simulatedKeys[curr.key] ? curr.weight : 0), 0)}%
                                    </span>
                                    {Object.values(simulatedKeys).some(Boolean) && (
                                      <span className="text-[10px] text-emerald-600 dark:text-emerald-450 font-bold block">
                                        +{getMissingIndicators(org).reduce((acc, curr) => acc + (simulatedKeys[curr.key] ? curr.weight : 0), 0)}% incremento
                                      </span>
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Columna 2: Logros y Insignias */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm space-y-4">
                              <h4 className="font-bold text-xs text-slate-800 dark:text-slate-250 uppercase tracking-wider">
                                Insignias de Logro y Hitos
                              </h4>
                              
                              <div className="space-y-3 max-h-[280px] overflow-y-auto pr-1">
                                {getMedals(org).map((m) => {
                                  const MedalIcon = m.icon;
                                  return (
                                    <div 
                                      key={m.id} 
                                      className={`flex items-start gap-3 p-2.5 rounded-xl border transition-all ${
                                        m.active 
                                          ? 'bg-amber-500/[0.04] border-amber-200 dark:border-amber-900/40 text-amber-900 dark:text-amber-300 font-medium' 
                                          : 'bg-slate-50/50 border-slate-100 dark:border-slate-850 opacity-40 grayscale text-slate-450 dark:text-slate-600'
                                      }`}
                                      title={m.description}
                                    >
                                      <div className={`p-2 rounded-lg shrink-0 ${
                                        m.active 
                                          ? 'bg-amber-100 dark:bg-amber-950/40 text-amber-600 dark:text-amber-400' 
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600'
                                      }`}>
                                        <MedalIcon className="h-4.5 w-4.5" />
                                      </div>
                                      <div className="text-xs leading-tight">
                                        <span className="font-bold block">{m.label}</span>
                                        <span className="text-[10px] text-slate-450 dark:text-slate-500 block mt-0.5 leading-normal">{m.description}</span>
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>

                            {/* Columna 3: Metadata y Impresión */}
                            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-4.5 shadow-sm flex flex-col justify-between h-full gap-4">
                              <div className="space-y-4">
                                <h4 className="font-bold text-xs text-slate-800 dark:text-slate-250 uppercase tracking-wider">
                                  Información y Frescura
                                </h4>

                                <div className="space-y-3">
                                  <div className="p-3 rounded-xl border border-slate-100 dark:border-slate-850 bg-slate-50/50 dark:bg-slate-955/20 text-xs">
                                    <span className="text-slate-500 dark:text-slate-400 block font-medium">Estado del Registro:</span>
                                    <div className="flex items-center gap-2 mt-1.5 font-semibold">
                                      <span className={`h-2.5 w-2.5 rounded-full shrink-0 ${getStaleness(org).color.split(' ')[0]}`} />
                                      <span className={getStaleness(org).color.split(' ').slice(1).join(' ')}>{getStaleness(org).text}</span>
                                    </div>
                                  </div>

                                  <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                                    <div className="p-2.5 border border-slate-100 dark:border-slate-850 rounded-xl">
                                      <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Sincronizado</span>
                                      <span className="font-semibold text-slate-700 dark:text-slate-350 block mt-0.5 truncate" title={org.updatedAt}>
                                        {org.updatedAt ? new Date(org.updatedAt).toLocaleDateString('es-AR') : 'S/D'}
                                      </span>
                                    </div>
                                    <div className="p-2.5 border border-slate-100 dark:border-slate-850 rounded-xl">
                                      <span className="text-[9px] uppercase font-bold text-slate-400 dark:text-slate-500 block">Fuente</span>
                                      <span className="font-semibold text-slate-700 dark:text-slate-300 block mt-0.5 truncate" title={org.fuente || 'Sin Datos'}>
                                        {org.fuente || 'Sin Datos'}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              </div>

                              <div className="space-y-2 pt-4 border-t border-slate-100 dark:border-slate-800/80">
                                <button
                                  onClick={() => handlePrintReport(org)}
                                  className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl shadow shadow-blue-500/15 cursor-pointer transition select-none"
                                >
                                  <Printer className="h-4 w-4" />
                                  Generar Reporte Ficha PDF
                                </button>
                                <p className="text-[10px] text-slate-450 dark:text-slate-500 text-center leading-tight">
                                  Genera una ventana de impresión limpia adecuada para guardar como PDF o imprimir.
                                </p>
                              </div>

                            </div>

                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
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

