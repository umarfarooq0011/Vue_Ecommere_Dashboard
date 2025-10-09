<template>
  <section class="min-h-[70vh] flex flex-col items-center justify-center gap-6">
    <v-card class="max-w-3xl w-full shadow-lg rounded-2xl p-8">
      <header class="flex flex-col gap-2">
        <h1 class="text-3xl font-semibold text-gray-800">Categories Overview</h1>
        <p class="text-gray-500">
          Manage and organize your product categories to keep the catalogue structured
          and easy to navigate.
        </p>
      </header>
      <v-divider class="my-6" />
      <div class="grid gap-4 text-gray-600">
        <p>
          This is a placeholder screen. In the next iterations you can connect it to
          your API, display the list of categories, and allow creating, editing, or
          removing them.
        </p>
        <p>
          For now, the page confirms that the navigation and authentication flow are
          working correctly once the user has logged in.
        </p>
      </div>
    </v-card>
  </section>
</template>

<script setup lang="ts">
// Categories logic will be implemented in future tasks.
</script>