<template>
  <q-page class="safic-main planes">
    <PaginaEncabezado miga="Plataforma / Planes y módulos" titulo="Planes y módulos">
      <template #acciones>
        <q-btn
          no-caps
          unelevated
          class="safic-btn safic-btn--secundario planes__btn"
          label="Nuevo plan"
          @click="
            $q.notify({ type: 'info', message: 'Crear un plan nuevo estará disponible pronto.' })
          "
        />
        <q-btn
          no-caps
          unelevated
          class="safic-btn planes__btn planes__guardar"
          :class="{ 'planes__guardar--activo': cambios }"
          :label="cambios ? 'Guardar cambios' : 'Sin cambios'"
          :disable="!cambios"
          @click="guardar"
        />
      </template>
    </PaginaEncabezado>

    <div class="planes__aviso">
      <q-icon name="sym_r_info" size="20px" class="planes__aviso-icono" />
      <span
        >El plan define solo <strong>qué módulos</strong> tiene el condominio. El
        <strong>precio</strong> sale de cada condominio: total de unidades × valor por unidad + IVA.
        Se configura en la cuenta del condominio.</span
      >
    </div>

    <div class="planes__tabla">
      <div class="planes__desplazable">
        <div class="planes__fila planes__cabecera" :style="estiloGrilla">
          <div class="planes__columna">MÓDULO</div>
          <div v-for="p in PLANES" :key="p.clave" class="text-center">
            <div class="planes__plan">{{ p.nombre }}</div>
            <div class="planes__condominios">
              {{ p.condominios }} {{ p.condominios === 1 ? 'condominio' : 'condominios' }}
            </div>
          </div>
        </div>

        <div
          v-for="m in modulos"
          :key="m.clave"
          class="planes__fila planes__modulo"
          :style="estiloGrilla"
        >
          <div>
            <div class="planes__nombre">{{ m.nombre }}</div>
            <div class="planes__desc">
              {{ m.siempreIncluido ? `${m.descripcion} · siempre incluido` : m.descripcion }}
            </div>
          </div>
          <div v-for="p in PLANES" :key="p.clave" class="planes__centro">
            <PlanesInterruptor
              :model-value="incluye(m, p.clave)"
              :bloqueado="m.siempreIncluido"
              :etiqueta="`${m.nombre} en plan ${p.nombre}`"
              @update:model-value="alternar(m, p.clave, $event)"
            />
          </div>
        </div>

        <div class="planes__fila planes__limites" :style="estiloGrilla">
          <div>
            <div class="planes__nombre">Usuarios administrativos</div>
            <div class="planes__desc">
              Máximo de personas con rol administrador, tesorero o contador
            </div>
          </div>
          <div v-for="p in PLANES" :key="p.clave" class="planes__centro planes__contador">
            <button
              type="button"
              class="planes__paso"
              :aria-label="`Menos usuarios en plan ${p.nombre}`"
              @click="cambiarLimite(p.clave, -1)"
            >
              −
            </button>
            <span class="planes__limite" aria-live="polite">{{ limites[p.clave] }}</span>
            <button
              type="button"
              class="planes__paso"
              :aria-label="`Más usuarios en plan ${p.nombre}`"
              @click="cambiarLimite(p.clave, 1)"
            >
              +
            </button>
          </div>
        </div>
      </div>
    </div>

    <div class="planes__ajustes">
      <label class="planes__campo"
        >Días de prueba gratis<input
          v-model="ajustes.diasPrueba"
          class="planes__input"
          @input="cambios = true"
      /></label>
      <label class="planes__campo"
        >Descuento por pago anual<input
          v-model="ajustes.descuentoAnual"
          class="planes__input"
          @input="cambios = true"
      /></label>
      <label class="planes__campo"
        >Valor por unidad sugerido al crear<input
          v-model="ajustes.valorUnidadSugerido"
          class="planes__input"
          @input="cambios = true"
      /></label>
    </div>
  </q-page>
</template>

<script setup lang="ts">
import { reactive, ref } from 'vue';
import { useQuasar } from 'quasar';
import PaginaEncabezado from '@/components/PaginaEncabezado.vue';
import PlanesInterruptor from '../components/PlanesInterruptor.vue';
import { AJUSTES_PLANES, MODULOS_PLATAFORMA, PLANES, type ModuloPlataforma } from '../demo/planes';

const $q = useQuasar();

const estiloGrilla = { gridTemplateColumns: `minmax(260px, 1fr) repeat(${PLANES.length}, 180px)` };

