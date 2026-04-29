import { RefObject, useEffect, useRef, useState } from 'react'
import mapboxgl from 'mapbox-gl'

export function useMapbox(containerRef: RefObject<HTMLDivElement>) {
  const mapRef = useRef<mapboxgl.Map | null>(null)
  const [isLoaded, setIsLoaded] = useState(false)

  useEffect(() => {
    const token = import.meta.env.VITE_MAPBOX_TOKEN
    if (!containerRef.current || mapRef.current || !token) return
    mapboxgl.accessToken = token
    mapRef.current = new mapboxgl.Map({
      container: containerRef.current,
      style: 'mapbox://styles/mapbox/satellite-streets-v12',
      center: [-74.01, 40.71],
      zoom: 10,
      pitch: 45,
      bearing: 0,
      antialias: true,
    })
    mapRef.current.on('load', () => setIsLoaded(true))
    return () => {
      mapRef.current?.remove()
      mapRef.current = null
      setIsLoaded(false)
    }
  }, [containerRef])

  return { map: mapRef.current, isLoaded }
}
