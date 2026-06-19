export interface Organismo {
  nombre: string;
  tipo: string;
  tieneWeb: boolean;
  enlaceWeb: string;
  enlaceWebGov: string;
  tieneWebPropia: boolean;
  enlaceWebPropia: string;
  dateActualizacion: string;
  guiaTramites: 'Tiene' | 'No' | string;
  enlaceGuia: string;
  qTramitesGuia: number;
  tramitesOnline: 'Tiene' | 'No' | string;
  enlaceTramitesOnline: string;
  expedienteDigital: 'Tiene' | 'No' | string;
  usaIA: boolean;
  chatbot: boolean;
  turnosOnline: 'Tiene' | 'No' | string;
  seguimientoTramites: 'Tiene' | 'No' | string;
  atencionDigital: 'Tiene' | 'No' | string;
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
