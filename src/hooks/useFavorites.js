import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'whoopsie.favorites'
const MAX_FAVORITES = 100

function hashExcuse(text) {
  let h = 0
  for (let i = 0; i < text.length; i++) {
    h = ((h << 5) - h + text.charCodeAt(i)) | 0
  }
  return 'f_' + (h >>> 0).toString(36)
}

function read() {
  if (typeof window === 'undefined') return []
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function write(items) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
  } catch {}
}

export function useFavorites() {
  const [favorites, setFavorites] = useState(read)

  // Sync across tabs.
  useEffect(() => {
    function onStorage(e) {
      if (e.key === STORAGE_KEY) setFavorites(read())
    }
    window.addEventListener('storage', onStorage)
    return () => window.removeEventListener('storage', onStorage)
  }, [])

  const add = useCallback((excuse, meta = {}) => {
    const id = hashExcuse(excuse)
    setFavorites((prev) => {
      if (prev.some((f) => f.id === id)) return prev
      const next = [{ id, excuse, meta, at: Date.now() }, ...prev].slice(0, MAX_FAVORITES)
      write(next)
      return next
    })
  }, [])

  const remove = useCallback((id) => {
    setFavorites((prev) => {
      const next = prev.filter((f) => f.id !== id)
      write(next)
      return next
    })
  }, [])

  const toggle = useCallback(
    (excuse, meta = {}) => {
      const id = hashExcuse(excuse)
      setFavorites((prev) => {
        const exists = prev.some((f) => f.id === id)
        const next = exists
          ? prev.filter((f) => f.id !== id)
          : [{ id, excuse, meta, at: Date.now() }, ...prev].slice(0, MAX_FAVORITES)
        write(next)
        return next
      })
    },
    [],
  )

  const isFavorite = useCallback(
    (excuse) => {
      const id = hashExcuse(excuse)
      return favorites.some((f) => f.id === id)
    },
    [favorites],
  )

  return { favorites, add, remove, toggle, isFavorite }
}
