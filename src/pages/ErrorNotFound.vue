<template>
  <div class="fullscreen flex flex-center column q-pa-md text-center">
    <div class="text-h2 text-weight-bold text-primary">404</div>
    <p class="text-h6 q-mt-md">{{ t('errores.noEncontrada') }}</p>
    <q-btn color="primary" unelevated no-caps to="/" :label="t('errores.volverInicio')" />
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
