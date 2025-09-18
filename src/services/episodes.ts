import api from './api'
import { getAllCharacters } from './characters'

// Interfaz interna para los episodios con personajes completos
export interface EpisodeWithCharacters {
  id: number
  name: string
  air_date: string
  episode: string
  characters: { id: number; name: string; image: string }[]
}

// Función que trae todos los episodios con personajes completos
export const getAllEpisodes = async (): Promise<EpisodeWithCharacters[]> => {
  let episodes: any[] = []
  let url = '/episode'

  try {
    // Traer todos los episodios paginados
    while (url) {
      const res = await api.get(url)
      episodes = [...episodes, ...res.data.results]
      url = res.data.info.next?.replace('https://rickandmortyapi.com/api','') || ''
    }

    // Traer todos los personajes
    const allCharacters = await getAllCharacters()

    // Mapear URLs de personajes a objetos {id,name,image}
    const episodesWithCharacters: EpisodeWithCharacters[] = episodes.map(ep => {
      const chars = ep.characters.map((url:string) => {
        const id = parseInt(url.split('/').pop()!)
        return allCharacters.find(c => c.id === id)
      }).filter(Boolean) as {id:number,name:string,image:string}[]

      return { ...ep, characters: chars }
    })

    return episodesWithCharacters

  } catch (error) {
    console.error('Error fetching episodes', error)
    return []
  }
}
