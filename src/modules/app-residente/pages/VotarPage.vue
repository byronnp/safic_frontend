<template>
  <div class="app-pagina votar">
    <AppEncabezado class="votar-encabezado">
      <template #titulo>
        <div class="votar-vivo">
          <span class="votar-vivo__punto" aria-hidden="true" />
          <span class="votar-vivo__texto">EN VIVO</span>
        </div>
        <h1 class="votar-encabezado__titulo">{{ asamblea.titulo }}</h1>
        <div class="votar-encabezado__detalle">
          {{ asamblea.condominio }} · {{ asamblea.unidad }} · alícuota
          {{ formatoPorcentaje(asamblea.alicuota) }}
        </div>
      </template>
    </AppEncabezado>

    <div class="app-cuerpo votar-cuerpo">
      <button v-if="!presente" type="button" class="votar-presente" @click="presente = true">
        Estoy presente
      </button>
      <div v-else class="votar-asistencia" role="status">{{ asamblea.asistencia }}</div>

      <section class="app-tarjeta votar-punto" aria-labelledby="votar-punto-titulo">
        <div class="votar-punto__etiqueta">{{ punto.etiqueta }}</div>
        <h2 id="votar-punto-titulo" class="votar-punto__titulo">{{ punto.titulo }}</h2>
        <a href="#" class="votar-punto__documento" @click.prevent="verDocumento">
          {{ punto.documento }}
        </a>

        <div v-if="enMora" class="votar-mora" role="alert">
          <strong>Tu unidad no puede votar</strong> porque tiene cuotas vencidas (Decreto 462).
          Sigues contando para el quórum y puedes ver los resultados.
        </div>

        <template v-if="puedeVotar">
          <div class="votar-opciones" role="radiogroup" aria-label="Tu voto">
            <button
              v-for="opcion in opciones"
              :key="opcion"
              type="button"
              role="radio"
              class="votar-opcion"
              :class="{ 'votar-opcion--activa': elegida === opcion }"
              :aria-checked="elegida === opcion"
              @click="elegida = opcion"
            >
              {{ opcion }}
            </button>
          </div>
          <button
            type="button"
            class="votar-confirmar"
            :class="{ 'votar-confirmar--listo': elegida !== null }"
            :aria-disabled="elegida === null"
            @click="confirmar"
          >
            Confirmar voto
          </button>
          <div class="votar-aviso">Una vez confirmado, el voto no se puede cambiar.</div>
        </template>

        <div v-if="!enMora && votado" class="votar-registrado" role="status">
          <div class="votar-registrado__hora">Tu voto quedó registrado · {{ punto.horaVoto }}</div>
          <div class="votar-registrado__voto">{{ elegida }}</div>
          <div class="votar-registrado__nota">
            Verás el resultado cuando el presidente cierre la votación.
          </div>
        </div>
      </section>

      <section class="app-tarjeta votar-orden" aria-labelledby="votar-orden-titulo">
        <h2 id="votar-orden-titulo" class="votar-orden__titulo">ORDEN DEL DÍA</h2>
        <div class="votar-orden__lista">
          <div v-for="linea in ordenDelDia" :key="linea.texto">
            <strong v-if="linea.destacada">{{ linea.texto }}</strong>
            <template v-else>{{ linea.texto }}</template>
          </div>
        </div>
      </section>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import { formatoPorcentaje } from '@/utils/formato';

import {
  VOTAR_ASAMBLEA,
  VOTAR_EN_MORA,
  VOTAR_OPCIONES,
  VOTAR_ORDEN_DEL_DIA,
  VOTAR_PUNTO,
} from '../demo/votar';

type OpcionVoto = (typeof VOTAR_OPCIONES)[number];

const $q = useQuasar();

const asamblea = VOTAR_ASAMBLEA;
const punto = VOTAR_PUNTO;
const opciones = VOTAR_OPCIONES;
const ordenDelDia = VOTAR_ORDEN_DEL_DIA;
const enMora = VOTAR_EN_MORA;

const presente = ref(true);
const elegida = ref<OpcionVoto | null>(null);
const votado = ref(false);

