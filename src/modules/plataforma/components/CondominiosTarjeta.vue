<template>
  <article class="tarjeta">
    <div class="tarjeta__cabecera">
      <div
        class="tarjeta__avatar"
        :style="{ background: condominio.fondo, color: condominio.texto }"
        aria-hidden="true"
      >
        {{ condominio.iniciales }}
      </div>
      <div class="tarjeta__nombres">
        <div class="tarjeta__nombre">{{ condominio.nombre }}</div>
        <div class="tarjeta__ciudad">{{ condominio.ciudad }}</div>
      </div>
      <EstadoBadge :tono="TONO[condominio.estado]" :texto="condominio.estado" />
    </div>

    <div class="tarjeta__cifras">
      <div>
        <div class="tarjeta__valor">{{ condominio.unidades }}</div>
        <div class="tarjeta__etiqueta">Unidades</div>
      </div>
      <div>
        <div class="tarjeta__valor">{{ condominio.residentes }}</div>
        <div class="tarjeta__etiqueta">Residentes</div>
      </div>
      <div>
        <div class="tarjeta__valor">{{ condominio.admins }}</div>
        <div class="tarjeta__etiqueta">Admins</div>
      </div>
    </div>

    <div class="tarjeta__pie">
      <div class="tarjeta__plan">Plan {{ condominio.plan }}</div>
      <router-link :to="{ name: 'unidades' }" class="tarjeta__enlace">
        Entrar como admin
      </router-link>
    </div>
  </article>
</template>

<script setup lang="ts">
import EstadoBadge from '@/components/EstadoBadge.vue';
import type { TonoEstado } from '@/components/EstadoBadge.vue';
import type { CondominioPlataforma, EstadoCondominio } from '@/modules/plataforma/demo/condominios';

defineProps<{ condominio: CondominioPlataforma }>();

const TONO: Record<EstadoCondominio, TonoEstado> = {
  Activo: 'exito',
  Prueba: 'info',
  Suspendido: 'error',
};
</script>

<style scoped>
.tarjeta {
  background: #ffffff;
  border: 1px solid var(--safic-borde);
  border-radius: 16px;
  padding: 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
  min-width: 0;
}

.tarjeta__cabecera {
  display: flex;
  align-items: center;
  gap: 12px;
}

.tarjeta__avatar {
  width: 46px;
  height: 46px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  font-size: 15px;
  flex-shrink: 0;
}

.tarjeta__nombres {
  flex-grow: 1;
  min-width: 0;
}

.tarjeta__nombre {
  font-size: 16px;
  font-weight: 800;
}

.tarjeta__ciudad {
  font-size: 13px;
  color: var(--safic-texto-suave);
}

.tarjeta__cifras {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
  padding: 12px 0;
  border-top: 1px solid var(--safic-linea-2);
  border-bottom: 1px solid var(--safic-linea-2);
}

.tarjeta__valor {
  font-size: 20px;
  font-weight: 800;
}

.tarjeta__etiqueta {
  font-size: 12px;
  color: var(--safic-texto-suave);
}

.tarjeta__pie {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tarjeta__plan {
  font-size: 13px;
  color: var(--safic-texto-2);
  flex-grow: 1;
}

.tarjeta__enlace {
  font-size: 14px;
  font-weight: 700;
  text-decoration: none;
  padding: 10px 4px;
  color: var(--q-primary);
}

.tarjeta__enlace:hover {
  text-decoration: underline;
}
</style>
