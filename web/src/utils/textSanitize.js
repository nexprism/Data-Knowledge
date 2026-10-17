// Lightweight display sanitization: fix common typos, normalize whitespace.
export function sanitizeDisplay(input) {
  if (!input && input !== '') return input
  let s = String(input)
  // don't touch URLs or image paths
  if (/^https?:\/\//i.test(s) || /^\//.test(s) || /\.(png|jpe?g|webp|gif|svg)(\?.*)?$/i.test(s)) return s

  s = s.trim()
  // common misspellings
  const corrections = {
    'soloprenuemner': 'solopreneur',
    'soloprenuer': 'solopreneur',
    'solopreuner': 'solopreneur',
    'soloprenur': 'solopreneur'
  }
  Object.keys(corrections).forEach(k => {
    const re = new RegExp(k, 'gi')
    s = s.replace(re, corrections[k])
  })

  // replace HTML entities &nbsp; &amp; etc.
  s = s.replace(/&nbsp;|\u00A0/g, ' ').replace(/&amp;/g, '&')
  // normalize punctuation/whitespace
  s = s.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim()

  // Title case ONLY for short headings / labels without punctuation
  if (s.length <= 60 && !s.includes('.') && !s.includes('\n')) {
    s = s.split(' ').map(word => word ? word.charAt(0).toUpperCase() + word.slice(1) : '').join(' ')
  }
  return s
}

export function sanitizeParagraph(input) {
  if (!input) return ''
  let s = String(input)
  // replace HTML entities
  s = s.replace(/&nbsp;|\u00A0/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
  // strip HTML tags if any
  s = s.replace(/<[^>]*>?/gm, '')
  return s.trim()
}

/**
 * Safely extracts paragraphs from EditorJS format, stringified JSON, or plain text
 * @param {any} content 
 * @returns {string[]} array of paragraph strings
 */
export function extractEditorBlocks(content) {
  if (!content) return []
  let data = content
  if (typeof data === 'string') {
    try {
      data = JSON.parse(data)
    } catch {
      const cleaned = sanitizeParagraph(data)
      return cleaned ? [cleaned] : []
    }
  }

  if (data && Array.isArray(data.blocks)) {
    return data.blocks
      .map(b => {
        if (!b) return ''
        if (typeof b.data?.text === 'string') return sanitizeParagraph(b.data.text)
        if (Array.isArray(b.data?.items)) return b.data.items.map(sanitizeParagraph).join(', ')
        return ''
      })
      .filter(t => Boolean(t && t.trim()))
  }

  if (typeof data === 'object') {
    if (typeof data.text === 'string') {
      const cl = sanitizeParagraph(data.text)
      return cl ? [cl] : []
    }
    // Check if blocks was stringified
    if (typeof data.blocks === 'string') {
      try {
        const parsed = JSON.parse(data.blocks)
        if (Array.isArray(parsed)) {
          return parsed.map(b => sanitizeParagraph(b.data?.text || b.text || '')).filter(Boolean)
        }
      } catch {
        const cl = sanitizeParagraph(data.blocks)
        return cl ? [cl] : []
      }
    }
  }

  return []
}

export default sanitizeDisplay

