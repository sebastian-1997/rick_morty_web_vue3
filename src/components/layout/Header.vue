<template>
  <header
    :class="['fixed top-0 left-0 w-full z-50 transition-all duration-300']"
    @mouseenter="hovered = true"
    @mouseleave="hovered = false"
    :style="{
      background: scrolled ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.8)',
      backdropFilter: 'blur(10px)',
      opacity: hovered || !scrolled ? 1 : 0.85
    }"
  >
    <div class="max-w-screen-xl mx-auto px-6 flex items-center justify-between py-4">

      <!-- Logo -->
      <div class="flex-shrink-0">
        <img :src="logo" alt="Logo" class="h-10 w-auto" />
      </div>

      <!-- Menú desktop -->
      <nav class="hidden md:flex flex-1 justify-center">
        <ul class="flex gap-6">
          <li v-for="link in navLinks" :key="link.href">
            <button
              class="text-yellow-400 font-display hover:text-yellow-300 transition-colors duration-200 cursor-pointer"
              @click="scrollToSection(link.href)"
            >
              {{ link.label }}
            </button>
          </li>
        </ul>
      </nav>

      <!-- Buscador desktop -->
      <div class="hidden md:block relative">
        <input
          type="text"
          placeholder="Buscar personaje..."
          v-model="searchQuery"
          @input="handleSearch"
          class="px-4 py-2 rounded-full border border-yellow-300 focus:ring-2 focus:ring-yellow-300 focus:outline-none w-64 font-sans placeholder-yellow-300"
        />

        <!-- Dropdown resultados -->
        <ul
          v-if="searchResults.length"
          class="absolute top-full mt-2 w-full bg-black/90 text-white rounded-lg shadow-lg max-h-64 overflow-y-auto z-50 neon-scroll"
        >
          <li
            v-for="char in searchResults"
            :key="char.id"
            class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-yellow-300/20 transition-colors"
            @click="openModal(char)"
          >
            <img :src="char.image" alt="" class="w-10 h-10 rounded-full border border-yellow-300 neon-border"/>
            <span>{{ char.name }}</span>
          </li>
        </ul>
      </div>

      <!-- Botones móviles -->
      <div class="flex md:hidden gap-4">
        <button @click="searchOpen = !searchOpen" class="text-white hover:text-yellow-300">🔍</button>
        <button @click="menuOpen = !menuOpen" class="text-white hover:text-yellow-300">☰</button>
      </div>

    </div>

    <!-- Menú móvil -->
    <transition name="slide-down">
      <div v-show="menuOpen" class="md:hidden bg-black/80 backdrop-blur-lg shadow-lg rounded-b-lg">
        <ul class="flex flex-col gap-2 p-4">
          <li v-for="link in navLinks" :key="link.href">
            <button
              class="text-white font-display w-full text-center py-2 hover:text-yellow-300"
              @click="scrollToSection(link.href); menuOpen = false"
            >
              {{ link.label }}
            </button>
          </li>
        </ul>
      </div>
    </transition>

    <!-- Buscador móvil -->
    <transition name="slide-down">
      <div v-show="searchOpen && !menuOpen" class="md:hidden bg-black/90 p-4 shadow-lg rounded-lg">
        <input
          type="text"
          placeholder="Buscar personaje..."
          v-model="searchQuery"
          @input="handleSearch"
          class="px-4 py-2 rounded-full border border-yellow-300 focus:ring-2 focus:ring-yellow-300 focus:outline-none w-full font-sans placeholder-yellow-300 text-yellow-300"
        />
        <ul
          v-if="searchResults.length"
          class="mt-2 w-full bg-black/90 text-white rounded-lg shadow-lg max-h-64 overflow-y-auto neon-scroll"
        >
          <li
            v-for="char in searchResults"
            :key="char.id"
            class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-yellow-300/20 transition-colors"
            @click="openModal(char)"
          >
            <img :src="char.image" alt="" class="w-10 h-10 rounded-full border border-yellow-300 neon-border"/>
            <span>{{ char.name }}</span>
          </li>
        </ul>
      </div>
    </transition>

  </header>

  <!-- Modal personaje -->
  <transition name="fade">
    <div
      v-if="selectedCharacter"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
    >
      <div class="bg-black/20 backdrop-blur-lg text-white rounded-2xl shadow-neon p-8 max-w-md w-full relative border border-yellow-300 animate-modal">
        <button
          @click="selectedCharacter = null"
          class="absolute top-3 right-3 text-gray-400 hover:text-white text-xl"
        >
          ✕
        </button>

        <img
          :src="selectedCharacter.image"
          :alt="selectedCharacter.name"
          class="w-40 h-40 rounded-full mx-auto border-4 border-yellow-300 shadow-lg neon-border mb-4"
        />

        <h2 class="text-2xl font-display text-center mb-2 neon-text">{{ selectedCharacter.name }}</h2>
        <p class="font-sans text-center text-gray-100 mb-6">
          <span class="capitalize">{{ selectedCharacter.species }}</span> · {{ selectedCharacter.status }}
        </p>
        <div class="space-y-2 font-sans text-gray-100">
          <p><span class="font-semibold">Género:</span> {{ selectedCharacter.gender }}</p>
          <p><span class="font-semibold">Origen:</span> {{ selectedCharacter.origin?.name }}</p>
          <p><span class="font-semibold">Ubicación:</span> {{ selectedCharacter.location?.name }}</p>
        </div>
      </div>
    </div>
  </transition>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import logo from '@/assets/logo.png'
