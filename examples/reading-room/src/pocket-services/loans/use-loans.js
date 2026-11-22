import { ref, watch } from 'vue'

export function useLoans(account, request, target, visible) {
  const result = ref({ status: 'idle' })
  const attempt = ref(0)
  const { session } = account

  watch([visible, () => target.value?.id, () => session.version, () => session.status,
    () => session.user?.id, attempt], async ([shown, id, version, status, reader], previous, onCleanup) => {
    if (!shown || id === undefined || status !== 'ready' || reader == null) {
      result.value = { status: 'idle' }
      return
    }
    let current = true
    onCleanup(() => { current = false })
    result.value = { status: 'loading' }
    try {
      const data = await request('GET', id ? '/loans/' + encodeURIComponent(id) : '/loans')
      if (!current || version !== session.version) return
      if (id ? data?.id !== id : !Array.isArray(data)) throw new Error('书房返回的借阅数据格式错误')
      result.value = id ? { status: 'ready', book: data } : { status: 'ready', items: data }
    } catch (error) {
      if (!current || version !== session.version || account.handleSessionError(error, version)) return
      result.value = id && error.statusCode === 404
        ? { status: 'unavailable' }
        : { status: 'error', error: error.message || '请检查网络后重试' }
    }
  }, { immediate: true })

  return { result, retry: () => { attempt.value++ } }
}
