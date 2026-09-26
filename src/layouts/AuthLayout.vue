<template>
  <q-layout view="hHh lpR fFf">
    <q-page-container>
      <q-page class="flex flex-center q-pa-md">
        <div class="column items-center full-width" style="max-width: 420px">
          <div class="row items-center q-gutter-sm q-mb-lg">
            <span class="safic-logo">S</span>
            <div>
              <div class="text-h6 text-weight-bold">{{ t('app.nombre') }}</div>
              <div class="text-caption text-suave">{{ t('app.descripcion') }}</div>
            </div>
          </div>
          <router-view />
        </div>
      </q-page>
    </q-page-container>
  </q-layout>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
</script>
