import html2canvas from 'html2canvas'

export async function captureElementToBlob(el) {
  const canvas = await html2canvas(el, {
    backgroundColor: null,
    scale: 2,
    useCORS: true,
    logging: false,
  })
  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png', 1))
}

export async function shareCardImage({ blob, text, filename = 'whoopsie.png' }) {
  const file = new File([blob], filename, { type: 'image/png' })
  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], text, title: 'Whoopsie 🙃' })
      return { kind: 'shared' }
    } catch (err) {
      if (err?.name === 'AbortError') return { kind: 'aborted' }
      // fall through to download fallback
    }
  }
  return downloadBlob(blob, filename)
}

export function downloadBlob(blob, filename = 'whoopsie.png') {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  setTimeout(() => URL.revokeObjectURL(url), 1000)
  return { kind: 'downloaded' }
}

const APP_URL = 'https://whoopsie.app' // update to your live URL when deployed

export function buildShareIntent(target, text) {
  const url = encodeURIComponent(APP_URL)
  const t = encodeURIComponent(`${text}\n\nvia Whoopsie 🙃`)
  switch (target) {
    case 'twitter':
      return `https://twitter.com/intent/tweet?text=${t}&url=${url}`
    case 'telegram':
      return `https://t.me/share/url?url=${url}&text=${t}`
    case 'whatsapp':
      return `https://wa.me/?text=${t}%20${url}`
    default:
      return null
  }
}
