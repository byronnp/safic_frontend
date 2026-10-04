import { onScopeDispose, ref, watch, type Ref } from 'vue';

/** Copia de `fuente` que se actualiza `ms` milisegundos después del último cambio. */
export function refDebounced<T>(fuente: Ref<T>, ms: number): Readonly<Ref<T>> {
  const valor = ref(fuente.value) as Ref<T>;
  let temporizador: ReturnType<typeof setTimeout> | undefined;

  watch(fuente, (nuevo) => {
    clearTimeout(temporizador);
    temporizador = setTimeout(() => {
      valor.value = nuevo;
    }, ms);
  });

  onScopeDispose(() => clearTimeout(temporizador));

  return valor;
}
