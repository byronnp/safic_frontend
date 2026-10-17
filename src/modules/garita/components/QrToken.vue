<template>
  <div class="qr-token" role="img" :aria-label="etiqueta">
    <img v-if="imagen" :src="imagen" :width="tamano" :height="tamano" alt="" />
    <q-skeleton v-else type="rect" :width="`${tamano}px`" :height="`${tamano}px`" />
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';

/**
 * El código QR de una visita. Contiene solo el token (opaco, sin datos personales): la garita lo busca para validar.
 * Se dibuja en el navegador; el token no sale a ningún servicio externo.
 */
const props = withDefaults(defineProps<{ token: string; tamano?: number; etiqueta?: string }>(), {
  tamano: 220,
  etiqueta: 'Código QR de la visita',
});

const imagen = ref<string | null>(null);

watch(
  () => props.token,
  async (token) => {
    imagen.value = null;
    if (token === '') return;
    const { default: QRCode } = await import('qrcode');
    imagen.value = await QRCode.toDataURL(token, {
      width: props.tamano * 2,
      margin: 1,
      errorCorrectionLevel: 'M',
      color: { dark: '#1C1B18', light: '#FFFFFF' },
    });
  },
  { immediate: true },
);
</script>

<style scoped>
.qr-token {
  display: inline-flex;
  background: #ffffff;
  border-radius: 10px;
  line-height: 0;
}
</style>
