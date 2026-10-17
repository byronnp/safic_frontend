<template>
  <div class="app-pagina">
    <AppEncabezado :antetitulo="antetitulo" titulo="Paquetes" />

    <div class="app-cuerpo paquetes-cuerpo">
      <button type="button" class="paquetes-recibir" :disabled="ocupado" @click="recibir">
        <q-icon name="sym_r_add_a_photo" size="24px" />Recibir paquete
      </button>

      <div v-if="resultado" class="paquetes-resultado" role="status">{{ resultado }}</div>
      <div v-if="errorAccion" class="safic-alerta" role="alert">{{ errorAccion }}</div>

      <div role="tablist" aria-label="Paquetes" class="paquetes-pestanas">
        <button
          type="button"
          role="tab"
          class="paquetes-pestana"
          :class="{ 'paquetes-pestana--activa': pestana === 'garita' }"
          :aria-selected="pestana === 'garita'"
          @click="pestana = 'garita'"
        >
          En garita ({{ enGarita.length }})
        </button>
        <button
          type="button"
          role="tab"
          class="paquetes-pestana"
          :class="{ 'paquetes-pestana--activa': pestana === 'entregados' }"
          :aria-selected="pestana === 'entregados'"
          @click="pestana = 'entregados'"
        >
          Entregados hoy ({{ entregados.length }})
        </button>
      </div>

      <div v-if="consulta.isError.value" class="safic-alerta" role="alert">
        {{ consulta.error.value?.mensaje }}
        <q-btn flat no-caps dense label="Reintentar" @click="consulta.refetch()" />
      </div>
      <template v-else-if="consulta.isPending.value">
        <q-skeleton v-for="i in 3" :key="i" type="rect" height="72px" aria-busy="true" />
      </template>

      <template v-else-if="pestana === 'garita'">
        <div v-for="p in enGarita" :key="p.id" class="paquetes-paquete">
          <button
            type="button"
            class="paquetes-fila"
            :aria-expanded="abierto === p.id"
            @click="abrir(p.id)"
          >
            <q-icon name="sym_r_package_2" size="24px" class="paquetes-fila__icono" />
            <span class="paquetes-fila__textos">
              <span class="paquetes-fila__titulo">{{ p.unidad }} · {{ p.empresa }}</span>
              <span
                class="paquetes-fila__detalle"
                :class="{ 'paquetes-fila__detalle--atrasado': p.atrasado }"
              >
                {{ detallePaquete(p, hoy)
                }}<template v-if="p.atrasado"> · {{ haceDias(p.dias) }} · Más de 7 días</template>
              </span>
            </span>
            <q-icon
              :name="abierto === p.id ? 'sym_r_expand_less' : 'sym_r_chevron_right'"
              size="22px"
            />
          </button>

          <div v-if="abierto === p.id" class="paquetes-entrega">
            <img
              v-if="p.foto_url"
              :src="p.foto_url"
              alt="Foto del paquete"
              class="paquetes-foto"
              referrerpolicy="no-referrer"
            />
            <div class="paquetes-entrega__titulo">Entregar paquete de {{ p.unidad }}</div>

            <div class="paquetes-modo" role="radiogroup" aria-label="Quién retira">
              <button
                type="button"
                role="radio"
                class="paquetes-opcion"
                :class="{ 'paquetes-opcion--activa': modo === 'ocupante' }"
                :aria-checked="modo === 'ocupante'"
                @click="modo = 'ocupante'"
              >
                Ocupante
              </button>
              <button
                type="button"
                role="radio"
                class="paquetes-opcion"
                :class="{ 'paquetes-opcion--activa': modo === 'autorizado' }"
                :aria-checked="modo === 'autorizado'"
                @click="modo = 'autorizado'"
              >
                Persona autorizada
              </button>
            </div>

            <template v-if="modo === 'ocupante'">
              <div v-if="p.ocupantes.length === 0" class="paquetes-nota" role="alert">
                Esta unidad no tiene ocupantes vigentes. Usa «Persona autorizada» con la
                administración.
              </div>
              <div
                v-else
                class="paquetes-retira"
                role="radiogroup"
                aria-label="Ocupante que retira"
              >
                <button
                  v-for="o in p.ocupantes"
                  :key="o.id"
                  type="button"
                  role="radio"
                  class="paquetes-ocupante"
                  :class="{ 'paquetes-ocupante--activo': ocupanteId === o.id }"
                  :aria-checked="ocupanteId === o.id"
                  @click="ocupanteId = o.id"
                >
                  {{ o.nombre }} <span class="paquetes-nota">· ocupante vigente</span>
                </button>
              </div>
            </template>
            <input
              v-else
              v-model="autorizado"
              class="paquetes-input"
              maxlength="120"
              placeholder="Nombre completo de quien retira"
              aria-label="Nombre de la persona autorizada"
            />

            <!-- Dentro de un v-for un ref normal sería un arreglo: se guarda solo la firma de la fila abierta -->
            <FirmaPad :ref="guardarFirma" @cambio="hayFirma = $event" />
            <div v-if="errorEntrega" class="paquetes-error" role="alert">{{ errorEntrega }}</div>

            <button
              type="button"
              class="paquetes-confirmar"
              :disabled="ocupado || enviando"
              @click="entregar(p)"
            >
              Confirmar entrega
            </button>
          </div>
        </div>
        <div v-if="!enGarita.length" class="paquetes-vacio">No hay paquetes en garita.</div>
      </template>

      <template v-else>
        <div
          v-for="p in entregados"
          :key="p.id"
          class="paquetes-paquete paquetes-paquete--entregado"
        >
          <q-icon name="sym_r_check_circle" size="24px" class="paquetes-fila__icono" />
          <div class="paquetes-fila__textos">
            <div class="paquetes-fila__titulo">{{ p.unidad }} · {{ p.empresa }}</div>
            <div class="paquetes-fila__detalle">
              {{ horaDe(p.entregado_en)
              }}<template v-if="p.retira_nombre"> · retiró {{ p.retira_nombre }}</template>
            </div>
          </div>
        </div>
        <div v-if="!entregados.length" class="paquetes-vacio">
          Aún no se entregó ningún paquete hoy.
        </div>
      </template>

      <div class="paquetes-nota">
        Al entregar, firma quien retira: ocupante vigente o persona autorizada por el residente.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useQuasar } from 'quasar';
