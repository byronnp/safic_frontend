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
        <GaritaIndicadorConexion
          :en-linea="offline.enLinea.value"
          :pendientes="offline.pendientes.value"
          :sincronizando="offline.sincronizando.value"
          :copia="textoCopia(offline.copia.value)"
          @sincronizar="offline.sincronizar()"
        />
      </template>
    </AppEncabezado>

    <div class="app-cuerpo garita-cuerpo">
      <div v-if="mensaje" class="garita-resultado" role="status">{{ mensaje }}</div>
      <div v-if="errorAccion" class="safic-alerta" role="alert">{{ errorAccion }}</div>
      <div v-if="offline.errorSincronizacion.value" class="safic-alerta" role="alert">
        No se pudieron enviar los registros hechos sin conexión:
        {{ offline.errorSincronizacion.value }}
      </div>
      <div v-if="offline.resumen.value" class="safic-alerta" role="status">
        Se enviaron {{ offline.resumen.value.enviados }} registro(s) hechos sin conexión.
        <template v-if="offline.resumen.value.conflictos.length > 0">
          Con conflicto (quedaron anotados en la bitácora):
          {{ offline.resumen.value.conflictos.map((c) => `${c.nombre} — ${c.motivo}`).join('; ') }}.
        </template>
        <template v-if="offline.resumen.value.rechazados.length > 0">
          No se pudieron guardar:
          {{ offline.resumen.value.rechazados.map((c) => `${c.nombre} — ${c.motivo}`).join('; ') }}.
        </template>
        <q-btn flat no-caps dense label="Entendido" @click="offline.cerrarResumen()" />
      </div>

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

      <button
        v-if="!lectura && session.tienePermiso('incidencias.reportar')"
        type="button"
        class="garita-incidencia"
        @click="reportarIncidencia"
      >
        <q-icon name="sym_r_report" size="20px" />Reportar un problema
      </button>

      <div v-if="panel.isError.value && !panel.data.value" class="safic-alerta" role="alert">
        {{ panel.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="panel.refetch()" />
      </div>
      <template v-else-if="panel.isPending.value">
        <q-skeleton v-for="i in 2" :key="i" type="rect" height="96px" aria-busy="true" />
      </template>
      <template v-else>
        <section
          v-if="solicitudes.length > 0"
          class="garita-solicitudes"
          aria-label="Esperando al residente"
        >
          <h2 class="garita-solicitudes__titulo">Esperando al residente</h2>
          <article v-for="s in solicitudes" :key="s.id" class="garita-solicitud">
            <div class="garita-solicitud__textos">
              <div class="garita-solicitud__nombre">{{ s.nombre }}</div>
              <div class="garita-solicitud__detalle">
                {{ textoTipoSolicitud(s.tipo) }} para {{ s.unidad ?? '—'
                }}<template v-if="s.placa"> · {{ s.placa }}</template>
              </div>
              <div
                class="garita-solicitud__estado"
                :class="`garita-solicitud__estado--${s.estado}`"
                role="status"
              >
                <template v-if="s.estado === 'pendiente'"
                  >Esperando respuesta ·
                  <span aria-hidden="true">{{ cuentaAtras(restante(s)) }}</span></template
                >
                <template v-else-if="s.estado === 'permitida'"
                  >El residente permitió el ingreso</template
                >
                <template v-else-if="s.estado === 'rechazada'"
                  >El residente rechazó el ingreso</template
                >
                <template v-else>No respondió a tiempo · llama por teléfono</template>
              </div>
            </div>
            <div class="garita-solicitud__acciones">
              <button
                v-if="s.estado === 'permitida' && s.puede_ingresar"
                type="button"
                class="garita-solicitud__ingreso"
                :disabled="ocupado"
                @click="ingresarSolicitud(s)"
              >
                Registrar ingreso
              </button>
              <button
                type="button"
                class="garita-solicitud__quitar"
                :disabled="ocupado"
                @click="retirarSolicitud(s)"
              >
                {{ s.estado === 'pendiente' ? 'Retirar' : 'Quitar' }}
              </button>
            </div>
          </article>
        </section>
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
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import EscanerQrDialog from '@/modules/garita/components/EscanerQrDialog.vue';
import ReportarIncidenciaDialog from '@/modules/comunicacion/components/ReportarIncidenciaDialog.vue';
import IngresoSinQrDialog from '@/modules/garita/components/IngresoSinQrDialog.vue';
import {
  useCancelarSolicitud,
  useIngresoConQr,
  useIngresoDeSolicitud,
  usePanelGarita,
  useRegistrarSalida,
  useValidarQr,
} from '@/modules/garita/composables/useGarita';
import { useGaritaOffline, sinRed } from '@/modules/garita/composables/useGaritaOffline';
import { detalleDentro, detalleEsperada } from '@/modules/garita/garita.logica';
import {
  dentroLocal,
  ingresoConQrLocal,
  MENSAJE_NO_EN_COPIA,
  textoCopia,
  validarLocal,
} from '@/modules/garita/offline.logica';
import {
  cuentaAtras,
  segundosRestantes,
  textoTipoSolicitud,
} from '@/modules/garita/visitas.logica';
import type { SolicitudGarita, ValidacionQr } from '@/modules/garita/services/garita.service';
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
const ingresandoSolicitud = useIngresoDeSolicitud();
const cancelandoSolicitud = useCancelarSolicitud();
const ocupado = computed(
  () =>
    validando.isPending.value ||
    ingresando.isPending.value ||
    saliendo.isPending.value ||
    ingresandoSolicitud.isPending.value ||
    cancelandoSolicitud.isPending.value,
);

// Cuenta atrás de las preguntas al residente, sin pedir nada al servidor
const ahora = ref(Date.now());
const reloj = setInterval(() => (ahora.value = Date.now()), 1000);
onBeforeUnmount(() => clearInterval(reloj));
const solicitudes = computed(() => panel.data.value?.solicitudes ?? []);

function restante(s: SolicitudGarita): number {
  return segundosRestantes(s.segundos_restantes, panel.dataUpdatedAt.value, ahora.value);
}

const offline = useGaritaOffline();
onBeforeUnmount(() => offline.liberar());

const lectura = ref<ValidacionQr | null>(null);
/** La lectura se hizo con la copia del teléfono (sin red). */
const lecturaLocal = ref(false);
const token = ref<string | null>(null);
const mensaje = ref<string | null>(null);
const errorAccion = ref<string | null>(null);

const dentro = computed(() => [
  ...(panel.data.value?.dentro ?? [])
    .filter((d) => !offline.cola.value.salidas.some((x) => x.acceso_id === d.id))
    .map((d) => ({
      id: String(d.id),
      nombre: d.nombre,
      detalle: detalleDentro(d),
    })),
  // Lo registrado sin conexión que aún no llegó al servidor
  ...dentroLocal(offline.cola.value).map((i) => ({
    id: `L:${i.uuid}`,
    nombre: i.nombre,
    detalle: `${i.unidad_codigo ?? i.destino ?? 'Sin destino'} · pendiente de enviar`,
  })),
]);
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
    lecturaLocal.value = false;
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
    if (!navigator.onLine) {
      leerConCopia(leido);
      return;
    }
    validando.mutate(leido, {
      onSuccess: (r) => {
        token.value = leido;
        lecturaLocal.value = false;
        lectura.value = r;
      },
      // La red se cayó justo ahora: se valida con la copia del teléfono
      onError: (error) => (sinRed(error) ? leerConCopia(leido) : fallar(error)),
    });
  });
}

