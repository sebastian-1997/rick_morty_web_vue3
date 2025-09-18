// services/api.ts
import axios from "axios"

const api = axios.create({
  baseURL: "https://rickandmortyapi.com/api", // URL base de la API
  timeout: 10000, // opcional: tiempo máximo de espera
})

export default api
