// The sample API returns { user, token } on login/registration. Pages expect just the user.
export function createRequest(baseUrl) {
  const api = baseUrl.replace(/\/+$/, '')
  const storageKey = 'reading-room:session:' + api
  return async function request(method, path, data) {
    const token = uni.getStorageSync(storageKey)
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: api + path, method, data, timeout: 10000,
        header: token ? { Authorization: 'Bearer ' + token } : {},
        success: resolve,
        fail: () => reject(new Error('无法连接书房服务，请检查网络后重试')),
      })
    })
    const signIn = method === 'POST' && (path === '/session' || path === '/accounts')
    const { statusCode, data: body } = response
    function clearSentToken() {
      if (token && uni.getStorageSync(storageKey) === token) uni.removeStorageSync(storageKey)
    }
    if (statusCode < 200 || statusCode >= 300) {
      if (!signIn && statusCode === 401) clearSentToken()
      throw Object.assign(new Error(body?.message || '书房服务请求失败'), { statusCode })
    }
    if (signIn) {
      if (!body?.token || !body.user?.id) throw new Error('登录响应缺少用户或会话凭据')
      uni.setStorageSync(storageKey, body.token)
      return body.user
    }
    if (method === 'DELETE' && path === '/session') clearSentToken()
    return body
  }
}
