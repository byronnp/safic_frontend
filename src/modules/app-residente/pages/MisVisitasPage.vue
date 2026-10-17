<template>
  <div class="app-pagina mis-visitas">
    <AppEncabezado :antetitulo="antetitulo" titulo="Mis visitas">
      <template #derecha>
        <router-link
          :to="{ name: 'app-nueva-visita' }"
          class="mis-visitas__nueva"
          aria-label="Nueva visita"
        >
          <q-icon name="sym_r_add" size="24px" />
        </router-link>
      </template>
    </AppEncabezado>

    <div class="app-cuerpo mis-visitas__cuerpo">
      <div v-if="resultado" class="mis-visitas__resultado" role="status">{{ resultado }}</div>
      <div v-if="errorAccion" class="safic-alerta" role="alert">{{ errorAccion }}</div>

      <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>

      <template v-else-if="consulta.isPending.value">
        <q-skeleton v-for="i in 3" :key="i" type="rect" height="96px" aria-busy="true" />
      </template>

      <div v-else-if="visitas.length === 0" class="app-tarjeta mis-visitas__vacio">
        <q-icon name="sym_r_badge" size="36px" class="text-suave" />
        <div>Aún no tienes visitas autorizadas.</div>
        <router-link :to="{ name: 'app-nueva-visita' }" class="mis-visitas__enlace">
          Autorizar una visita
        </router-link>
      </div>

      <template v-else>
        <h2 class="mis-visitas__titulo">Autorizadas</h2>
        <div v-for="v in visitas" :key="v.id" class="app-tarjeta mis-visitas__visita">
          <div class="mis-visitas__fila">
            <div class="col-grow">
              <div class="mis-visitas__nombre">{{ v.visitante }}</div>
              <div class="mis-visitas__cuando">
                {{ cuandoVisita(v, hoy) }}<template v-if="v.placa"> · {{ v.placa }}</template
                ><template v-if="unidades.length > 1"> · {{ v.unidad }}</template>
              </div>
            </div>
            <EstadoBadge :tono="v.tipo === 'recurrente' ? 'info' : 'neutro'">{{
              v.tipo === 'recurrente' ? 'Recurrente' : 'Única'
            }}</EstadoBadge>
          </div>
          <div class="mis-visitas__acciones">
            <button type="button" class="mis-visitas__compartir" @click="verQr(v)">
              <q-icon name="sym_r_share" size="18px" /> Compartir QR
            </button>
            <button
              type="button"
              class="mis-visitas__revocar"
              :disabled="revocando.isPending.value"
              @click="pedirRevocar(v)"
            >
              Revocar
            </button>
          </div>
        </div>
      </template>

      <template v-if="ingresos.length > 0">
        <h2 class="mis-visitas__titulo">Ingresos a tu unidad</h2>
        <div class="app-tarjeta">
          <div
            v-for="i in ingresos"
            :key="i.id"
            class="mis-visitas__fila mis-visitas__fila--ingreso"
          >
            <q-icon :name="i.estado === 'dentro' ? 'sym_r_login' : 'sym_r_logout'" size="22px" />
            <div class="col-grow">
              <div class="mis-visitas__area">
                {{ i.nombre }} {{ i.estado === 'dentro' ? 'ingresó' : 'salió' }}
              </div>
              <div class="mis-visitas__cuando">
                {{
                  diaDe(i.estado === 'dentro' ? i.entrada_en : (i.salida_en ?? i.entrada_en), hoy)
                }}
                {{ horaDe(i.estado === 'dentro' ? i.entrada_en : i.salida_en) }} ·
                {{ ETIQUETA_AUTORIZO[i.autorizado_por] }}
              </div>
            </div>
          </div>
        </div>
      </template>

      <div v-if="!consulta.isPending.value && !consulta.isError.value" class="mis-visitas__nota">
        El QR no lleva datos personales. Ves nombre y hora; la cédula solo la ve la garita.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import EstadoBadge from '@/components/EstadoBadge.vue';
