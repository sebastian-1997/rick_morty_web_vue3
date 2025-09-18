<template>
  <section id="locations-section" class="relative w-full h-screen bg-black overflow-hidden">
    <img :src="bgImage" alt="Constellation"
      class="absolute inset-0 w-full h-full object-cover filter brightness-125 contrast-110" />

    <!-- Canvas en toda la pantalla pero transparente -->
    <ThreeScene ref="threeRef" model-path="/models/nave/nave.gltf" class="absolute inset-0 z-10 pointer-events-none" />

    <!-- Loader  sección de locaciones -->
    <div v-if="loadingLocations" class="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-50">
      <img src="@/assets/portal.gif" alt="Cargando" class="w-40 h-40 animate-spin-slow" />
      <p class="mt-5 text-xl text-cyan-400 font-bold animate-pulse">
        Cargando locaciones...
      </p>
    </div>

    <!-- Puntos-->
    <div v-for="(loc, index) in locations" :key="loc.id" class="absolute location-point cursor-pointer"
      :style="{ top: loc.y + '%', left: loc.x + '%', zIndex: 20 }" @click="selectLocation(loc)">
      <!-- punto visual -->
      <div
        class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-300 rounded-full shadow-[0_0_8px_3px_rgba(255,255,0,0.8)] animate-ping">
      </div>
      <div
        class="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-yellow-400 rounded-full absolute top-0 left-0 shadow-[0_0_6px_2px_rgba(255,200,0,0.9)]">
      </div>
    </div>

    <!-- Panel flotante -->
    <div v-if="selectedLocation" class="absolute bottom-6 left-6 w-96 max-h-[70vh] bg-black/80 backdrop-blur-xl 
 rounded-2xl shadow-[0_0_20px_rgba(0,255,255,0.5)] p-5 
 text-white z-50 flex flex-col overflow-hidden">
      <!-- Header -->
      <div class="flex justify-between items-center mb-4">
        <h2 class="text-xl font-extrabold text-yellow-400 drop-shadow-md">
          {{ selectedLocation.name }}
        </h2>
        <button class="text-pink-500 hover:text-pink-300 transition" @click="closePanel">
          ✕
        </button>
      </div>

      <!-- Info básica -->
      <p><span class="text-cyan-400 font-semibold">Tipo:</span> {{ selectedLocation.type }}</p>
      <p><span class="text-purple-400 font-semibold">Dimensión:</span> {{ selectedLocation.dimension }}</p>
      <p>
        <span class="text-orange-400 font-semibold">Residentes:</span>
        {{ residentCards.length }}
      </p>

      <!-- Portal mientras cargan los residentes -->
      <div v-if="loadingResidents" class="flex flex-col items-center justify-center py-6">
        <img src="@/assets/portal.gif" alt="Cargando" class="w-20 h-20 animate-spin-slow" />
        <p class="mt-2 text-cyan-300 font-semibold animate-pulse">Cargando residentes...</p>
      </div>

      <!-- Grid de residentes con scroll interno -->
      <div v-else class="mt-4 flex-1 flex flex-col overflow-hidden">
        <h3 class="mb-2 text-green-400 font-bold">Residentes:</h3>
        <div v-if="residentCards.length" class="flex-1 overflow-y-auto custom-scroll pr-2">
          <div class="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <div v-for="char in residentCards" :key="char.id"
              class="flex flex-col items-center bg-black/40 rounded-xl p-2 shadow-[0_0_10px_rgba(0,255,255,0.3)]">
              <img :src="char.image" :alt="char.name"
                class="w-20 h-20 object-cover rounded-full border-2 border-cyan-400" />
              <p class="mt-2 text-sm text-center text-yellow-200 font-semibold truncate w-full">
                {{ char.name }}
              </p>
            </div>
          </div>
        </div>
        <p v-else class="text-gray-400 italic">No hay residentes.</p>
      </div>
    </div>
  </section>
</template>

<script setup>
import { ref, onMounted, nextTick } from "vue";
import ThreeScene from "@/components/ThreeScene.vue";
import { getLocations } from "@/services/locations";
import bgImage from "@/assets/constellation.jpg";
import tippy from "tippy.js";
import "tippy.js/dist/tippy.css";

