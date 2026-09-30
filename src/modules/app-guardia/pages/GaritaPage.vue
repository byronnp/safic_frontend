<template>
  <div class="app-pagina">
    <AppEncabezado
      class="garita-encabezado"
      :antetitulo="`${GARITA_TURNO.garita} · ${GARITA_TURNO.turno} · ${GARITA_TURNO.guardia}`"
      titulo="Garita"
    >
      <template #derecha>
        <GaritaIndicadorConexion />
      </template>
      <div role="tablist" aria-label="Registro de garita" class="garita-pestanas">
        <button
          id="garita-pestana-visitas"
          type="button"
          role="tab"
          class="garita-pestana"
          :class="{ 'garita-pestana--activa': pestana === 'visitas' }"
          :aria-selected="pestana === 'visitas'"
          aria-controls="garita-panel"
          @click="pestana = 'visitas'"
        >
          Visitas
        </button>
        <button
          id="garita-pestana-paquetes"
          type="button"
          role="tab"
          class="garita-pestana"
          :class="{ 'garita-pestana--activa': pestana === 'paquetes' }"
          :aria-selected="pestana === 'paquetes'"
          aria-controls="garita-panel"
          @click="pestana = 'paquetes'"
        >
          Paquetes · {{ paquetes.length }}
        </button>
      </div>
    </AppEncabezado>

    <!-- Visitas -->
    <div
      v-if="pestana === 'visitas'"
      id="garita-panel"
      role="tabpanel"
      aria-labelledby="garita-pestana-visitas"
      class="app-cuerpo garita-cuerpo"
    >
      <div v-if="!qrLeido" class="garita-acciones">
        <button type="button" class="garita-escanear" @click="escanear">
          <q-icon name="sym_r_qr_code_scanner" size="26px" />Escanear QR
        </button>
        <button type="button" class="garita-sin-qr" @click="visitaSinQr">Visita sin QR</button>
      </div>

      <div v-else class="garita-qr" role="region" aria-label="Resultado del QR">
        <div class="garita-qr__estado">
          <q-icon name="sym_r_check" size="20px" class="garita-qr__check" />QR válido
        </div>
        <div class="garita-qr__nombre">{{ GARITA_QR_LEIDO.nombre }}</div>
        <div class="garita-qr__detalle">
          Visita a <strong>{{ GARITA_QR_LEIDO.unidad }}</strong> · autorizó
          {{ GARITA_QR_LEIDO.autorizo }}<br />{{ GARITA_QR_LEIDO.vigencia }} · Placa
          <strong>{{ GARITA_QR_LEIDO.placa }}</strong>
        </div>
        <div class="garita-qr__nota">Confirma que la persona y la placa coinciden.</div>
        <div class="garita-qr__botones">
          <button type="button" class="garita-qr__no" @click="noCoincide">No coincide</button>
          <button type="button" class="garita-qr__si" @click="registrarIngreso">
            Registrar ingreso
          </button>
        </div>
      </div>

      <GaritaListaVisitas
        titulo="Dentro ahora"
        :visitas="dentro"
        accion="Salida"
        vacio="No hay visitas dentro."
        @accion="registrarSalida"
      />
      <GaritaListaVisitas
        titulo="Esperadas hoy"
        :visitas="GARITA_ESPERADAS"
        vacio="No hay visitas esperadas hoy."
      />
    </div>

    <!-- Paquetes -->
    <div
      v-else
      id="garita-panel"
      role="tabpanel"
      aria-labelledby="garita-pestana-paquetes"
      class="app-cuerpo garita-cuerpo"
    >
      <button type="button" class="garita-recibir" @click="recibirPaquete">
        <q-icon name="sym_r_photo_camera" size="24px" />Recibir paquete (foto + unidad)
      </button>
      <h2 class="garita-subtitulo">En garita</h2>
      <div v-for="paquete in paquetes" :key="paquete.id" class="garita-paquete">
        <div class="garita-paquete__icono">
          <q-icon name="sym_r_package_2" size="24px" />
        </div>
        <div class="garita-paquete__textos">
          <div class="garita-paquete__titulo">{{ paquete.unidad }} · {{ paquete.empresa }}</div>
          <div
            class="garita-paquete__recibido"
            :class="{ 'garita-paquete__recibido--atrasado': paquete.atrasado }"
          >
            {{ paquete.recibido }}
          </div>
        </div>
        <button
          type="button"
          class="garita-paquete__entregar"
          :aria-label="`Entregar paquete de ${paquete.unidad}`"
          @click="entregar(paquete.id)"
        >
          Entregar
        </button>
      </div>
      <div v-if="!paquetes.length" class="garita-paquete garita-paquete--vacio">
        No hay paquetes en garita.
      </div>
      <div class="garita-nota">
        Al entregar, firma quien retira: ocupante vigente o persona autorizada por el residente.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref } from 'vue';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import GaritaIndicadorConexion from '@/modules/app-guardia/components/GaritaIndicadorConexion.vue';
import GaritaListaVisitas from '@/modules/app-guardia/components/GaritaListaVisitas.vue';
import type { GaritaVisitaDentro } from '@/modules/app-guardia/demo/garita';
import {
  GARITA_DENTRO,
  GARITA_ESPERADAS,
  GARITA_PAQUETES,
  GARITA_QR_LEIDO,
  GARITA_TURNO,
} from '@/modules/app-guardia/demo/garita';

const $q = useQuasar();

const pestana = ref<'visitas' | 'paquetes'>('visitas');
const qrLeido = ref(false);
const ingresoRegistrado = ref(false);
const salidas = ref<Set<string>>(new Set());
const paquetes = ref([...GARITA_PAQUETES]);

const dentro = computed<GaritaVisitaDentro[]>(() => {
  const lista: GaritaVisitaDentro[] = [...GARITA_DENTRO];
  if (ingresoRegistrado.value) {
    const qr = GARITA_QR_LEIDO;
    lista.unshift({
      id: qr.id,
      nombre: qr.nombre,
      detalle: `${qr.unidad} · visita · ${qr.placa} · ahora`,
    });
  }
  return lista.filter((v) => !salidas.value.has(v.id));
});

function escanear(): void {
  // En el mockup solo hay un QR de ejemplo: una vez registrado no se vuelve a leer.
  if (ingresoRegistrado.value) {
    $q.notify({ type: 'info', message: 'Este QR ya se usó para registrar el ingreso.' });
    return;
  }
  qrLeido.value = true;
}

function noCoincide(): void {
  qrLeido.value = false;
}

function registrarIngreso(): void {
  qrLeido.value = false;
  ingresoRegistrado.value = true;
  $q.notify({ type: 'positive', message: 'Ingreso registrado.' });
}

function registrarSalida(id: string): void {
  salidas.value = new Set(salidas.value).add(id);
  $q.notify({ type: 'positive', message: 'Salida registrada.' });
}

function visitaSinQr(): void {
  $q.notify({ type: 'info', message: 'El registro de visitas sin QR estará disponible pronto.' });
}

function recibirPaquete(): void {
  $q.notify({ type: 'info', message: 'La recepción de paquetes estará disponible pronto.' });
}

function entregar(id: string): void {
  paquetes.value = paquetes.value.filter((p) => p.id !== id);
  $q.notify({ type: 'positive', message: 'Paquete entregado.' });
}
</script>

<style scoped>
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
