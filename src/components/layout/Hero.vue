<template>
  <section id="hero-section"
    class="bg-gradient-to-r from-[#0d0d12] via-[#1a002b] to-[#0d0d12] py-20 px-8 relative overflow-hidden">
    <div class="max-w-screen-xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
      <!-- Texto -->
      <div class="space-y-6 text-center md:text-left z-10 relative">
        <h1 class="font-display text-4xl md:text-6xl font-extrabold text-white leading-tight neon-text pulse-neon-text">
          Explora el universo de
          <span class="text-[#3b82f6] neon-text pulse-neon-text">Rick and Morty</span>
        </h1>
        <p class="font-sans text-lg text-gray-200 drop-shadow-md">
          Descubre personajes, episodios y locaciones de una de las series más
          épicas del multiverso.
        </p>
        <n-button class="font-sans shadow-neon" type="primary" size="large" round
          style="background-color:#3b82f6; color:#0d0d12; text-shadow:0 0 5px #3b82f6" @click="searchModal = true">
          Explorar personajes
        </n-button>
      </div>

      <!-- Imagen -->
      <div class="flex md:justify-center relative z-10">
        <img src="@/assets/fondo2.png" alt="Rick and Morty"
          class="w-80 md:w-[28rem] drop-shadow-[0_10px_30px_rgba(59,130,246,0.5)] transform hover:scale-105 transition-transform duration-500" />
      </div>

      <!-- Efectos de fondo animados -->
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(63,191,255,0.15),transparent)] pointer-events-none animate-neonPulse1">
      </div>
      <div
        class="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,rgba(200,0,255,0.15),transparent)] pointer-events-none animate-neonPulse2">
      </div>
    </div>

    <!-- 🔹 Modelo 3D encima de todo -->
    <HeroScene class="absolute inset-0 w-full h-full z-50 pointer-events-none" />

    <!-- 🔹 Modal buscador -->
    <transition name="fade">
      <div v-if="searchModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div
          class="bg-black/30 backdrop-blur-lg text-white rounded-2xl shadow-neon p-6 max-w-lg w-full relative border border-[#3b82f6] animate-modal">
          <button @click="closeSearch" class="absolute top-1 right-2 text-gray-400 hover:text-white text-xl">
            ✕
          </button>

          <!-- Input -->
          <input type="text" placeholder="Buscar personaje..." v-model="searchQuery" @input="handleSearch"
            class="w-full px-4 py-2 rounded-full border border-[#3b82f6] focus:ring-2 focus:ring-[#3b82f6] focus:outline-none font-sans text-white placeholder-gray-300" />

          <!-- Resultados -->
          <ul v-if="searchResults.length"
            class="mt-4 w-full bg-black/80 text-white rounded-lg shadow-lg max-h-64 overflow-y-auto custom-scroll">
            <li v-for="char in searchResults" :key="char.id"
              class="flex items-center gap-3 px-4 py-2 cursor-pointer hover:bg-[#3b82f6]/20 transition-colors"
              @click="openModal(char)">
              <img :src="char.image" alt="" class="w-10 h-10 rounded-full border border-[#3b82f6] neon-border" />
              <span>{{ char.name }}</span>
            </li>
          </ul>
        </div>
      </div>
    </transition>

    <!--Modal personaje -->
    <transition name="fade">
      <div v-if="selectedCharacter"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div
          class="bg-black/20 backdrop-blur-lg text-white rounded-2xl shadow-neon p-8 max-w-md w-full relative border border-[#3b82f6] animate-modal">
          <button @click="selectedCharacter = null"
            class="absolute top-3 right-3 text-gray-400 hover:text-white text-xl">
            ✕
          </button>

          <img :src="selectedCharacter.image" :alt="selectedCharacter.name"
            class="w-40 h-40 rounded-full mx-auto border-4 border-[#3b82f6] shadow-lg neon-border mb-4" />

          <h2 class="text-2xl font-display text-center mb-2 neon-text pulse-neon-text">
            {{ selectedCharacter.name }}
          </h2>
          <p class="font-sans text-center text-gray-100 mb-6">
            <span class="capitalize">{{ selectedCharacter.species }}</span> ·
            {{ selectedCharacter.status }}
          </p>
          <div class="space-y-2 font-sans text-gray-100">
            <p>
              <span class="font-semibold">Género:</span>
              {{ selectedCharacter.gender }}
            </p>
            <p>
              <span class="font-semibold">Origen:</span>
              {{ selectedCharacter.origin?.name }}
            </p>
            <p>
              <span class="font-semibold">Ubicación:</span>
              {{ selectedCharacter.location?.name }}
            </p>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import HeroScene from "@/components/HeroScene.vue";
import { ref } from "vue"
import { NButton } from "naive-ui"
import { searchCharacters } from "@/services/characters"

const searchModal = ref(false)
const searchQuery = ref("")
const searchResults = ref<any[]>([])
const selectedCharacter = ref<any | null>(null)

function closeSearch() {
  searchModal.value = false
  searchQuery.value = ""
  searchResults.value = []
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    searchResults.value = []
    return
  }
  const data = await searchCharacters(searchQuery.value)
  searchResults.value = data.results.slice(0, 5)
}

function openModal(character: any) {
  selectedCharacter.value = character
  searchResults.value = []
  searchModal.value = false
}
</script>

<style scoped>
/* Glow neón azul */
.neon-text {
  text-shadow: 0 0 2px #3b82f6, 0 0 6px #3b82f6, 0 0 12px #3b82f6, 0 0 20px #3b82f6;
}

.pulse-neon-text {
  animation: neonTextPulse 8s ease-in-out infinite;
}

@keyframes neonTextPulse {
  0%,100% { text-shadow: 0 0 2px #3b82f6, 0 0 6px #3b82f6; }
  50% { text-shadow: 0 0 4px #3b82f6, 0 0 10px #3b82f6; }
}


.shadow-neon {
  box-shadow: 0 0 5px #3b82f6, 0 0 10px #3b82f6, 0 0 15px #3b82f6;
}

.neon-border {
  box-shadow: 0 0 5px #3b82f6, 0 0 10px #3b82f6, 0 0 15px #3b82f6;
}

/* Modal animado */
.animate-modal {
  animation: modalAppear 0.3s ease forwards;
}

@keyframes modalAppear {
  0% { opacity: 0; transform: scale(0.95); }
  100% { opacity: 1; transform: scale(1); }
}

/* Fade transición */
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to { opacity: 0; }
.fade-enter-to,
.fade-leave-from { opacity: 1; }

/* Animaciones de pulsación de fondo */
@keyframes neonPulse1 {
  0%,100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.3; transform: scale(1.05); }
}

@keyframes neonPulse2 {
  0%,100% { opacity: 0.15; transform: scale(1); }
  50% { opacity: 0.25; transform: scale(1.03); }
}

.animate-neonPulse1,
.animate-neonPulse2 {
  will-change: opacity, transform;
}


/* Scroll personalizado */
.custom-scroll::-webkit-scrollbar { width: 8px; }
.custom-scroll::-webkit-scrollbar-track { background: rgba(59,130,246,0.05); border-radius: 9999px; }
.custom-scroll::-webkit-scrollbar-thumb { background: rgba(59,130,246,0.4); border-radius: 9999px; }
.custom-scroll::-webkit-scrollbar-thumb:hover { background: rgba(59,130,246,0.6); }

/* Input color letras */
input[type="text"] { color: white; }
input[type="text"]::placeholder { color: #cbd5e1; }
</style>
