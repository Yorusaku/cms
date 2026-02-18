import { ref, Ref } from 'vue'

export function useToggle(initialValue = false): [Ref<boolean>, () => void] {
  const state = ref(initialValue)
  const toggle = () => {
    state.value = !state.value
  }
  return [state, toggle]
}
