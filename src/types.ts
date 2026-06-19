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
  atencionDigital: string;
  seguimientoTramites: string;
  
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
}
