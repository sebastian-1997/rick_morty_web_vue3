<template>
  <footer
    class="bg-gradient-to-r from-gray-900 via-black to-gray-900 text-gray-200 py-6  shadow-inner border-t border-yellow-400/40"
  >
    <div
      class="max-w-screen-xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6"
    >
      <!-- Info del proyecto -->
      <div class="text-center md:text-left">
        <h3 class="text-lg font-semibold text-yellow-400 drop-shadow-[0_0_6px_#FFD700]">
          Rick & Morty Explorer
        </h3>
        <p class="text-sm text-gray-400">Proyecto de consumo de API pública</p>
      </div>

      <!-- Info de derechos -->
      <div class="text-center text-sm text-gray-300">
        <p>
          &copy; {{ new Date().getFullYear() }} - Elaborado por
          <span
            class="font-medium text-purple-400 drop-shadow-[0_0_6px_#A855F7]"
            >Sebastián Muñoz F.</span
          >
        </p>
      </div>

      <!-- Links -->
      <div class="flex gap-6">
        <a
          href="https://rickandmortyapi.com/"
          target="_blank"
          class="text-yellow-400 hover:text-yellow-300 transition drop-shadow-[0_0_6px_#FFD700]"
        >
          API Oficial
        </a>
        <a
          href="https://github.com/"
          target="_blank"
          class="text-purple-400 hover:text-purple-300 transition drop-shadow-[0_0_6px_#A855F7]"
        >
          Código Fuente
        </a>
      </div>
    </div>
  </footer>
</template>

<script setup lang="ts">

</script>