import { searchCharacters } from '@/services/characters'

const navLinks = [
  { label: 'Inicio', href: 'hero-section' },
  { label: 'Personajes', href: 'characters-section' },
  { label: 'Episodios', href: 'episodes-section' },
  { label: 'Locaciones', href: 'locations-section' }
]

const scrolled = ref(false)
const hovered = ref(false)
const menuOpen = ref(false)
const searchOpen = ref(false)
const searchQuery = ref('')
const searchResults = ref<any[]>([])
const selectedCharacter = ref<any | null>(null)

function handleScroll() { scrolled.value = window.scrollY > 50 }

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return
  const offset = 80
  const top = el.getBoundingClientRect().top + window.scrollY - offset
  window.scrollTo({ top, behavior: 'smooth' })
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  const data = await searchCharacters(searchQuery.value)
  searchResults.value = data.results.slice(0,5)
}

function openModal(character: any) {
  selectedCharacter.value = character
  searchResults.value = []
  searchOpen.value = false
  menuOpen.value = false
}

onMounted(() => window.addEventListener('scroll', handleScroll))
onUnmounted(() => window.removeEventListener('scroll', handleScroll))
</script>

<style scoped>
/* Animaciones slide */
.slide-down-enter-active,
.slide-down-leave-active { transition: max-height 0.3s ease, opacity 0.3s ease; }
.slide-down-enter-from,
.slide-down-leave-to { max-height: 0; opacity: 0; }
.slide-down-enter-to,
.slide-down-leave-from { max-height: 500px; opacity: 1; }

.fade-enter-active,
.fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
.fade-enter-to,
.fade-leave-from { opacity: 1; }

/* Neon text y borders */
.neon-text { text-shadow:0 0 2px #fcf259,0 0 5px #fcf259,0 0 10px #fcf259,0 0 20px #fcf259; }
.neon-border { box-shadow:0 0 5px #fcf259,0 0 10px #fcf259,0 0 15px #fcf259; }
.shadow-neon { box-shadow:0 0 10px #fcf259/50,0 0 20px #fcf259/30; }

/* Modal animado */
.animate-modal { animation: modalAppear 0.3s ease forwards; }
@keyframes modalAppear { 0% { opacity: 0; transform: scale(0.95);} 100% { opacity: 1; transform: scale(1);} }

/* Input texto y placeholder */
header input[type="text"] {
  color: #fcf259;
  caret-color: #fcf259;
  background-color: rgba(0,0,0,0.8);
}

header input::placeholder {
  color: #fef9c3;
}

/* Scroll neon */
.neon-scroll::-webkit-scrollbar {
  width: 6px;
}
.neon-scroll::-webkit-scrollbar-track {
  background: rgba(255,255,255,0.05);
}
.neon-scroll::-webkit-scrollbar-thumb {
  background-color: #fcf259;
  border-radius: 10px;
  border: 2px solid rgba(0,0,0,0);
}

/* Firefox */
.neon-scroll {
  scrollbar-width: thin;
  scrollbar-color: #fcf259 rgba(255,255,255,0.05);
}
</style>