import { aApiError } from '@/core/api/errors';
import VisitaQrDialog from '@/modules/garita/components/VisitaQrDialog.vue';
import { useMisVisitas, useRevocarVisita } from '@/modules/garita/composables/useVisitas';
import type { VisitaAutorizada } from '@/modules/garita/services/visitas.service';
import { diaDe, ETIQUETA_AUTORIZO, horaDe } from '@/modules/garita/garita.logica';
import { cuandoVisita } from '@/modules/garita/visitas.logica';
import { useSessionStore } from '@/stores/session';
import { hoyEcuador } from '@/utils/fecha';

const $q = useQuasar();
const session = useSessionStore();
const consulta = useMisVisitas();
const revocando = useRevocarVisita();

const hoy = hoyEcuador();
const visitas = computed(() => consulta.data.value?.visitas ?? []);
const unidades = computed(() => consulta.data.value?.unidades ?? []);
const ingresos = computed(() => consulta.data.value?.ingresos ?? []);
const antetitulo = computed(() =>
  [unidades.value.map((u) => u.codigo).join(', '), session.condominioActivo?.nombre]
    .filter(Boolean)
    .join(' · '),
);

const resultado = ref<string | null>(null);
const errorAccion = ref<string | null>(null);

watch(
  () => session.condominioId,
  () => {
    resultado.value = null;
    errorAccion.value = null;
  },
);

function verQr(v: VisitaAutorizada): void {
  $q.dialog({
    component: VisitaQrDialog,
    componentProps: { visita: v, condominio: session.condominioActivo?.nombre ?? 'el condominio' },
  });
}

function pedirRevocar(v: VisitaAutorizada): void {
  if (revocando.isPending.value) return;
  $q.dialog({
    title: 'Revocar autorización',
    message: `El QR de ${v.visitante} dejará de servir en la garita.`,
    cancel: { label: 'Mantenerla', flat: true, noCaps: true },
    ok: { label: 'Revocar', unelevated: true, noCaps: true, color: 'negative' },
    persistent: true,
  }).onOk(() => {
    // Dos toques rápidos abren dos cuadros: se vuelve a mirar al confirmar
    if (revocando.isPending.value) return;
    resultado.value = null;
    errorAccion.value = null;
    revocando.mutate(v.id, {
      onSuccess: () => (resultado.value = `Autorización de ${v.visitante} revocada.`),
      onError: (error) => {
        const apiError = aApiError(error);
        // Sin respuesta o 5xx pudo revocarse: la lista se vuelve a pedir y se avisa
        errorAccion.value =
          apiError.estado === 0 || apiError.estado >= 500
            ? `${apiError.mensaje} Revisa tus visitas antes de reintentar: pudo revocarse.`
            : apiError.mensaje;
      },
    });
  });
}
</script>

<style scoped>
.mis-visitas__nueva {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.16);
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  text-decoration: none;
}

.mis-visitas__cuerpo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.mis-visitas__resultado {
  padding: 12px 14px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
  font-size: 14px;
}

.mis-visitas__titulo {
  margin: 4px 0 0;
  font-size: 14px;
  font-weight: 800;
  color: var(--safic-texto-suave);
  letter-spacing: 0.3px;
}

.mis-visitas__visita {
  padding: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.mis-visitas__fila {
  display: flex;
  align-items: center;
  gap: 10px;
}

.mis-visitas__nombre {
  font-size: 15px;
  font-weight: 800;
}

.mis-visitas__cuando {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.mis-visitas__fila--ingreso {
  padding: 12px 14px;
  border-top: 1px solid var(--safic-borde);
}

.mis-visitas__fila--ingreso:first-child {
  border-top: none;
}

.mis-visitas__acciones {
  display: flex;
  gap: 8px;
}

.mis-visitas__compartir,
.mis-visitas__revocar {
  min-height: 44px;
  padding: 0 14px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 14px;
  cursor: pointer;
  font-family: inherit;
  display: inline-flex;
  align-items: center;
  gap: 6px;
}

.mis-visitas__compartir {
  border: none;
  background: var(--q-primary);
  color: #ffffff;
}

.mis-visitas__revocar {
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: #b3261e;
}

.mis-visitas__revocar:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mis-visitas__nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}

.mis-visitas__vacio {
  padding: 28px 16px;
  text-align: center;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.mis-visitas__enlace {
  color: var(--q-primary);
  font-weight: 700;
}
</style>