import { computed, ref, watch } from 'vue';

import AppEncabezado from '@/components/app/AppEncabezado.vue';
import { aApiError } from '@/core/api/errors';
import FirmaPad from '@/modules/garita/components/FirmaPad.vue';
import RecibirPaqueteDialog from '@/modules/garita/components/RecibirPaqueteDialog.vue';
import { useEntregarPaquete, usePaquetesGarita } from '@/modules/garita/composables/usePaquetes';
import { horaDe } from '@/modules/garita/garita.logica';
import { detallePaquete, haceDias, validarRetira } from '@/modules/garita/paquetes.logica';
import type { PaqueteEnGarita } from '@/modules/garita/services/paquetes.service';
import { useSessionStore } from '@/stores/session';
import { hoyEcuador } from '@/utils/fecha';

const $q = useQuasar();
const session = useSessionStore();
const hoy = hoyEcuador();

const consulta = usePaquetesGarita();
const entregando = useEntregarPaquete();
const enGarita = computed(() => consulta.data.value?.en_garita ?? []);
const entregados = computed(() => consulta.data.value?.entregados_hoy ?? []);
const antetitulo = computed(() => session.condominioActivo?.nombre ?? '');
const ocupado = computed(() => entregando.isPending.value);

const pestana = ref<'garita' | 'entregados'>('garita');
const abierto = ref<number | null>(null);
const modo = ref<'ocupante' | 'autorizado'>('ocupante');
const ocupanteId = ref<number | null>(null);
const autorizado = ref('');
const hayFirma = ref(false);
const firma = ref<InstanceType<typeof FirmaPad> | null>(null);
const enviando = ref(false);

function guardarFirma(el: unknown): void {
  firma.value = el as InstanceType<typeof FirmaPad> | null;
}
const resultado = ref<string | null>(null);
const errorAccion = ref<string | null>(null);
const errorEntrega = ref<string | null>(null);

function reiniciarEntrega(): void {
  modo.value = 'ocupante';
  ocupanteId.value = null;
  autorizado.value = '';
  hayFirma.value = false;
  errorEntrega.value = null;
}

// Otro condominio: nada de lo abierto ni avisado queda
watch(
  () => session.condominioId,
  () => {
    abierto.value = null;
    resultado.value = null;
    errorAccion.value = null;
    reiniciarEntrega();
  },
);

function abrir(id: number): void {
  abierto.value = abierto.value === id ? null : id;
  reiniciarEntrega();
}

function recibir(): void {
  resultado.value = null;
  errorAccion.value = null;
  $q.dialog({ component: RecibirPaqueteDialog }).onOk((m: string) => (resultado.value = m));
}

