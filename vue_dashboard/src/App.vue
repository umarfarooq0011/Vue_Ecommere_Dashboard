<template>
  <v-app>
    <Header />
    <RouterView />
    <Footer />
  </v-app>
</template>

<script setup lang="ts">
import Footer from './components/Layout/Footer.vue';
import Header from './components/Layout/Header.vue';


</script>