const modulos = ref<ModuloPlataforma[]>(
  MODULOS_PLATAFORMA.map((m) => ({ ...m, planes: [...m.planes] })),
);
const limites = reactive<Record<string, number>>(
  Object.fromEntries(PLANES.map((p) => [p.clave, p.usuariosAdministrativos])),
);
const ajustes = reactive({ ...AJUSTES_PLANES });
const cambios = ref(false);

function incluye(modulo: ModuloPlataforma, plan: string): boolean {
  return modulo.siempreIncluido || modulo.planes.includes(plan);
}

function alternar(modulo: ModuloPlataforma, plan: string, activo: boolean): void {
  modulo.planes = activo ? [...modulo.planes, plan] : modulo.planes.filter((p) => p !== plan);
  cambios.value = true;
}

function cambiarLimite(plan: string, delta: number): void {
  limites[plan] = Math.max(1, (limites[plan] ?? 1) + delta);
  cambios.value = true;
}

function guardar(): void {
  cambios.value = false;
  $q.notify({ type: 'positive', message: 'Cambios de planes guardados.' });
}
</script>

<style scoped>
.planes.safic-main {
  padding: 28px 36px;
  gap: 16px;
}

.planes__btn.q-btn {
  padding: 0 16px;
}

.planes__guardar.q-btn {
  background: #e4e1d8;
  color: #6b675d;
}

.planes__guardar.q-btn.disabled {
  opacity: 1 !important;
}

.planes__guardar--activo.q-btn {
  background: var(--q-primary);
  color: #ffffff;
}

.planes__aviso {
  display: flex;
  align-items: center;
  gap: 12px;
  background: #e6ecf7;
  color: #23407a;
  border-radius: 12px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.45;
}

.planes__aviso-icono {
  flex-shrink: 0;
}

.planes__tabla {
  flex-grow: 1;
  background: #ffffff;
  border: 1px solid #e4e1d8;
  border-radius: 14px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.planes__desplazable {
  overflow-x: auto;
}

.planes__fila {
  display: grid;
  min-width: 800px;
}

.planes__cabecera {
  align-items: end;
  padding: 16px 20px 12px 20px;
  border-bottom: 1px solid #ece9e0;
}

.planes__columna {
  font-size: 12px;
  font-weight: 700;
  color: #5f5b52;
  letter-spacing: 0.3px;
}

.planes__plan {
  font-size: 17px;
  font-weight: 800;
}

.planes__condominios {
  font-size: 12px;
  color: #5f5b52;
  font-weight: 600;
}

.planes__modulo {
  align-items: center;
  padding: 0 20px;
  height: 54px;
  border-top: 1px solid #f0ede5;
}

.planes__nombre {
  font-size: 14px;
  font-weight: 800;
}

.planes__desc {
  font-size: 12px;
  color: #5f5b52;
}

.planes__centro {
  display: flex;
  justify-content: center;
}

.planes__limites {
  align-items: center;
  padding: 0 20px;
  height: 64px;
  border-top: 2px solid #e4e1d8;
  background: #faf9f5;
}

.planes__contador {
  align-items: center;
  gap: 8px;
}

.planes__paso {
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #d8d4c8;
  background: #ffffff;
  font-size: 16px;
  font-weight: 800;
  cursor: pointer;
  font-family: inherit;
  color: #1c1b18;
  padding: 0;
}

.planes__limite {
  min-width: 28px;
  text-align: center;
  font-size: 18px;
  font-weight: 800;
}

.planes__ajustes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.planes__campo {
  background: #ffffff;
  border: 1px solid #e4e1d8;
  border-radius: 14px;
  padding: 14px 18px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  font-size: 13px;
  font-weight: 700;
  color: #3d3a33;
}

.planes__input {
  font-weight: 400;
  height: 42px;
  border: 1px solid #cfcbbf;
  border-radius: 9px;
  padding: 0 12px;
  font-size: 15px;
  font-family: inherit;
  color: #1c1b18;
  background: #ffffff;
  min-width: 0;
}

.planes__input:focus {
  outline: 2px solid var(--q-primary);
  outline-offset: -1px;
  border-color: transparent;
}

@media (max-width: 767px) {
  .planes__ajustes {
    grid-template-columns: minmax(0, 1fr);
  }
}

@media (max-width: 599px) {
  .planes.safic-main {
    padding: 20px 16px;
  }
}
</style>
