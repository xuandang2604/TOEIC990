/** The caller owns success/error presentation. This starts a download, not proof the user saved it. */
export function downloadJson(json: string, name = 'study990') {
  const url = URL.createObjectURL(new Blob([json], { type: 'application/json' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${name}-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  window.setTimeout(() => URL.revokeObjectURL(url), 1000)
}
