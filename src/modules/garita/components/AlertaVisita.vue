<template>
  <div v-if="solicitudes.length > 0" class="alerta-visita">
    <article v-for="s in solicitudes" :key="s.id" class="alerta-visita__tarjeta">
      <div class="alerta-visita__icono" aria-hidden="true">
        <q-icon name="sym_r_doorbell" size="26px" />
      </div>
      <div class="alerta-visita__textos">
        <div class="alerta-visita__titulo" role="alert">{{ s.nombre }} está en garita</div>
        <div class="alerta-visita__detalle">
          {{ textoTipo(s.tipo) }} para {{ s.unidad
          }}<template v-if="s.placa"> · {{ s.placa }}</template> ·
          <span aria-hidden="true">responde en {{ cuentaAtras(restante(s)) }}</span>
        </div>
        <div v-if="errores[s.id]" class="alerta-visita__error" role="alert">
          {{ errores[s.id] }}
        </div>
        <div class="alerta-visita__botones">
          <button
            type="button"
            class="alerta-visita__no"
            :disabled="ocupado"
            @click="responder(s, false)"
          >
            Rechazar
          </button>
          <button
            type="button"
            class="alerta-visita__si"
            :disabled="ocupado"
            @click="responder(s, true)"
          >
            Permitir ingreso
          </button>
        </div>
      </div>
    </article>
  </div>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, ref, watch } from 'vue';

import { aApiError } from '@/core/api/errors';
import { useSessionStore } from '@/stores/session';

import { useResponderIngreso, useSolicitudesDeIngreso } from '../composables/useVisitas';
import type { SolicitudDeIngreso } from '../services/visitas.service';
import { cuentaAtras, segundosRestantes, textoTipoSolicitud as textoTipo } from '../visitas.logica';

/**
 * Aviso de «alguien está en la garita»: aparece sobre cualquier pantalla de la app del residente mientras la solicitud esté vigente.
 * Solo se consulta si la persona puede autorizar visitas.
 */
const session = useSessionStore();
const activo = computed(() => session.tienePermiso('visitas.propias'));
const consulta = useSolicitudesDeIngreso(activo);
const respondiendo = useResponderIngreso();
const ocupado = computed(() => respondiendo.isPending.value);
const errores = ref<Record<number, string>>({});

// Cuenta atrás en pantalla sin pedir nada al servidor
const ahora = ref(Date.now());
const reloj = setInterval(() => (ahora.value = Date.now()), 1000);
onBeforeUnmount(() => clearInterval(reloj));

const solicitudes = computed(() => (consulta.data.value ?? []).filter((s) => restante(s) > 0));

function restante(s: SolicitudDeIngreso): number {
  return segundosRestantes(s.segundos_restantes, consulta.dataUpdatedAt.value, ahora.value);
}

// Otro condominio o sesión: nada de lo avisado queda
watch(
  () => session.condominioId,
  () => (errores.value = {}),
);

function responder(s: SolicitudDeIngreso, permitir: boolean): void {
  if (ocupado.value) return;
  errores.value = { ...errores.value, [s.id]: '' };
  respondiendo.mutate(
    { id: s.id, permitir },
    {
      onError: (e) => {
        const apiError = aApiError(e);
        // Venció o ya la respondió otra persona de la unidad: se vuelve a leer y desaparece
        void consulta.refetch();
        errores.value = {
          ...errores.value,
          [s.id]:
            apiError.codigo === 'SOLICITUD_VENCIDA' || apiError.codigo === 'SOLICITUD_YA_RESPONDIDA'
              ? 'Ya fue respondida o venció el tiempo.'
              : apiError.mensaje,
        };
      },
    },
  );
}
</script>

<style scoped>
.alerta-visita {
  position: fixed;
  top: 8px;
  left: 50%;
  transform: translateX(-50%);
  width: min(414px, calc(100vw - 16px));
  z-index: 3000;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.alerta-visita__tarjeta {
  display: flex;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  background: #fff7ec;
  border: 2px solid #e8a33d;
  box-shadow: 0 8px 24px rgba(28, 27, 24, 0.18);
}

.alerta-visita__icono {
  width: 44px;
  height: 44px;
  border-radius: 12px;
  background: #ffe2b8;
  color: #7a3808;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.alerta-visita__textos {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.alerta-visita__titulo {
  font-size: 16px;
  font-weight: 800;
}

.alerta-visita__detalle {
  font-size: 13px;
  color: var(--safic-texto-2);
}

.alerta-visita__error {
  font-size: 12px;
  font-weight: 700;
  color: #b3261e;
}

.alerta-visita__botones {
  display: flex;
  gap: 8px;
  margin-top: 6px;
}

.alerta-visita__no,
.alerta-visita__si {
  flex: 1 1 0;
  min-height: 48px;
  border-radius: 12px;
  font-family: inherit;
  font-size: 15px;
  font-weight: 800;
  cursor: pointer;
}

.alerta-visita__no {
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  color: #b3261e;
}

.alerta-visita__si {
  border: none;
  background: var(--q-primary);
  color: #ffffff;
}

.alerta-visita__no:disabled,
.alerta-visita__si:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