async function entregar(p: PaqueteEnGarita): Promise<void> {
  // Un doble toque no entrega dos veces; `enviando` cubre también la espera de convertir la firma a imagen
  if (entregando.isPending.value || enviando.value) return;
  errorEntrega.value = null;
  errorAccion.value = null;

  const problema = validarRetira(modo.value, ocupanteId.value, autorizado.value, hayFirma.value);
  if (problema) {
    errorEntrega.value = problema;
    return;
  }
  enviando.value = true;
  const archivo = await firma.value?.aArchivo();
  if (!archivo) {
    enviando.value = false;
    errorEntrega.value = 'Falta la firma de quien retira.';
    return;
  }

  try {
    await entregando.mutateAsync({
      id: p.id,
      entrega: {
        ocupante_id: modo.value === 'ocupante' ? ocupanteId.value : null,
        autorizado: modo.value === 'autorizado' ? autorizado.value.trim() : null,
        firma: archivo,
      },
    });
    resultado.value = `Paquete de ${p.empresa} entregado a ${p.unidad}.`;
    firma.value?.limpiar();
    abierto.value = null;
    reiniciarEntrega();
  } catch (error) {
    const apiError = aApiError(error);
    // Otra persona ya lo entregó o el ocupante dejó de vivir ahí: se vuelve a leer la lista
    if (apiError.codigo === 'PAQUETE_YA_ENTREGADO' || apiError.codigo === 'OCUPANTE_NO_VIGENTE') {
      abierto.value = null;
      void consulta.refetch();
    }
    // Sin respuesta o 5xx la entrega pudo registrarse: se avisa para no repetirla a ciegas
    errorEntrega.value =
      apiError.estado === 0 || apiError.estado >= 500
        ? `${apiError.mensaje} Revisa «Entregados hoy» antes de reintentar: pudo registrarse.`
        : apiError.mensaje;
  } finally {
    enviando.value = false;
  }
}
</script>

<style scoped>
.paquetes-cuerpo {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.paquetes-recibir {
  height: 64px;
  border-radius: 14px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
  font-family: inherit;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
}

.paquetes-resultado {
  padding: 12px 14px;
  border-radius: 10px;
  background: #e3efec;
  color: #0b4a47;
  font-weight: 700;
  font-size: 14px;
}

.paquetes-pestanas {
  display: flex;
  border-bottom: 1px solid var(--safic-borde);
}

.paquetes-pestana {
  flex: 1 1 0;
  min-height: 44px;
  border: none;
  border-bottom: 3px solid transparent;
  background: transparent;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  color: var(--safic-texto-suave);
  cursor: pointer;
}

.paquetes-pestana--activa {
  color: var(--safic-texto);
  border-bottom-color: var(--q-primary);
}

.paquetes-paquete {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 14px;
  overflow: hidden;
}

.paquetes-paquete--entregado {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
}

.paquetes-fila {
  width: 100%;
  min-height: 64px;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border: none;
  background: transparent;
  text-align: left;
  font-family: inherit;
  color: inherit;
  cursor: pointer;
}

.paquetes-fila__icono {
  color: var(--q-primary);
  flex-shrink: 0;
}

.paquetes-fila__textos {
  flex: 1 1 0;
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.paquetes-fila__titulo {
  font-size: 15px;
  font-weight: 800;
}

.paquetes-fila__detalle {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.paquetes-fila__detalle--atrasado {
  color: #b3261e;
  font-weight: 700;
}

.paquetes-entrega {
  padding: 4px 14px 14px;
  display: flex;
  flex-direction: column;
  gap: 12px;
  border-top: 1px solid var(--safic-borde);
}

.paquetes-foto {
  width: 100%;
  max-height: 200px;
  object-fit: cover;
  border-radius: 10px;
  margin-top: 12px;
}

.paquetes-entrega__titulo {
  font-size: 14px;
  font-weight: 800;
}

.paquetes-modo {
  display: flex;
  gap: 8px;
}

.paquetes-opcion {
  flex: 1 1 0;
  min-height: 44px;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  font-family: inherit;
  font-size: 14px;
  font-weight: 700;
  cursor: pointer;
}

.paquetes-opcion--activa {
  background: #e3efec;
  border-color: var(--q-primary);
  color: #0b4a47;
}

.paquetes-retira {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.paquetes-ocupante {
  min-height: 44px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-2);
  background: #ffffff;
  text-align: left;
  font-family: inherit;
  font-size: 15px;
  font-weight: 700;
  cursor: pointer;
}

.paquetes-ocupante--activo {
  background: #e3efec;
  border-color: var(--q-primary);
}

.paquetes-input {
  height: 48px;
  padding: 0 12px;
  border-radius: 10px;
  border: 1px solid var(--safic-borde-campo);
  font-family: inherit;
  font-size: 15px;
}

.paquetes-confirmar {
  min-height: 52px;
  border-radius: 12px;
  border: none;
  background: var(--q-primary);
  color: #ffffff;
  font-family: inherit;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
}

.paquetes-confirmar:disabled,
.paquetes-recibir:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.paquetes-error {
  font-size: 13px;
  font-weight: 700;
  color: #b3261e;
}

.paquetes-nota {
  font-size: 12px;
  color: var(--safic-texto-suave);
  line-height: 1.5;
}

.paquetes-vacio {
  padding: 24px 16px;
  text-align: center;
  color: var(--safic-texto-suave);
}
</style>
