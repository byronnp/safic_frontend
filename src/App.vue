<template>
  <router-view />
</template>

<script setup lang="ts">
import '@fontsource/manrope/400.css';
import '@fontsource/manrope/600.css';
import '@fontsource/manrope/700.css';

import { useTenantTheme } from '@/core/theme/useTenantTheme';

defineOptions({ name: 'App' });

// Aplica los colores del condominio activo (o los de SAFIC por defecto).
useTenantTheme();
</script>
