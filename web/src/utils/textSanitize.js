/**
 * Safe text extractor: recursively extracts human-readable string content
 * from strings, numbers, arrays, EditorJS list objects ({ content, items }),
 * block objects, and generic form objects ({ text, title, name, etc. }).
 * Guarantees that "[object Object]" is NEVER returned.
 */
export function safeExtractText(input) {
  if (input === null || input === undefined) return ''
  if (typeof input === 'string') return input
  if (typeof input === 'number' || typeof input === 'boolean') return String(input)

  if (Array.isArray(input)) {
    return input.map(safeExtractText).filter(Boolean).join(', ')
  }

  if (typeof input === 'object') {
    // If it's an EditorJS root object with blocks
    if (Array.isArray(input.blocks)) {
      return input.blocks
        .map(b => {
          if (!b) return ''
          if (typeof b.data?.text === 'string') return b.data.text
          if (Array.isArray(b.data?.items)) {
            return b.data.items.map(safeExtractText).filter(Boolean).join(', ')
          }
          return safeExtractText(b.data)
        })
        .filter(Boolean)
        .join(' ')
    }

    // Modern EditorJS list item: { content: "...", items: [...] }
    if (input.content !== undefined && input.content !== null) {
      const main = safeExtractText(input.content)
      const nested = Array.isArray(input.items) && input.items.length > 0
        ? ' ' + input.items.map(safeExtractText).filter(Boolean).join(', ')
        : ''
      return (main + nested).trim()
    }

    if (input.text !== undefined && input.text !== null) return safeExtractText(input.text)
    if (input.title !== undefined && input.title !== null) return safeExtractText(input.title)
    if (input.name !== undefined && input.name !== null) return safeExtractText(input.name)
    if (input.label !== undefined && input.label !== null) return safeExtractText(input.label)
    if (input.value !== undefined && input.value !== null) return safeExtractText(input.value)
    if (input.description !== undefined && input.description !== null) return safeExtractText(input.description)
    if (input.message !== undefined && input.message !== null) return safeExtractText(input.message)

    // Fallback: check if there are any string values on the object
    const stringVals = Object.values(input).filter(v => typeof v === 'string' && v.trim().length > 0)
    if (stringVals.length > 0) {
      return stringVals.join(' ')
    }
    return ''
  }

  return ''
}

// Lightweight display sanitization: fix common typos, normalize whitespace.
export function sanitizeDisplay(input) {
  if (input === null || input === undefined) return ''
  let s = safeExtractText(input)
  if (!s && s !== '') return ''

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
  if (input === null || input === undefined) return ''
  let s = safeExtractText(input)
  if (!s) return ''
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
      .flatMap(b => {
        if (!b) return []
        if (typeof b.data?.text === 'string') {
          const text = sanitizeParagraph(b.data.text)
          return text ? [text] : []
        }
        if (b.type === 'list' || Array.isArray(b.data?.items)) {
          const items = Array.isArray(b.data?.items) ? b.data.items : []
          const isOrdered = b.data?.style === 'ordered'
          
          const processList = (listItems, prefix = '') => {
            const out = []
            listItems.forEach((it, idx) => {
              const raw = typeof it === 'object' && it !== null ? (it.content ?? it.text ?? it) : it
              const text = sanitizeParagraph(raw)
              if (text) {
                const marker = isOrdered ? `${prefix}${idx + 1}. ` : `${prefix}• `
                out.push(`${marker}${text}`)
              }
              if (it && typeof it === 'object' && Array.isArray(it.items) && it.items.length > 0) {
                out.push(...processList(it.items, prefix + '   '))
              }
            })
            return out
          }

          return processList(items)
        }
        if (b.type === 'quote' && b.data?.text) {
          const quote = sanitizeParagraph(b.data.text)
          const caption = sanitizeParagraph(b.data.caption)
          return [caption ? `"${quote}" — ${caption}` : `"${quote}"`]
        }
        if (b.type === 'checklist' && Array.isArray(b.data?.items)) {
          return b.data.items
            .map(it => {
              const text = sanitizeParagraph(it.text || it.content || it)
              return text ? `${it.checked ? '✓' : '◻'} ${text}` : ''
            })
            .filter(Boolean)
        }
        return []
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

/**
 * Universal safe price formatter that handles MongoDB Decimal128, nested objects,
 * strings, numbers, and null/undefined without ever crashing or rendering [object Object].
 */
export function getDisplayPrice(val, fallback = '0') {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'object') {
    if (val.$numberDecimal) return String(val.$numberDecimal);
    if (val.value !== undefined) return String(val.value);
    return fallback;
  }
  return String(val);
}

/**
 * Universal safe number parser for price calculations.
 */
export function parseNumberPrice(val, fallback = 0) {
  if (val === null || val === undefined || val === '') return fallback;
  if (typeof val === 'object' && val.$numberDecimal) {
    const num = Number(val.$numberDecimal);
    return isNaN(num) ? fallback : num;
  }
  const num = Number(val);
  return isNaN(num) ? fallback : num;
}

export default sanitizeDisplay


