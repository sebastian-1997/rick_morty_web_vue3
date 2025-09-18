<template>
  <n-config-provider>
    <n-layout>
      <Header />
      <Hero />
      <Features />
      <Episodes />
      <Locations />
      <Footer />

      <!-- Contenido dinámico -->
      <router-view />
    </n-layout>
  </n-config-provider>
</template>

<script setup lang="ts">
import { NConfigProvider, NLayout } from 'naive-ui'
import Header from '@/components/layout/Header.vue';
import Hero from '@/components/layout/Hero.vue';
import Features from '@/components/layout/Features.vue';
import Episodes from '@/components/layout/Episodes.vue';
import Locations from './components/layout/Locations.vue';
import Footer from './components/layout/Footer.vue';


</script>

