export interface User {
  id: string;
  email?: string;
  created_at: string;
  user_metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  rol_id: number;
  rol_nombre: string;
  organizacion_id: string | null;
  organizacion_nombre: string | null;
  activo: boolean;
  nombre: string | null;
  apellido: string | null;
}

export interface AuthContextType {
  user: User | null;
  perfil: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
}

export interface Organizacion {
  id: string;
  nombre: string;
  nit: string;
  pm_id: string;
  pm_email: string;
  activo: boolean;
  created_at: string;
  proyectos_count?: number;
  usuarios_count?: number;
}

export interface Proyecto {
  id: string;
  nombre: string;
  organizacion_id: string;
  descripcion: string | null;
  estado: string;
  created_at: string;
  infraestructuras_count?: number;
}

export interface Infraestructura {
  id: string;
  nombre: string;
  proyecto_id: string;
  tipo: string;
  latitud: number;
  longitud: number;
  estado: string;
  descripcion: string | null;
  created_at: string;
  properties?: Record<string, any>;
}

export interface CreateOrgPayload {
  nombre: string;
  nit: string;
  pmEmail: string;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface MapState {
  selectedFeature: Infraestructura | null;
  showLayersPanel: boolean;
  showSearchPanel: boolean;
  selectedLayers: string[];
  mapViewport: {
    latitude: number;
    longitude: number;
    zoom: number;
  };
}

export type MapAction = 
  | { type: 'TOGGLE_PANEL'; panel: 'layers' | 'search' }
  | { type: 'SET_SELECTION'; payload: Infraestructura | null }
  | { type: 'TOGGLE_LAYER'; layerId: string }
  | { type: 'SET_VIEWPORT'; payload: Partial<MapState['mapViewport']> }
  | { type: 'RESET_MAP' }
  | { type: 'SET_INITIAL_STATE'; payload: MapState };

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  message?: string;
}

export interface ApiError {
  message: string;
  code?: string;
  details?: Record<string, any>;
}

export interface QueryOptions {
  staleTime?: number;
  cacheTime?: number;
  refetchOnWindowFocus?: boolean;
  retry?: number | boolean;
}

export interface MutationOptions<TData, TError, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: TError, variables: TVariables) => void;
  onMutate?: (variables: TVariables) => Promise<any> | any;
  onSettled?: (data: TData | undefined, error: TError | null, variables: TVariables) => void;
}