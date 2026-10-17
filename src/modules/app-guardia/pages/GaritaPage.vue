<template>
  <div class="app-pagina">
    <AppEncabezado
      class="garita-encabezado"
      :antetitulo="
        [session.condominioActivo?.nombre, session.usuario?.nombre].filter(Boolean).join(' · ')
      "
      titulo="Garita"
    >
      <template #derecha>
        <GaritaIndicadorConexion />
      </template>
    </AppEncabezado>

    <div class="app-cuerpo garita-cuerpo">
      <div v-if="mensaje" class="garita-resultado" role="status">{{ mensaje }}</div>
      <div v-if="errorAccion" class="safic-alerta" role="alert">{{ errorAccion }}</div>

      <div v-if="!lectura" class="garita-acciones">
        <button type="button" class="garita-escanear" :disabled="ocupado" @click="escanear">
          <q-icon name="sym_r_qr_code_scanner" size="26px" />Escanear QR
        </button>
        <button type="button" class="garita-sin-qr" :disabled="ocupado" @click="ingresoSinQr">
          Ingreso sin QR
        </button>
      </div>

      <div
        v-else
        class="garita-qr"
        :class="{ 'garita-qr--invalido': !lectura.valido }"
        role="region"
        aria-label="Resultado del QR"
      >
        <div class="garita-qr__estado">
          <q-icon
            :name="lectura.valido ? 'sym_r_check' : 'sym_r_block'"
            size="20px"
            class="garita-qr__check"
          />{{ lectura.valido ? 'QR válido' : 'QR no válido' }}
        </div>
        <div class="garita-qr__nombre">{{ lectura.visita.visitante }}</div>
        <div class="garita-qr__detalle">
          Visita a <strong>{{ lectura.visita.unidad ?? '—' }}</strong
          ><template v-if="lectura.visita.autorizo">
            · autorizó {{ lectura.visita.autorizo }}</template
          ><br />{{ vigenciaVisita(lectura.visita)
          }}<template v-if="lectura.visita.placa">
            · Placa <strong>{{ lectura.visita.placa }}</strong></template
          >
        </div>
        <div v-if="!lectura.valido" class="garita-qr__nota" role="alert">
          {{ lectura.mensaje }}
        </div>
        <div v-else class="garita-qr__nota">Confirma que la persona y la placa coinciden.</div>
        <div class="garita-qr__botones">
          <button type="button" class="garita-qr__no" @click="descartar">
            {{ lectura.valido ? 'No coincide' : 'Cerrar' }}
          </button>
          <button
            v-if="lectura.valido"
            type="button"
            class="garita-qr__si"
            :disabled="ocupado"
            @click="registrarIngreso"
          >
            Registrar ingreso
          </button>
        </div>
      </div>

      <div v-if="panel.isError.value" class="safic-alerta" role="alert">
        {{ panel.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="panel.refetch()" />
      </div>
      <template v-else-if="panel.isPending.value">
        <q-skeleton v-for="i in 2" :key="i" type="rect" height="96px" aria-busy="true" />
      </template>
      <template v-else>
        <GaritaListaVisitas
          titulo="Dentro ahora"
          :visitas="dentro"
          accion="Salida"
          vacio="No hay visitas dentro."
          @accion="registrarSalida"
        />
        <GaritaListaVisitas
          titulo="Esperadas hoy"
          :visitas="esperadas"
          vacio="No hay visitas esperadas hoy."
        />
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import EscanerQrDialog from '@/modules/garita/components/EscanerQrDialog.vue';
import IngresoSinQrDialog from '@/modules/garita/components/IngresoSinQrDialog.vue';
import {
  useIngresoConQr,
  usePanelGarita,
  useRegistrarSalida,
  useValidarQr,
} from '@/modules/garita/composables/useGarita';
import { detalleDentro, detalleEsperada } from '@/modules/garita/garita.logica';
import type { ValidacionQr } from '@/modules/garita/services/garita.service';
import { vigenciaVisita } from '@/modules/garita/visitas.logica';
import { useSessionStore } from '@/stores/session';

import GaritaIndicadorConexion from '../components/GaritaIndicadorConexion.vue';
import GaritaListaVisitas from '../components/GaritaListaVisitas.vue';

const $q = useQuasar();
const session = useSessionStore();

const panel = usePanelGarita();
const validando = useValidarQr();
const ingresando = useIngresoConQr();
const saliendo = useRegistrarSalida();
const ocupado = computed(
  () => validando.isPending.value || ingresando.isPending.value || saliendo.isPending.value,
);

const lectura = ref<ValidacionQr | null>(null);
const token = ref<string | null>(null);
const mensaje = ref<string | null>(null);
const errorAccion = ref<string | null>(null);

const dentro = computed(() =>
  (panel.data.value?.dentro ?? []).map((d) => ({
    id: String(d.id),
    nombre: d.nombre,
    detalle: detalleDentro(d),
  })),
);
const esperadas = computed(() =>
  (panel.data.value?.esperadas ?? []).map((e) => ({
    id: String(e.id),
    nombre: e.nombre,
    detalle: detalleEsperada(e),
  })),
);

// Otro condominio: nada de lo leído ni avisado queda
watch(
  () => session.condominioId,
  () => {
    lectura.value = null;
    token.value = null;
    mensaje.value = null;
    errorAccion.value = null;
  },
);

function fallar(error: unknown): void {
  mensaje.value = null;
  const apiError = aApiError(error);
  // Un QR que dejó de servir (otro guardia lo usó antes) o un conflicto de estado: se vuelve a leer el panel
  if (apiError.codigo.startsWith('QR_') || apiError.estado === 409) void panel.refetch();
  // Sin respuesta o 5xx el cambio pudo hacerse: se avisa para no repetirlo a ciegas
  errorAccion.value =
    apiError.estado === 0 || apiError.estado >= 500
      ? `${apiError.mensaje} Revisa «Dentro ahora» antes de reintentar: el cambio pudo hacerse.`
      : apiError.mensaje;
}

function escanear(): void {
  mensaje.value = null;
  errorAccion.value = null;
  $q.dialog({ component: EscanerQrDialog }).onOk((leido: string) => {
    validando.mutate(leido, {
      onSuccess: (r) => {
        token.value = leido;
        lectura.value = r;
      },
      onError: fallar,
    });
  });
}

function descartar(): void {
  lectura.value = null;
  token.value = null;
}

function registrarIngreso(): void {
  const t = token.value;
  if (!t || ocupado.value) return;
  errorAccion.value = null;
  ingresando.mutate(t, {
    onSuccess: () => {
      mensaje.value = `Ingreso de ${lectura.value?.visita.visitante ?? 'la visita'} registrado.`;
      descartar();
    },
    onError: (error) => {
      descartar();
      fallar(error);
    },
  });
}

function ingresoSinQr(): void {
  mensaje.value = null;
  errorAccion.value = null;
  $q.dialog({ component: IngresoSinQrDialog }).onOk((m: string) => (mensaje.value = m));
}

function registrarSalida(id: string): void {
  if (ocupado.value) return;
  errorAccion.value = null;
  saliendo.mutate(Number(id), {
    onSuccess: () => (mensaje.value = 'Salida registrada.'),
    onError: fallar,
  });
}
</script>

<style scoped>
.garita-qr--invalido {
  border-color: #b3261e;
}

.garita-qr--invalido .garita-qr__estado {
  color: #b3261e;
}

.garita-resultado {
  padding: 12px 14px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
  font-size: 14px;
}

.app-encabezado.garita-encabezado {
  padding: 20px 16px 0;
}

/* Sin conexión el indicador es más largo: el antetítulo baja de línea en vez de desbordar. */
.garita-encabezado :deep(.col-grow) {
  flex: 1 1 0;
  min-width: 0;
}

.garita-pestanas {
  display: flex;
  margin-top: 12px;
}

.garita-pestana {
  flex-grow: 1;
  flex-basis: 0;
  height: 46px;
  border: none;
  border-bottom: 3px solid transparent;
  background: transparent;
  font-family: inherit;
  font-size: 15px;
  font-weight: 600;
  color: #b9cdc9;
  cursor: pointer;
}

.garita-pestana--activa {
  color: #ffffff;
  font-weight: 800;
  border-bottom-color: var(--q-accent);
}

.app-cuerpo.garita-cuerpo {
  padding: 14px 16px;
  gap: 10px;
}

.garita-acciones {
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 8px;
}

.garita-escanear,
.garita-recibir {
  border-radius: 14px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
  font-family: inherit;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.garita-escanear {
  height: 72px;
  font-size: 17px;
}

.garita-recibir {
  height: 64px;
  font-size: 16px;
}

.garita-sin-qr {
  height: 72px;
  border-radius: 14px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.3;
  cursor: pointer;
}

/* Resultado del QR */
.garita-qr {
  background: #ffffff;
  border: 2px solid var(--q-primary);
  border-radius: 16px;
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.garita-qr__estado {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #0b4a47;
  font-weight: 800;
  font-size: 15px;
}

.garita-qr__check {
  font-variation-settings: 'wght' 700;
}

.garita-qr__nombre {
  font-size: 18px;
  font-weight: 800;
}

.garita-qr__detalle {
  font-size: 13px;
  color: var(--safic-texto-2);
  line-height: 1.5;
}

.garita-qr__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.garita-qr__botones {
  display: flex;
  gap: 8px;
}

.garita-qr__no,
.garita-qr__si {
  height: 46px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.garita-qr__no {
  flex-grow: 1;
  flex-basis: 0;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: #9b1c12;
}

.garita-qr__si {
  flex-grow: 2;
  flex-basis: 0;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
}

/* Paquetes */
.garita-subtitulo {
  margin: 0;
  font-size: 14px;
  line-height: 1.4;
  font-weight: 800;
  letter-spacing: normal;
}

.garita-paquete {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  padding: 12px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.garita-paquete--vacio {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.garita-paquete__icono {
  width: 48px;
  height: 48px;
  border-radius: 10px;
  background: #f1efe8;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--safic-texto-suave);
  flex-shrink: 0;
}

.garita-paquete__textos {
  flex-grow: 1;
  min-width: 0;
}

.garita-paquete__titulo {
  font-size: 14px;
  font-weight: 800;
}

.garita-paquete__recibido {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.garita-paquete__recibido--atrasado {
  color: #9b1c12;
  font-weight: 700;
}

.garita-paquete__entregar {
  flex-shrink: 0;
  height: 44px;
  padding: 0 12px;
  border-radius: 9px;
  border: 1px solid var(--q-primary);
  background: #ffffff;
  color: var(--q-primary);
  font-family: inherit;
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
}

.garita-nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}
</style>