const threeRef = ref(null);
const locations = ref([]);
const selectedLocation = ref(null);
const residentCards = ref([]);
const loadingResidents = ref(false);
const loadingLocations = ref(true);

// 🔹 zonas válidas ajustadas para no salir de límites
const validZones = [
  { xMin: 5, xMax: 25, yMin: 5, yMax: 35 },
  { xMin: 70, xMax: 90, yMin: 5, yMax: 35 },
  { xMin: 15, xMax: 35, yMin: 60, yMax: 90 },
  { xMin: 60, xMax: 85, yMin: 60, yMax: 90 },
];

function getRandomPosition(existing, minDistance = 2) {
  let position, isValid = false;
  while (!isValid) {
    const zone = validZones[Math.floor(Math.random() * validZones.length)];
    const x = Math.random() * (zone.xMax - zone.xMin) + zone.xMin;
    const y = Math.random() * (zone.yMax - zone.yMin) + zone.yMin;
    isValid = !existing.some((p) => Math.hypot(p.x - x, p.y - y) < minDistance);
    if (isValid) position = { x, y };
  }
  return position;
}

function closePanel() {
  selectedLocation.value = null;
  residentCards.value = [];
}

async function selectLocation(loc) {
  selectedLocation.value = loc;
  // Mover modelo 3D a las coordenadas % de la locación
  if (threeRef.value && typeof threeRef.value.moveToPercent === "function") {
    // llamar sin esperar (la función hará el tween)
    threeRef.value.moveToPercent(loc.x, loc.y);
  }
  residentCards.value = [];
  loadingResidents.value = true;

  setTimeout(() => {
    residentCards.value = loc.residents || [];
    loadingResidents.value = false;
  }, 1000);
}

onMounted(async () => {
  try {
    let allLocations = [];
    let page = 1;
    let keep = true;
    while (keep) {
      const { info, results } = await getLocations(page);
      allLocations = allLocations.concat(results);
      keep = Boolean(info.next);
      page++;
    }

    const assigned = [];
    locations.value = allLocations.map((loc) => {
      const pos = getRandomPosition(assigned, 2);
      assigned.push(pos);
      return { ...loc, ...pos };
    });

    await nextTick();

    document.querySelectorAll(".location-point").forEach((el, i) => {
      const loc = locations.value[i];
      tippy(el, {
        content: `
          <div>
            <p style="color:#facc15"><b>${loc.name}</b></p>
            <p style="color:#00ffff">Tipo: ${loc.type}</p>
            <p style="color:#ff00ff">Dimensión: ${loc.dimension}</p>
            <p style="color:#ff9900">Residentes: ${loc.residents?.length || 0}</p>
          </div>
        `,
        allowHTML: true,
        placement: "auto",
        arrow: true,
        maxWidth: 200,
      });
    });

    loadingLocations.value = false;
  } catch (e) {
    console.error("Error inicializando locaciones:", e);
    loadingLocations.value = false;
  }
});
</script>

<style scoped>
.animate-ping {
  animation: twinkle 1.5s infinite alternate;
}

@keyframes twinkle {
  from {
    opacity: 0.7;
    transform: scale(0.85);
  }

  to {
    opacity: 1;
    transform: scale(1.3);
  }
}

.tippy-box {
  background: rgba(0, 0, 0, 0.85);
  color: #fff;
  border-radius: 6px;
  padding: 4px 6px;
  font-size: 12px;
}

/* Animación portal lenta */
.animate-spin-slow {
  animation: spin 3s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

/* Scroll personalizado solo para residentes */
.custom-scroll::-webkit-scrollbar {
  width: 8px;
}

.custom-scroll::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.5);
  border-radius: 10px;
}

.custom-scroll::-webkit-scrollbar-thumb {
  background: linear-gradient(180deg, #00ffff, #ff00ff, #ffff00);
  border-radius: 10px;
  box-shadow: 0 0 10px #0ff, 0 0 20px #f0f, 0 0 30px #ff0;
}

.custom-scroll::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, #ffff00, #ff00ff, #00ffff);
}

.location-point {
  transform: translate(-50%, -50%);
  /* centra punto en coordenadas */
  z-index: 20;
  /* aseguramos que estén encima del canvas */
  pointer-events: auto;
}
</style>
