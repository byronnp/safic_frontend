<template>
  <q-page class="flex flex-center column q-pa-md text-center">
    <q-icon :name="ICONOS.bloqueado" size="56px" color="primary" />
    <p class="text-h6 q-mt-md">{{ t('errores.sinPermiso') }}</p>
    <q-btn
      color="primary"
      unelevated
      no-caps
      class="safic-btn"
      :to="{ name: route.meta.plataforma ? 'plataforma' : 'inicio' }"
      :label="t('errores.volverInicio')"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';

import { ICONOS } from '@/core/navigation/icons';

const { t } = useI18n();
const route = useRoute();
</script>
