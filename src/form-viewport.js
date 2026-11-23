// H5 keyboards can shrink the visual viewport after the browser has focused the input.
export function installFormViewport() {
  const viewport = window.visualViewport
  const visibleHeight = () => viewport?.height ?? window.innerHeight
  let previousHeight = visibleHeight()
  function onResize() {
    const height = visibleHeight()
    const shrank = height < previousHeight
    previousHeight = height
    const field = window.document.activeElement
    if (!shrank || (viewport && viewport.scale !== 1) || !field?.matches('.np-surface input, .np-surface textarea')) return
    window.requestAnimationFrame(() => {
      if (field !== window.document.activeElement) return
      const rect = field.getBoundingClientRect()
      const top = viewport?.offsetTop ?? 0
      if (rect.top < top || rect.bottom > top + visibleHeight()) {
        field.scrollIntoView({ block: 'center', inline: 'nearest' })
      }
    })
  }
  const target = viewport ?? window
  target.addEventListener('resize', onResize)
}
