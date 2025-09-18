<template>
  <section id="characters-section" class="min-h-screen py-16 bg-gradient-to-b from-[#1a001f] via-[#300033] to-[#4d004d] text-white relative overflow-hidden">
    <h2 class="text-4xl md:text-5xl font-display text-center mb-12 neon-text animate-neon">
      Personajes Destacados
    </h2>

    <div class="relative group">
      <Carousel
        v-if="characters.length"
        ref="carousel"
        :items-to-show="3"
        :wrap-around="true"
        :autoplay="4000"
        :pause-autoplay-on-hover="true"
        :mouse-drag="true"
        class="mb-12"
      >
        <Slide v-for="character in characters" :key="character.id">
          <div
            class="relative perspective-card bg-gradient-to-br from-[#5a0033] via-[#7e004d] to-[#a30073] rounded-3xl shadow-neon p-5 cursor-pointer transform transition-all duration-500 hover:scale-105 hover:shadow-2xl"
            @mousemove="handleParallax"
            @mouseleave="resetParallax"
            @click="openModal(character)"
          >
            <div class="absolute inset-0 rounded-3xl bg-gradient-to-t from-[#fcf259]/30 via-transparent to-transparent pointer-events-none blur-2xl"></div>

            <img
              :src="character.image"
              :alt="character.name"
              class="relative rounded-2xl mb-4 w-full h-64 object-cover border-4 border-yellow-300 shadow-lg neon-border transition-all duration-500"
            />
            <h3 class="text-xl font-display text-white text-center neon-text transition-all duration-500">
              {{ character.name }}
            </h3>
            <p class="text-sm text-center text-yellow-200/80 mt-1">{{ character.species }} · {{ character.status }}</p>
          </div>
        </Slide>
      </Carousel>

      <!-- Flechas -->
      <button
        v-if="carousel"
        @click="carousel?.slidePrev()"
        class="absolute left-0 top-1/2 -translate-y-1/2 text-yellow-300 text-4xl opacity-80 hover:opacity-100 neon-text transition-all z-10"
      >❮</button>
      <button
        v-if="carousel"
        @click="carousel?.slideNext()"
        class="absolute right-0 top-1/2 -translate-y-1/2 text-yellow-300 text-4xl opacity-80 hover:opacity-100 neon-text transition-all z-10"
      >❯</button>

      <!-- Paginador -->
      <div class="absolute bottom-0 left-1/2 -translate-x-1/2 flex gap-2 mb-4 z-10">
        <span
          v-for="(character, index) in characters"
          :key="index"
          @click="carousel?.slideTo(index)"
          :class="[
            'w-4 h-4 rounded-full cursor-pointer transition-all duration-300',
            carousel?.currentSlide === index ? 'bg-yellow-300 neon-border animate-pulse' : 'bg-yellow-300/50'
          ]"
        ></span>
      </div>
    </div>

    <!-- Modal personaje -->
    <transition name="fade">
      <div v-if="selectedCharacter" class="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50">
        <div class="bg-gradient-to-br from-[#7e004d] via-[#5a0033] to-[#3b001f] text-white rounded-3xl shadow-2xl p-8 max-w-md w-full relative">
          <button @click="selectedCharacter = null" class="absolute top-3 right-3 text-gray-400 hover:text-white text-xl">✕</button>
          <img :src="selectedCharacter.image" :alt="selectedCharacter.name" class="w-44 h-44 rounded-full mx-auto border-4 border-yellow-300 shadow-lg neon-border mb-4" />
          <h2 class="text-2xl font-display text-center mb-2 neon-text">{{ selectedCharacter.name }}</h2>
          <p class="font-sans text-center text-yellow-200/80 mb-6">
            <span class="capitalize">{{ selectedCharacter.species }}</span> · {{ selectedCharacter.status }}
          </p>
          <div class="space-y-2 font-sans text-yellow-200/80">
            <p><span class="font-semibold">Género:</span> {{ selectedCharacter.gender }}</p>
            <p><span class="font-semibold">Origen:</span> {{ selectedCharacter.origin?.name }}</p>
            <p><span class="font-semibold">Ubicación:</span> {{ selectedCharacter.location?.name }}</p>
          </div>
        </div>
      </div>
    </transition>
  </section>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'
import { Carousel, Slide } from 'vue3-carousel'
import 'vue3-carousel/dist/carousel.css'
import { getCharacters } from '@/services/characters'

const characters = ref<any[]>([])
const selectedCharacter = ref<any | null>(null)
const carousel = ref<any>(null)

const openModal = (character: any) => {
  selectedCharacter.value = character
}

// Parallax 3D
function handleParallax(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement | null;
  if (!el) return;

  const rect = el.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;
  const centerX = rect.width / 2;
  const centerY = rect.height / 2;
  const rotateX = ((y - centerY) / centerY) * 8;
  const rotateY = ((x - centerX) / centerX) * 8;
  el.style.transform = `perspective(600px) rotateX(${-rotateX}deg) rotateY(${rotateY}deg) scale(1.05)`;
}

function resetParallax(e: MouseEvent) {
  const el = e.currentTarget as HTMLElement | null;
  if (!el) return;
  el.style.transform = 'perspective(600px) rotateX(0deg) rotateY(0deg) scale(1)';
}

onMounted(async () => {
  const data = await getCharacters()
  characters.value = data.results

  // Esperar a que el carousel esté montado
  await nextTick()
})
</script>

<style scoped>
.neon-text {
  text-shadow: 0 0 4px #fcf259, 0 0 10px #fcf259, 0 0 20px #fcf259, 0 0 40px #fcf259;
}

.neon-border {
  box-shadow: 0 0 10px #fcf259, 0 0 20px #fcf259, 0 0 30px #fcf259;
}

.shadow-neon {
  box-shadow: 0 0 15px #fcf259/50, 0 0 25px #fcf259/40, 0 0 35px #fcf259/30;
}

.animate-neon {
  animation: neonPulse 2s infinite alternate;
}

@keyframes neonPulse {
  0% { text-shadow: 0 0 4px #fcf259, 0 0 10px #fcf259, 0 0 20px #fcf259, 0 0 40px #fcf259; }
  50% { text-shadow: 0 0 6px #fcf259, 0 0 14px #fcf259, 0 0 28px #fcf259, 0 0 50px #fcf259; }
  100% { text-shadow: 0 0 4px #fcf259, 0 0 10px #fcf259, 0 0 20px #fcf259, 0 0 40px #fcf259; }
}

.fade-enter-active, .fade-leave-active { transition: opacity 0.3s ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
.fade-enter-to, .fade-leave-from { opacity: 1; }

.perspective-card {
  transform-style: preserve-3d;
}
</style>
