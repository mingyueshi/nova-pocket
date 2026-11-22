// request(method, path, body?) resolves to the decoded response, or rejects with a user-facing Error.
export function createHttpAdapters(request) {
  return {
    auth: {
      getSession: () => request('GET', '/session'),
      login: form => request('POST', '/session', form),
      logout: () => request('DELETE', '/session'),
      register: form => request('POST', '/accounts', form),
      recover: form => request('POST', '/password/reset', form),
      sendCode: form => request('POST', '/verification-codes', form),
      updateProfile: profile => request('PUT', '/profile', profile),
    },
    messages: {
      list: () => request('GET', '/messages'),
      markRead: ids => request('POST', '/messages/read', { ids }),
    },
  }
}
