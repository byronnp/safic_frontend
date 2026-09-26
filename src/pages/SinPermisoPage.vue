<template>
  <q-page class="flex flex-center column q-pa-md text-center">
    <q-icon :name="ICONOS.bloqueado" size="56px" color="primary" />
    <p class="text-h6 q-mt-md">{{ t('errores.sinPermiso') }}</p>
    <q-btn
      color="primary"
      unelevated
      no-caps
      :to="{ name: 'inicio' }"
      :label="t('errores.volverInicio')"
    />
  </q-page>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

import { ICONOS } from '@/core/navigation/icons';

const { t } = useI18n();
</script>
