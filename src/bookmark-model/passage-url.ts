// A text fragment names a passage by its first and last few words; enough to
// tell passages apart without writing the whole selection into the address.
const EDGE_WORDS = 4
// Text with few or no spaces between words, such as Chinese, is cut by
// characters instead.
const EDGE_CHARS = 12
const MAX_EDGE_LENGTH = 48

// "-", "," and "&" mean something inside a text directive.
function encodeDirectivePart(text: string) {
  return encodeURIComponent(text).replace(/-/g, "%2D")
}

// FNV-1a: synchronous and short, which is all a tie-breaker needs.
function shortHash(text: string) {
  let hash = 0x811c9dc5
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i)
    hash = Math.imul(hash, 0x01000193)
  }
  return (hash >>> 0).toString(36)
}

function textDirective(words: string[]) {
  const flat = words.join(" ")
  if (words.length > EDGE_WORDS * 2) {
    const start = words.slice(0, EDGE_WORDS).join(" ")
    const end = words.slice(-EDGE_WORDS).join(" ")
    if (start.length <= MAX_EDGE_LENGTH && end.length <= MAX_EDGE_LENGTH) {
      return `${encodeDirectivePart(start)},${encodeDirectivePart(end)}`
    }
  } else if (
    flat.length <= (words.length === 1 ? EDGE_CHARS * 2 : MAX_EDGE_LENGTH * 2)
  ) {
    return encodeDirectivePart(flat)
  }
  // Array.from keeps emoji whole; half of one cannot be URI-encoded.
  const chars = Array.from(flat)
  return `${encodeDirectivePart(chars.slice(0, EDGE_CHARS).join(""))},${encodeDirectivePart(chars.slice(-EDGE_CHARS).join(""))}`
}

function passageWords(selectionText: string) {
  return selectionText.trim().split(/\s+/)
}

/**
 * A fragment that tells passages of one page apart, so saving another passage
 * — or the whole page — does not write over this one.
 */
export function passageId(selectionText: string) {
  return `p${shortHash(passageWords(selectionText).join(" "))}`
}

/**
 * The page's address pointing at this passage. Opening it scrolls to and
 * highlights the passage, and each passage gets an address of its own.
 */
export function passageUrl(selectionText: string, pageUrl: string) {
  const words = passageWords(selectionText)
  const url = new URL(pageUrl)
  url.hash = ""
  // Two passages can share their first and last words; the id keeps their
  // addresses apart. The browser looks for an element with that id, finds
  // none, and still follows the text directive.
  return `${url.href}#${passageId(selectionText)}:~:text=${textDirective(words)}`
}
