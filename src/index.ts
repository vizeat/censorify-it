import LinkifyIt from 'linkify-it'

const REPLACEMENT_TEXT = '*'

// Strictly match dates, adapted to the usage of censorify:
// match everything but the schema, so we need to remove the leading digit in the regex
// This catches:
// 2019-01-01
// 01-01-2019
// 01-19
// 01/01/2019
// 01/01
const dateRe = /^((\d{3}[-/]\d{2}[-/]\d{2})|(\d{1}[-/]\d{2}[-/]\d{4})|(\d{0,1}[-/]\d{2}))/
// Lazily match phone numbers
// This is a very permissive regex to match as many phone number as possible
// If you find false positive open a new issue
const phoneRe = /^[0-9\-(). +]{6,}[0-9)]{1}\b/

// --- Strict detection ---
// The detection above is made to censor: a false positive only costs a few stars. The one below is made to
// refuse a text, so it only keeps what is a link or a phone number beyond doubt, and leans towards letting
// something through. No lookbehind here: the leading boundary is captured, old Safari does not parse them.

// scheme://, www., domain/path or domain?query. A bare domain ("see you soon.In any case") is left to the
// detection above: refusing it would reject honest texts with a missing space after a period.
const strictLinkRe =
  /(^|[^\p{L}\p{N}@.-])((?:[a-z][a-z0-9+.-]*:\/\/|www\.)\S+|(?:[\p{L}\p{N}-]+\.)+\p{L}{2,}(?:\/\S*|[?#]\S+))/giu
const trailingPunctuationRe = /[.,;:!?)\]}'"»]+$/
// a run of digits and of the separators people put in a phone number
const strictPhoneRe = /(^|[^\w+])(\+?\(?\d[\d ().\u00a0-]*\d)(?!\w)/g
// 2026-11-20, 20.11.2026: the year tells a date from a phone number written with the same separators
const strictDateRe = /\b(?:(?:19|20)\d{2}[-.]\d{1,2}[-.]\d{1,2}|\d{1,2}[-.]\d{1,2}[-.](?:19|20)\d{2})\b/g

export type MatchType = 'link' | 'email' | 'phone'

/** What a detection finds in a text, before exceptions are applied */
export interface Found {
  schema: string
  type: MatchType
  index: number
  lastIndex: number
  raw: string
  text: string
  url: string
}

/** A regex is tried against the raw text of what was found, a function gets the whole of it */
export type Exception = RegExp | ((found: Found) => unknown)

/**
 * Either a list, tried on every match, or lists by type of match. Prefer the lists by type: a loose phone number
 * pattern in a single list also lets through the links holding these digits.
 */
export type Exceptions = Exception[] | Partial<Record<MatchType, Exception[]>>

export interface Options extends LinkifyIt.Options {
  exceptions?: Exceptions
  replacementText?: string
}

export class Match implements LinkifyIt.Match {
  schema: string
  type: MatchType
  index: number
  lastIndex: number
  /** The text as it was found */
  raw: string
  url: string
  /** What `process` puts in place of the raw text: stars, or the url of an exception */
  text: string

  constructor(found: Found, text: string) {
    this.schema = found.schema
    this.type = found.type
    this.index = found.index
    this.lastIndex = found.lastIndex
    this.raw = found.text
    this.url = found.url
    this.text = text.trim()
  }
}

// Not seen: 8-digit national numbers written without "+" (they look like a date), numbers split with other
// separators or spelled out. Wrongly seen: a few 9+ digit runs that are not phone numbers (a reference,
// "150.00-200.00"). Widen or narrow it here if the refusals show the balance is wrong.
function isStrictPhoneNumber(candidate: string): boolean {
  const digits = candidate.replace(/\D/g, '')
  if (candidate.startsWith('+') || digits.startsWith('00')) return digits.length >= 8 && digits.length <= 17
  if (digits.length < 9 || digits.length > 15) return false
  // "12 15 20 25 30" is a list of small numbers, "06 12 34 56 78" is a phone number
  return digits.startsWith('0') || candidate.split(/\D+/).some((group) => group.length >= 3)
}

function blank(text: string, regexp: RegExp): string {
  return text.replace(regexp, (found) => '|'.repeat(found.length))
}

function overlaps(a: Found, b: Found): boolean {
  return a.index < b.lastIndex && b.index < a.lastIndex
}

function typeOf(schema: string): MatchType {
  if (schema === 'mailto:') return 'email'
  return /^[+(\d]$/.test(schema) ? 'phone' : 'link'
}

export class CensorifyIt extends LinkifyIt {
  exceptions: Exceptions = []
  replacementText = REPLACEMENT_TEXT

  constructor() {
    super()

    // Match international format with leading +
    this.add('+', {
      validate: (text: string, pos: number) => {
        const tail = text.slice(pos)
        const phone = phoneRe.test(tail) && !dateRe.test(tail) ? tail.match(phoneRe) : null
        return phone ? phone[0].length : 0
      },
    })

    // Alias (123) 123 1234 to the previous rule
    this.add('(', '+')

    // Alias fuzzy phone numbers
    for (let digit = 0; digit < 10; digit++) this.add(digit.toString(), '+')
  }

  set({ exceptions = [], replacementText = REPLACEMENT_TEXT, ...options }: Options = {}): this {
    super.set(options)
    this.exceptions = exceptions
    this.replacementText = replacementText
    return this
  }

  matchExceptions(found: Found): boolean {
    const exceptions = Array.isArray(this.exceptions) ? this.exceptions : this.exceptions[found.type] || []
    return exceptions.some((exception) => {
      if (exception instanceof Function) return Boolean(exception(found))
      if (exception instanceof RegExp) return found.raw.match(exception) !== null
      throw new Error(`Exception should either be a Function or a RegExp, got ${typeof exception}`)
    })
  }

  replace(length = 1): string {
    return this.replacementText.length === 1 ? this.replacementText.repeat(length) : this.replacementText
  }

  /** Links and phone numbers found by the strict detection, exceptions not applied yet */
  matchStrict(text?: string | null): Found[] {
    if (!text) return []

    const links = Array.from(text.matchAll(strictLinkRe), (found): Found => {
      const raw = found[2].replace(trailingPunctuationRe, '')
      const index = found.index + found[1].length
      const url = /^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `http://${raw}`
      return { schema: '', type: 'link', index, lastIndex: index + raw.length, raw, text: raw, url }
    })

    // the digits of a link (an event id) or of a date are not a phone number
    const withoutLinksAndDates = blank(blank(text, strictLinkRe), strictDateRe)
    const phones = Array.from(withoutLinksAndDates.matchAll(strictPhoneRe), (found): Found => {
      // "(06 12 34 56 78)" is found without its closing parenthesis: drop the opening one
      const unbalanced = found[2].startsWith('(') && !found[2].includes(')')
      const raw = unbalanced ? found[2].slice(1) : found[2]
      const index = found.index + found[1].length + (unbalanced ? 1 : 0)
      return { schema: '', type: 'phone', index, lastIndex: index + raw.length, raw, text: raw, url: raw }
    }).filter((phone) => isStrictPhoneNumber(phone.raw))

    return links.concat(phones).sort((a, b) => a.index - b.index)
  }

  /** Everything to censor in a text: links, emails and phone numbers, with what `process` replaces them by */
  match(text?: string | null): Match[] {
    if (!text) return []

    const loose: Found[] = (super.match(text) || []).map((found) => ({ ...found, type: typeOf(found.schema) }))
    // A strict link wins over the loose matches it overlaps: "evil.com?mysite.com/x" is one link to evil.com,
    // not a link to mysite.com. Everything `forbidden` reports is therefore censored as well.
    const strict = this.matchStrict(text).filter(
      (found) => found.type === 'link' || !loose.some((other) => overlaps(found, other)),
    )

    return loose
      .filter((found) => !strict.some((other) => other.type === 'link' && overlaps(found, other)))
      .concat(strict)
      .sort((a, b) => a.index - b.index)
      .map((found) => {
        const allowed = this.matchExceptions({ ...found, raw: found.text })
        return new Match(found, allowed ? found.url : this.replace(found.text.length))
      })
  }

  /** The text with everything `match` finds replaced */
  process(text: string): string {
    return this.match(text).reduce((acc, match) => acc.replace(match.raw, match.text), text)
  }

  /**
   * The links and phone numbers a text should be refused for: found by the strict detection, and not allowed by
   * an exception
   */
  forbidden(text?: string | null): Match[] {
    return this.matchStrict(text)
      .filter((found) => !this.matchExceptions(found))
      .map((found) => new Match(found, found.raw))
  }
}

export default CensorifyIt
