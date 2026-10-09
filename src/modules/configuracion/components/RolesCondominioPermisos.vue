<template>
  <!-- Permisos del rol agrupados por módulo, solo lectura (mockup F1RolesCondominio) -->
  <div class="permisos">
    <template v-for="grupo in grupos" :key="grupo.grupo">
      <div class="permisos__modulo">
        <span class="permisos__modulo-nombre">{{ grupo.grupo.toUpperCase() }}</span>
      </div>
      <div v-for="p in grupo.permisos" :key="p.clave" class="permisos__fila">
        <span
          class="permisos__caja"
          :class="{ 'permisos__caja--marcada': rol.permisos.includes(p.clave) }"
          role="checkbox"
          :aria-checked="rol.permisos.includes(p.clave)"
          aria-readonly="true"
          :aria-label="p.etiqueta"
        >
          <q-icon v-if="rol.permisos.includes(p.clave)" name="sym_r_check" size="17px" />
        </span>
        <span class="permisos__texto">{{ p.etiqueta }}</span>
        <span v-if="p.administrativo" class="permisos__adm">ADM</span>
        <span class="permisos__clave">{{ p.clave }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';

import { agruparPermisos } from '../roles.logica';
import type { PermisoCatalogo, RolCondominio } from '../services/roles.service';

const props = defineProps<{ rol: RolCondominio; permisos: PermisoCatalogo[] }>();

const grupos = computed(() => agruparPermisos(props.permisos));
</script>

<style scoped>
.permisos {
  overflow-y: auto;
  border: 1px solid var(--safic-borde);
  border-radius: 12px;
}

.permisos__modulo {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 30px;
  flex-shrink: 0;
  background: color-mix(in srgb, var(--q-primary) 6%, #ffffff);
  border-top: 1px solid var(--safic-borde);
}

.permisos__modulo:first-child {
  border-top: none;
}

.permisos__modulo-nombre {
  flex-grow: 1;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.8px;
  color: var(--q-primary);
}

.permisos__fila {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 0 14px;
  height: 38px;
  border-top: 1px solid var(--safic-linea-2);
}

.permisos__caja {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  border: 1.5px solid var(--safic-borde-2);
  background: #ffffff;
  color: #ffffff;
}

.permisos__caja--marcada {
  border: 1px solid var(--q-primary);
  background: var(--q-primary);
}

.permisos__texto {
  flex-grow: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--safic-texto);
}

.permisos__adm {
  padding: 1px 6px;
  border-radius: 5px;
  background: #fff1dc;
  color: #8a3f0a;
  font-size: 9px;
  font-weight: 800;
}

.permisos__clave {
  font-size: 11px;
  color: #8a857a;
  font-family: ui-monospace, Menlo, monospace;
  width: 170px;
  flex-shrink: 0;
  text-align: right;
}

@media (max-width: 599px) {
  .permisos__clave {
    display: none;
  }
}
</style>
