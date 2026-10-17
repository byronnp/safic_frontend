<template>
  <q-page class="visita-qr">
    <div v-if="consulta.isPending.value" class="visita-qr__tarjeta" aria-busy="true">
      <q-skeleton type="rect" height="260px" />
    </div>

    <div
      v-else-if="consulta.isError.value && enlaceInvalido"
      class="visita-qr__tarjeta visita-qr__tarjeta--aviso"
    >
      <q-icon name="sym_r_link_off" size="40px" class="text-suave" />
      <h1 class="visita-qr__titulo">Este enlace no es válido</h1>
      <p class="visita-qr__texto">
        Revisa que el enlace esté completo o pídele a quien te invitó que te lo envíe de nuevo.
      </p>
    </div>

    <div v-else-if="consulta.isError.value" class="visita-qr__tarjeta visita-qr__tarjeta--aviso">
      <q-icon name="sym_r_wifi_off" size="40px" class="text-suave" />
      <h1 class="visita-qr__titulo">No pudimos cargar tu visita</h1>
      <p class="visita-qr__texto">{{ consulta.error.value?.mensaje }}</p>
      <q-btn unelevated no-caps color="primary" label="Reintentar" @click="consulta.refetch()" />
    </div>

    <div v-else-if="visita" class="visita-qr__tarjeta">
      <div class="visita-qr__condominio">{{ visita.condominio.nombre }}</div>
      <h1 class="visita-qr__titulo">Hola {{ visita.visitante }}</h1>

      <template v-if="visita.estado === 'activa'">
        <p class="visita-qr__texto">
          Muestra este QR en la garita para ingresar a <strong>{{ visita.unidad }}</strong
          >.
        </p>
        <QrToken :token="visita.token" :tamano="240" />
        <div class="visita-qr__vigencia">{{ vigenciaVisita(visita) }}</div>
      </template>
      <p v-else class="visita-qr__texto" role="alert">
        {{
          visita.estado === 'revocada'
            ? 'Esta autorización fue cancelada por quien te invitó.'
            : 'Esta autorización ya venció o ya se usó.'
        }}
      </p>

      <div v-if="enlaces" class="visita-qr__mapas">
        <div class="visita-qr__subtitulo">Cómo llegar</div>
        <a :href="enlaces.maps" target="_blank" rel="noopener noreferrer">Google Maps</a>
        ·
        <a :href="enlaces.waze" target="_blank" rel="noopener noreferrer">Waze</a>
        <div v-if="visita.condominio.direccion" class="visita-qr__direccion">
          {{ visita.condominio.direccion }}
        </div>
      </div>

      <p class="visita-qr__privacidad">
        Este QR no contiene datos personales. Solo es válido para este ingreso.
      </p>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';

import QrToken from '../components/QrToken.vue';
import { useVisitaPublica } from '../composables/useVisitas';
import { enlacesComoLlegar, vigenciaVisita } from '../visitas.logica';

const route = useRoute();
const token = computed(() => String(route.params.token ?? ''));
const consulta = useVisitaPublica(token);
const visita = computed(() => consulta.data.value ?? null);
// Solo un 404 es «enlace inválido»; una caída de red, un 429 o un 5xx se pueden reintentar
const enlaceInvalido = computed(() => consulta.error.value?.estado === 404);
const enlaces = computed(() => (visita.value ? enlacesComoLlegar(visita.value.condominio) : null));
</script>

<style scoped>
.visita-qr {
  display: flex;
  justify-content: center;
  padding: 24px 16px;
}

.visita-qr__tarjeta {
  width: 100%;
  max-width: 400px;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 16px;
  padding: 24px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  text-align: center;
}

.visita-qr__condominio {
  font-size: 13px;
  font-weight: 700;
  color: var(--safic-texto-suave);
}

.visita-qr__titulo {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}

.visita-qr__texto {
  margin: 0;
  font-size: 15px;
  line-height: 1.5;
}

.visita-qr__vigencia {
  font-size: 14px;
  font-weight: 700;
}

.visita-qr__subtitulo {
  font-size: 13px;
  font-weight: 800;
  color: var(--safic-texto-suave);
  margin-bottom: 4px;
}

.visita-qr__mapas a {
  color: var(--q-primary);
  font-weight: 700;
}

.visita-qr__direccion,
.visita-qr__privacidad {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
  margin: 4px 0 0;
}
</style>
