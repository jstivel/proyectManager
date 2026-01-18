import { MapState, MapAction, Infraestructura } from '@/types'
import { useReducer } from 'react'

export const initialMapState: MapState = {
  selectedFeature: null,
  showLayersPanel: false,
  showSearchPanel: false,
  selectedLayers: [],
  mapViewport: {
    latitude: 4.5709,
    longitude: -74.2973,
    zoom: 5
  }
}

export function mapReducer(state: MapState, action: MapAction): MapState {
  switch (action.type) {
    case 'TOGGLE_PANEL':
      if (action.panel === 'layers') {
        return {
          ...state,
          showLayersPanel: !state.showLayersPanel,
          showSearchPanel: false
        }
      } else if (action.panel === 'search') {
        return {
          ...state,
          showSearchPanel: !state.showSearchPanel,
          showLayersPanel: false
        }
      }
      return state

    case 'SET_SELECTION':
      return {
        ...state,
        selectedFeature: action.payload
      }

    case 'TOGGLE_LAYER':
      const layerId = action.layerId
      const isSelected = state.selectedLayers.includes(layerId)
      
      return {
        ...state,
        selectedLayers: isSelected
          ? state.selectedLayers.filter(id => id !== layerId)
          : [...state.selectedLayers, layerId]
      }

    case 'SET_VIEWPORT':
      return {
        ...state,
        mapViewport: {
          ...state.mapViewport,
          ...action.payload
        }
      }

    case 'RESET_MAP':
      return initialMapState

    default:
      return state
  }
}

// Selectores para obtener estado específico
export const mapSelectors = {
  getSelectedFeature: (state: MapState) => state.selectedFeature,
  isLayerSelected: (state: MapState, layerId: string) => 
    state.selectedLayers.includes(layerId),
  isAnyPanelOpen: (state: MapState) => 
    state.showLayersPanel || state.showSearchPanel,
  getMapCenter: (state: MapState) => ({
    latitude: state.mapViewport.latitude,
    longitude: state.mapViewport.longitude
  }),
  getZoom: (state: MapState) => state.mapViewport.zoom
}

// Action creators para acciones comunes
export const mapActionCreators = {
  toggleLayersPanel: (): MapAction => ({
    type: 'TOGGLE_PANEL',
    panel: 'layers'
  }),
  
  toggleSearchPanel: (): MapAction => ({
    type: 'TOGGLE_PANEL',
    panel: 'search'
  }),
  
  selectFeature: (feature: Infraestructura | null): MapAction => ({
    type: 'SET_SELECTION',
    payload: feature
  }),
  
  toggleLayer: (layerId: string): MapAction => ({
    type: 'TOGGLE_LAYER',
    layerId
  }),
  
  updateViewport: (viewport: Partial<MapState['mapViewport']>): MapAction => ({
    type: 'SET_VIEWPORT',
    payload: viewport
  }),
  
  resetMap: (): MapAction => ({
    type: 'RESET_MAP'
  })
}

// Hook personalizado para usar el estado del mapa
export function useMapState(initialState?: Partial<MapState>) {
  const [state, dispatch] = useReducer(
    mapReducer,
    {
      ...initialMapState,
      ...initialState
    }
  )

  // Wrappers para las acciones con tipado
  const actions = {
    toggleLayersPanel: () => dispatch(mapActionCreators.toggleLayersPanel()),
    toggleSearchPanel: () => dispatch(mapActionCreators.toggleSearchPanel()),
    selectFeature: (feature: Infraestructura | null) => 
      dispatch(mapActionCreators.selectFeature(feature)),
    toggleLayer: (layerId: string) => 
      dispatch(mapActionCreators.toggleLayer(layerId)),
    updateViewport: (viewport: Partial<MapState['mapViewport']>) => 
      dispatch(mapActionCreators.updateViewport(viewport)),
    resetMap: () => dispatch(mapActionCreators.resetMap())
  }

  return {
    state,
    actions,
    // Selectores para acceso conveniente
    selectors: {
      getSelectedFeature: () => mapSelectors.getSelectedFeature(state),
      isLayerSelected: (layerId: string) => mapSelectors.isLayerSelected(state, layerId),
      isAnyPanelOpen: () => mapSelectors.isAnyPanelOpen(state),
      getMapCenter: () => mapSelectors.getMapCenter(state),
      getZoom: () => mapSelectors.getZoom(state)
    }
  }
}