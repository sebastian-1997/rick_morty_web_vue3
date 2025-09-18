<template>
  <section
    id="episodes-section"
    class="relative bg-gradient-to-b from-[#0a0a0a] via-[#150a1a] to-[#2b0d20] text-white py-12 px-4 md:px-16"
  >
    <!-- Hero episodio destacado -->
    <div
      v-if="highlightEpisode"
      class="relative w-full h-64 md:h-72 lg:h-80 rounded-2xl overflow-hidden shadow-neon mb-10 group bg-cover bg-center"
      :style="{ backgroundImage: `url(${highlightEpisode.image})` }"
    >
      <div
        class="absolute inset-0 bg-gradient-to-tr from-black/80 via-black/40 to-transparent flex flex-col justify-end p-6 md:p-10"
      >
        <h2 class="text-2xl md:text-4xl font-display font-bold neon-text mb-2">
          {{ highlightEpisode.name }}
        </h2>
        <div
          class="flex flex-col md:flex-row md:items-center md:gap-6 text-gray-200 text-xs md:text-sm mb-3"
        >
          <p><span class="font-semibold">Air Date:</span> {{ highlightEpisode.air_date }}</p>
          <p><span class="font-semibold">Episode Code:</span> {{ highlightEpisode.episode }}</p>
        </div>
        <button
          @click="selectedEpisode = highlightEpisode"
          class="px-5 py-2 bg-yellow-300 text-black font-semibold rounded-full hover:scale-105 transition-transform neon-border w-fit text-sm"
        >
          Ver detalles
        </button>
      </div>
    </div>

    <!-- Barra de temporadas -->
    <div class="flex justify-center gap-3 flex-wrap mb-8">
      <button
        v-for="season in totalSeasons"
        :key="season"
        @click="setSeason(season)"
        :class="[
          'px-4 py-1.5 rounded-full font-display text-sm transition-all duration-300',
          selectedSeason === season
            ? 'bg-gradient-to-r from-yellow-400 to-yellow-200 text-black neon-border scale-105'
            : 'bg-black/40 text-gray-300 hover:bg-yellow-300 hover:text-black'
        ]"
      >
        Temporada {{ season }}
      </button>
    </div>

    <!-- Carrusel de episodios con vue3-carousel -->
    <Carousel
      v-if="seasonEpisodes.length"
      :items-to-show="3"
      :wrap-around="true"
      :transition="800"
      :autoplay="3000"
      pause-autoplay-on-hover
      class="px-2 md:px-8"
    >
      <Slide
        v-for="episode in seasonEpisodes"
        :key="episode.id"
        class="px-1"
      >
        <div
          class="relative group cursor-pointer rounded-xl overflow-hidden bg-black/60 backdrop-blur-md shadow-lg transform transition-all duration-300 hover:scale-105 hover:shadow-neon w-44 md:w-52"
          @click="selectedEpisode = episode"
        >
          <!-- Imagen -->
          <div class="h-28 md:h-32 w-full overflow-hidden">
            <img
              v-if="episode.previewImage"
              :src="episode.previewImage"
              :alt="episode.name"
              class="w-full h-full object-cover"
              loading="lazy"
            />
            <div
              v-else
              class="h-full w-full bg-gray-700 flex items-center justify-center text-gray-400 text-sm"
            >
              Sin imagen
            </div>
          </div>

          <!-- Info -->
          <div class="p-3">
            <h3 class="text-yellow-300 font-display text-sm md:text-base truncate mb-1">
              {{ episode.name }}
            </h3>
            <p class="text-gray-300 text-xs mb-2">
              <span class="font-semibold">Code:</span> {{ episode.episode }}
            </p>
            <div class="flex -space-x-2">
              <img
                v-for="char in episode.characters.slice(0, 3)"
                :key="char.id"
                :src="char.image"
                :alt="char.name"
                class="w-6 h-6 md:w-7 md:h-7 rounded-full border-2 border-black hover:scale-110 transition-transform"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </Slide>

      <!-- Controles -->
      <template #addons>
        <Navigation />
        <Pagination />
      </template>
    </Carousel>

    <!-- Panel lateral episodio -->
    <transition name="slide">
      <div
        v-if="selectedEpisode"
        class="fixed top-16 md:top-20 right-0 w-full md:w-1/3 lg:w-1/4 bg-black/80 backdrop-blur-lg rounded-l-2xl text-white z-50 overflow-y-auto shadow-neon p-6 custom-scroll"
      >
        <button
          @click="selectedEpisode = null"
          class="absolute top-4 right-4 text-gray-400 hover:text-white text-2xl"
        >
          ✕
        </button>
        <h2 class="text-xl md:text-2xl font-display mb-4 neon-text">
          {{ selectedEpisode.name }}
        </h2>
        <p class="text-gray-200 mb-1 text-sm">
          <span class="font-semibold">Air Date:</span> {{ selectedEpisode.air_date }}
        </p>
        <p class="text-gray-200 mb-4 text-sm">
          <span class="font-semibold">Episode Code:</span> {{ selectedEpisode.episode }}
        </p>

        <h3 class="text-lg font-display mb-3 neon-text">Personajes</h3>
        <ul class="grid grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2 custom-scroll">
          <li
            v-for="char in selectedEpisode.characters"
            :key="char.id"
            class="flex items-center gap-2 p-2 rounded-lg bg-white/5 hover:bg-yellow-300/10 transition shadow-sm backdrop-blur-sm"
          >
            <img
              :src="char.image"
              :alt="char.name"
              class="w-10 h-10 rounded-full border border-yellow-300"
              loading="lazy"
            />
            <span class="text-gray-200 text-sm truncate">{{ char.name }}</span>
          </li>
        </ul>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { getAllEpisodes } from '@/services/episodes'
