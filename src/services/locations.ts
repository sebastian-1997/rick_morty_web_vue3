// services/locations.ts
import api from "./api"

export interface Resident {
  id: number
  name: string
  image: string
}

export interface Location {
  id: number
  name: string
  type: string
  dimension: string
  residents: Resident[]
}

// 🔹 Helper para procesar los residentes
const fetchResidents = async (residentUrls: string[]): Promise<Resident[]> => {
  if (!residentUrls.length) return []

  // Extraemos los IDs de las URLs
  const ids = residentUrls
    .map((url) => url.split("/").pop())
    .filter(Boolean)
    .join(",")

  const { data } = await api.get(`/character/${ids}`)

  if (Array.isArray(data)) {
    return data.map((char) => ({
      id: char.id,
      name: char.name,
      image: char.image,
    }))
  }

  return [
    {
      id: data.id,
      name: data.name,
      image: data.image,
    },
  ]
}

// 🔹 Obtener lista de locaciones con paginación
export const getLocations = async (page: number = 1) => {
  const { data } = await api.get<{ info: any; results: any[] }>(
    `/location?page=${page}`
  )

  const results: Location[] = await Promise.all(
    data.results.map(async (loc) => ({
      id: loc.id,
      name: loc.name,
      type: loc.type,
      dimension: loc.dimension,
      residents: await fetchResidents(loc.residents),
    }))
  )

  return {
    info: data.info,
    results,
  }
}

// 🔹 Buscar locaciones por nombre
export const searchLocations = async (name: string) => {
  const { data } = await api.get<{ info: any; results: any[] }>(
    `/location?name=${encodeURIComponent(name)}`
  )

  const results: Location[] = await Promise.all(
    data.results.map(async (loc) => ({
      id: loc.id,
      name: loc.name,
      type: loc.type,
      dimension: loc.dimension,
      residents: await fetchResidents(loc.residents),
    }))
  )

  return {
    info: data.info,
    results,
  }
}
