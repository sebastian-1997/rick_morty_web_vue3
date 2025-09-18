
import api from "./api"

export const getCharacters = async (page: number = 1) => {
  const { data } = await api.get(`/character?page=${page}`)
  return data
}

// Nueva función para búsqueda por nombre
export const searchCharacters = async (name: string) => {
  const { data } = await api.get(`/character?name=${encodeURIComponent(name)}`)
  return data
}

// Traer todos los personajes de todas las páginas
export const getAllCharacters = async () => {
  let results: any[] = []
  let page = 1
  let totalPages = 1

  do {
    const res = await getCharacters(page)  
    results.push(...res.results)
    totalPages = res.info.pages
    page++
  } while (page <= totalPages)

  return results
}


//obtener varios personajes por IDs
export const getCharactersByIds = async (ids: number[] | number) => {
  const { data } = await api.get(`/character/${Array.isArray(ids) ? ids.join(",") : ids}`);
  return data;
};


