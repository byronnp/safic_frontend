<template>
  <q-dialog ref="dialogRef" @hide="onDialogHide">
    <q-card class="safic-dialogo" style="width: 360px; max-width: 100%">
      <div class="q-pa-lg column items-center" style="gap: 14px">
        <div class="safic-dialogo__titulo">{{ visita.visitante }}</div>
        <QrToken :token="visita.token" />
        <div class="text-suave" style="font-size: 14px; text-align: center">
          {{ vigenciaVisita(visita) }}
        </div>
        <div class="text-suave" style="font-size: 12px; text-align: center">
          El QR no contiene datos personales.
        </div>
        <div class="row justify-center" style="gap: 10px">
          <q-btn
            unelevated
            no-caps
            class="safic-btn safic-btn--secundario"
            label="Cerrar"
            @click="onDialogCancel"
          />
          <q-btn
            unelevated
            no-caps
            color="primary"
            class="safic-btn"
            label="Compartir por WhatsApp"
            @click="compartir"
          />
        </div>
      </div>
    </q-card>
  </q-dialog>
</template>

<script setup lang="ts">
import { useDialogPluginComponent } from 'quasar';
import { watch } from 'vue';

import { useSessionStore } from '@/stores/session';

import type { VisitaAutorizada } from '../services/visitas.service';
import { mensajeParaVisitante, vigenciaVisita } from '../visitas.logica';
import QrToken from './QrToken.vue';

const props = defineProps<{ visita: VisitaAutorizada; condominio: string }>();
defineEmits([...useDialogPluginComponent.emits]);

const { dialogRef, onDialogHide, onDialogCancel } = useDialogPluginComponent();
const session = useSessionStore();

// Si cambia el condominio con el QR abierto, se cierra: ya no es de este condominio
watch(
  () => session.condominioId,
  () => onDialogCancel(),
);

async function compartir(): Promise<void> {
  const texto = mensajeParaVisitante(props.visita, props.condominio, window.location.origin);
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ text: texto });
    } catch {
      // La persona cerró el menú de compartir: no es un error
    }
    return;
  }
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, '_blank', 'noopener,noreferrer');
}
</script>
