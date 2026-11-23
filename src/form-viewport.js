const installed = new WeakMap()

// H5 keyboards can shrink the visual viewport after the browser has focused the input.
export function installFormViewport(browser = window) {
  const existing = installed.get(browser)
  if (existing) return existing

  const viewport = browser.visualViewport
  const target = viewport ?? browser
  const visibleHeight = () => viewport?.height ?? browser.innerHeight
  let active = true
  let previousHeight = visibleHeight()
  function onResize() {
    const height = visibleHeight()
    const shrank = height < previousHeight
    previousHeight = height
    const field = browser.document.activeElement
    if (!shrank || (viewport && viewport.scale !== 1) || !field?.matches('.np-surface input, .np-surface textarea')) return
    browser.requestAnimationFrame(() => {
      if (!active || field !== browser.document.activeElement) return
      const rect = field.getBoundingClientRect()
      const top = viewport?.offsetTop ?? 0
      if (rect.top < top || rect.bottom > top + visibleHeight()) {
        field.scrollIntoView({ block: 'center', inline: 'nearest' })
      }
    })
  }
  function dispose() {
    if (!active) return
    active = false
    target.removeEventListener('resize', onResize)
    installed.delete(browser)
  }

  target.addEventListener('resize', onResize)
  installed.set(browser, dispose)
  return dispose
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => installed.get(window)?.())
}
