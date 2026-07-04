export interface Organismo {
  id: number;
  nombre: string;
  tipo: string;
  tieneWeb: boolean;
  enlaceWeb: string;
  enlaceWebGov: string;
  tieneWebPropia: boolean;
  enlaceWebPropia: string;
  
  guiaTramites: string;
  enlaceGuia: string;
  qTramitesGuia: number;
  
  tramitesOnline: string;
  enlaceTramitesOnline: string;
  qTramitesOnline: number;

  iniciarTramOnline: string;
  enlaceIniciarTramOnline: string;
  qIniciarTramOnline: number;

  expedienteDigital: string;
  turnosOnline: string;
  enlaceTurnosOnline?: string;
  atencionDigital: string;
  seguimientoTramites: string;
  
  // Nuevas Variables Solicitadas
  firmaDigital: string;
  analisisProcesos: string;
  tieneDoco: string;
  usaSiif: string;

  // Reseñas y Metadatos agregados
  resenaSiif?: string;
  resenaFirma?: string;
  chatbotNombre?: string;
  chatbotResena?: string;

  capacitacion: string;
  capacitacionDigital: string;
  usaIA: boolean;
  chatbot: boolean;
  
  fuente: string;
  nivelConfianza: string;
  completitud: string;

  
  dateActualizacion?: string; // Kept for backward compatibility
}

export interface Stats {
  total: number;
  conWeb: number;
  conWebPropia: number;
  conGuia: number;
  conTramitesOnline: number;
  conTurnosOnline: number;
  conExpedienteDigital: number;
  conChatbotOrIA: number;
  conSeguimiento: number;
  conFirmaDigital: number;
  conAnalisisProcesos: number;
  conDoco: number;
  conSiif: number;
}

export interface FilterState {
  search: string;
  tipo: string;
  tieneWeb: boolean;
  tieneWebPropia: boolean;
  guiaTramites: boolean;
  tramitesOnline: boolean;
  turnosOnline: boolean;
  expedienteDigital: boolean;
  usaIAOrChatbot: boolean;
  firmaDigital: boolean;
  analisisProcesos: boolean;
  tieneDoco: boolean;
  usaSiif: boolean;
}