function leerConCopia(leido: string): void {
  const r = validarLocal(leido, offline.copia.value, offline.cola.value, Date.now());
  if (!r) {
    errorAccion.value = MENSAJE_NO_EN_COPIA;
    return;
  }
  token.value = leido;
  lecturaLocal.value = true;
  lectura.value = r;
}

/** Guarda el ingreso en el teléfono para enviarlo cuando vuelva la red. */
async function registrarLocal(leido: string): Promise<void> {
  const qr = offline.copia.value?.qrs.find((q) => q.token === leido);
  if (!qr) return;
  const guardado = await offline.registrarIngreso(ingresoConQrLocal(qr, Date.now()));
  if (!guardado) {
    errorAccion.value =
      'No se pudo guardar en el teléfono (sin espacio o modo privado). Anota el ingreso a mano y no cierres esta pestaña.';
    return;
  }
  mensaje.value = `Ingreso de ${qr.visitante} guardado sin conexión. Se enviará al volver la red.`;
}

function descartar(): void {
  lecturaLocal.value = false;
  lectura.value = null;
  token.value = null;
}

function registrarIngreso(): void {
  const t = token.value;
  if (!t || ocupado.value) return;
  errorAccion.value = null;
  if (lecturaLocal.value || !navigator.onLine) {
    void registrarLocal(t);
    descartar();
    return;
  }
  ingresando.mutate(t, {
    onSuccess: () => {
      mensaje.value = `Ingreso de ${lectura.value?.visita.visitante ?? 'la visita'} registrado.`;
      descartar();
    },
    onError: (error) => {
      // Se cayó la red entre validar y registrar: no se cortó la fila, se guarda sin conexión
      if (sinRed(error)) {
        void registrarLocal(t);
        descartar();
        return;
      }
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

function reportarIncidencia(): void {
  mensaje.value = null;
  errorAccion.value = null;
  // El guardia reporta problemas de las áreas comunes: sin unidad
  $q.dialog({ component: ReportarIncidenciaDialog, componentProps: { unidades: [] } }).onOk(
    (m: string) => (mensaje.value = m),
  );
}

function ingresarSolicitud(s: SolicitudGarita): void {
  if (ocupado.value) return;
  errorAccion.value = null;
  ingresandoSolicitud.mutate(s.id, {
    onSuccess: () => (mensaje.value = `Ingreso de ${s.nombre} registrado.`),
    onError: fallar,
  });
}

function retirarSolicitud(s: SolicitudGarita): void {
  if (ocupado.value) return;
  errorAccion.value = null;
  cancelandoSolicitud.mutate(s.id, { onError: fallar });
}

function salidaLocal(quien: { uuid: string } | { accesoId: number }): void {
  void offline.registrarSalida(quien).then((guardado) => {
    if (guardado) mensaje.value = 'Salida guardada sin conexión. Se enviará al volver la red.';
    else errorAccion.value = 'No se pudo guardar la salida en el teléfono. Anótala a mano.';
  });
}

function registrarSalida(id: string): void {
  if (ocupado.value) return;
  errorAccion.value = null;
  if (id.startsWith('L:') || !navigator.onLine) {
    salidaLocal(id.startsWith('L:') ? { uuid: id.slice(2) } : { accesoId: Number(id) });
    return;
  }
  saliendo.mutate(Number(id), {
    onSuccess: () => (mensaje.value = 'Salida registrada.'),
    onError: (error) => {
      if (!sinRed(error)) return fallar(error);
      salidaLocal({ accesoId: Number(id) });
    },
  });
}
</script>

<style scoped>
.garita-solicitudes {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.garita-solicitudes__titulo {
  margin: 0;
  font-size: 14px;
  font-weight: 800;
}

.garita-solicitud {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 14px;
  background: #ffffff;
  border: 1px solid var(--safic-borde);
}

.garita-solicitud__textos {
  flex: 1 1 0;
  min-width: 0;
}

.garita-solicitud__nombre {
  font-size: 15px;
  font-weight: 800;
}

.garita-solicitud__detalle {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.garita-solicitud__estado {
  margin-top: 2px;
  font-size: 13px;
  font-weight: 700;
}

.garita-solicitud__estado--pendiente {
  color: #8a3f0a;
}

.garita-solicitud__estado--permitida {
  color: #0b4a47;
}

.garita-solicitud__estado--rechazada,
.garita-solicitud__estado--vencida {
  color: #b3261e;
}

.garita-solicitud__acciones {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.garita-solicitud__ingreso,
.garita-solicitud__quitar {
  min-height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.garita-solicitud__ingreso {
  border: none;
  background: var(--q-primary);
  color: #ffffff;
}

.garita-solicitud__quitar {
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
}

.garita-solicitud__ingreso:disabled,
.garita-solicitud__quitar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.garita-incidencia {
  min-height: 44px;
  border-radius: 12px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: var(--safic-texto);
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

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
