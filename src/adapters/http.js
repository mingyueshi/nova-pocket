/**
 * @param {(method: 'GET' | 'POST' | 'PUT' | 'DELETE', path: string, body?: unknown) => any} request
 *   Resolves to the decoded response, or rejects with a user-facing Error.
 * @param {{ paginatedMessages?: boolean }} [options]
 */
export function createHttpAdapters(request, { paginatedMessages = false } = {}) {
  /** @type {Required<import('#pocket/types').AuthAdapter>} */
  const auth = {
    getSession: () => request('GET', '/session'),
    login: form => request('POST', '/session', form),
    logout: () => request('DELETE', '/session'),
    register: form => request('POST', '/accounts', form),
    recover: form => request('POST', '/password/reset', form),
    sendCode: form => request('POST', '/verification-codes', form),
    updateProfile: profile => request('PUT', '/profile', profile),
  }
  /** @satisfies {import('#pocket/types').MessageAdapter} */
  const inbox = {
    list: () => request('GET', '/messages'),
    markRead: ids => request('POST', '/messages/read', { ids }),
  }
  if (!paginatedMessages) return { auth, messages: inbox }
  /** @satisfies {import('#pocket/types').MessageAdapter} */
  const messages = {
    ...inbox,
    listPage({ cursor, limit }) {
      const query = '?limit=' + limit + (cursor === null ? '' : '&cursor=' + encodeURIComponent(cursor))
      return request('GET', '/messages' + query)
    },
    get: id => request('GET', '/messages/' + encodeURIComponent(id)),
    markAllRead: () => request('POST', '/messages/read-all'),
  }
  return { auth, messages }
}
