<template>
  <!-- Permisos del rol agrupados por módulo, solo lectura (mockup F1RolesCondominio) -->
  <div class="permisos">
    <template v-for="grupo in grupos" :key="grupo.modulo">
      <div class="permisos__modulo">
        <span class="permisos__modulo-nombre">{{ grupo.modulo.toUpperCase() }}</span>
        <span v-if="!grupo.enPlan" class="permisos__plan">Requiere plan Completo</span>
      </div>
      <div v-for="p in grupo.permisos" :key="p.clave" class="permisos__fila">
        <span
          class="permisos__caja"
          :class="{
            'permisos__caja--fuera': !grupo.enPlan,
            'permisos__caja--marcada': grupo.enPlan && rol.permisos.includes(p.clave),
          }"
          role="checkbox"
          :aria-checked="grupo.enPlan && rol.permisos.includes(p.clave)"
          aria-readonly="true"
          :aria-disabled="!grupo.enPlan"
          :aria-label="p.texto"
        >
          <q-icon v-if="!grupo.enPlan" name="sym_r_lock" size="15px" />
          <q-icon v-else-if="rol.permisos.includes(p.clave)" name="sym_r_check" size="17px" />
        </span>
        <span class="permisos__texto" :class="{ 'permisos__texto--fuera': !grupo.enPlan }">
          {{ p.texto }}
        </span>
        <span v-if="p.administrativo" class="permisos__adm">ADM</span>
        <span class="permisos__clave">{{ p.clave }}</span>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { MODULOS_DEL_PLAN, PERMISOS, type PermisoDemo, type RolDemo } from '../demo/roles';

defineProps<{ rol: RolDemo }>();

const grupos = PERMISOS.reduce<{ modulo: string; enPlan: boolean; permisos: PermisoDemo[] }[]>(
  (lista, p) => {
    const ultimo = lista[lista.length - 1];
    if (ultimo && ultimo.modulo === p.modulo) {
      ultimo.permisos.push(p);
    } else {
      lista.push({ modulo: p.modulo, enPlan: MODULOS_DEL_PLAN.includes(p.modulo), permisos: [p] });
    }
    return lista;
  },
  [],
);
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

.permisos__plan {
  display: inline-flex;
  padding: 2px 8px;
  border-radius: 999px;
  background: #f1efe8;
  color: var(--safic-texto-tenue);
  font-size: 11px;
  font-weight: 700;
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

.permisos__caja--fuera {
  border: 1px dashed var(--safic-borde-2);
  background: var(--safic-fondo-2);
  color: #b9b3a5;
}

.permisos__texto {
  flex-grow: 1;
  min-width: 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--safic-texto);
}

.permisos__texto--fuera {
  color: #a7a195;
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