import type { EpisodeWithCharacters } from '@/services/episodes'

// Vue3-carousel
import 'vue3-carousel/dist/carousel.css'
import { Carousel, Slide, Navigation, Pagination } from 'vue3-carousel'

const episodes = ref<EpisodeWithCharacters[]>([])
const selectedEpisode = ref<EpisodeWithCharacters | null>(null)
const selectedSeason = ref(1)
const totalSeasons = [1, 2, 3, 4, 5]

// Hero destacado
const highlightEpisode = computed(() => {
  const episode = episodes.value.find(
    ep => parseInt(ep.episode.substring(1, 3)) === selectedSeason.value
  )
  if (!episode) return null
  const randomChar = episode.characters[Math.floor(Math.random() * episode.characters.length)]
  return { ...episode, image: randomChar?.image || '/placeholder-episode.jpg' }
})

// Episodios filtrados de temporada
const seasonEpisodes = computed(() =>
  episodes.value
    .filter(ep => parseInt(ep.episode.substring(1, 3)) === selectedSeason.value)
    .map(ep => {
      const randomChar = ep.characters[Math.floor(Math.random() * ep.characters.length)]
      return { ...ep, previewImage: randomChar?.image || null }
    })
)

onMounted(async () => {
  episodes.value = await getAllEpisodes()
})

const setSeason = (season: number) => {
  selectedSeason.value = season
}
</script>

<style scoped>
.neon-text {
  text-shadow: 0 0 5px #ffea00, 0 0 10px #ffea00, 0 0 20px #ffea00;
}
.neon-border {
  box-shadow: 0 0 5px #ffea00, 0 0 10px #ffea00, 0 0 20px #ffea00;
}
.shadow-neon {
  box-shadow: 0 0 10px #ffea00, 0 0 20px #ffea00, 0 0 40px #ffea00;
}
.custom-scroll::-webkit-scrollbar {
  width: 6px;
}
.custom-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(to bottom, #ffea00, #ff0099);
  border-radius: 10px;
}
.custom-scroll::-webkit-scrollbar-track {
  background: transparent;
}
</style>
