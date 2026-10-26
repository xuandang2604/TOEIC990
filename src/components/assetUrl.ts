/** Keep stable /media references in content; apply the deployment path only when rendering. */
export function assetUrl(path: string) {
  if (!path.startsWith('/media/') && !path.startsWith('/icons/')) return path
  // Vite supplies the base in the app; Node static-rendering consumers have no Vite env.
  const base = import.meta.env ? import.meta.env.BASE_URL : '/'
  return `${base}${path.slice(1)}`
}