const puedeVotar = computed(() => !enMora && presente.value && !votado.value);

function confirmar(): void {
  if (elegida.value !== null) {
    votado.value = true;
  }
}

function verDocumento(): void {
  $q.notify({ type: 'info', message: 'El documento estará disponible con la API.' });
}
</script>

<style scoped>
/* Los mockups usan el interlineado normal del navegador. */
.votar {
  line-height: normal;
}

.app-pagina .votar-encabezado {
  padding: 22px 18px 18px;
}

.votar-encabezado :deep(.app-encabezado__titulo) {
  margin-top: 0;
  font-size: 13px;
  font-weight: 400;
  line-height: normal;
}

.votar-vivo {
  display: flex;
  align-items: center;
  gap: 8px;
}

.votar-vivo__punto {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: #f0b35a;
}

.votar-vivo__texto {
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.6px;
  color: #f0b35a;
}

.votar-encabezado__titulo {
  margin: 6px 0 0;
  font-size: 21px;
  font-weight: 800;
  line-height: normal;
  letter-spacing: normal;
}

.votar-encabezado__detalle {
  font-size: 13px;
  color: #b9cdc9;
  margin-top: 2px;
}

.app-cuerpo.votar-cuerpo {
  padding: 16px;
  gap: 12px;
}

.votar-presente {
  height: 56px;
  border-radius: 14px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
  font-family: inherit;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
}

.votar-asistencia {
  background: #e3efec;
  color: #0b4a47;
  border-radius: 12px;
  padding: 10px 14px;
  font-size: 13px;
  font-weight: 700;
}

.votar-punto {
  border-radius: 16px;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.votar-punto__etiqueta {
  font-size: 12px;
  font-weight: 800;
  color: var(--q-primary);
}

.votar-punto__titulo {
  margin: 0;
  font-size: 19px;
  font-weight: 800;
  line-height: 1.25;
  letter-spacing: normal;
}

.votar-punto__documento {
  position: relative;
  align-self: flex-start;
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
}

/* Área táctil de 44px sin cambiar el alto visible. */
.votar-punto__documento::after {
  content: '';
  position: absolute;
  inset: -13px -6px;
}

.votar-mora {
  background: #fde8e6;
  color: #7f1810;
  border-radius: 12px;
  padding: 12px 14px;
  font-size: 13px;
  line-height: 1.45;
}

.votar-opciones {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.votar-opcion {
  height: 54px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 17px;
  font-weight: 800;
  cursor: pointer;
  background: var(--safic-superficie);
  color: var(--safic-texto);
  border: 1px solid var(--safic-borde-2);
}

.votar-opcion--activa {
  background: var(--q-primary);
  color: #ffffff;
  border: 2px solid var(--q-primary);
}

.votar-confirmar {
  height: 50px;
  border-radius: 12px;
  border: none;
  font-family: inherit;
  font-size: 16px;
  font-weight: 700;
  cursor: pointer;
  background: var(--safic-borde);
  color: var(--safic-texto-tenue);
}

.votar-confirmar--listo {
  background: var(--safic-tinta);
  color: #ffffff;
}

.votar-aviso {
  font-size: 12px;
  color: var(--safic-texto-suave);
  text-align: center;
}

.votar-registrado {
  background: #e3efec;
  border-radius: 12px;
  padding: 16px;
  text-align: center;
  color: #0b4a47;
}

.votar-registrado__hora {
  font-size: 13px;
  font-weight: 700;
}

.votar-registrado__voto {
  font-size: 28px;
  font-weight: 800;
  margin-top: 4px;
}

.votar-registrado__nota {
  font-size: 12px;
  margin-top: 4px;
}

.votar-orden {
  border-radius: 16px;
  padding: 14px 16px;
}

.votar-orden__titulo {
  margin: 0 0 6px;
  font-size: 12px;
  font-weight: 800;
  line-height: normal;
  letter-spacing: normal;
  color: var(--safic-texto-suave);
}

.votar-orden__lista {
  font-size: 13px;
  color: var(--safic-texto-2);
  line-height: 1.8;
}
</style>
