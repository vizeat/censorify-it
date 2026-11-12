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
const strictLinkRe = /(^|[^\p{L}\p{N}@.-])((?:[a-z][a-z0-9+.-]*:\/\/|www\.)\S+|(?:[\p{L}\p{N}-]+\.)+\p{L}{2,}(?:\/\S*|[?#]\S+))/giu
const trailingPunctuationRe = /[.,;:!?)\]}'"»]+$/
// a run of digits and of the separators people put in a phone number
const strictPhoneRe = /(^|[^\w+])(\+?\(?\d[\d ().\u00a0-]*\d)(?!\w)/g
// 2026-11-20, 20.11.2026: the year tells a date from a phone number written with the same separators
const strictDateRe = /\b(?:(?:19|20)\d{2}[-.]\d{1,2}[-.]\d{1,2}|\d{1,2}[-.]\d{1,2}[-.](?:19|20)\d{2})\b/g

// Not seen: 8-digit national numbers written without "+" (they look like a date), numbers split with other
// separators or spelled out. Wrongly seen: a few 9+ digit runs that are not phone numbers (a reference,
// "150.00-200.00"). Widen or narrow it here if the refusals show the balance is wrong.
function isStrictPhoneNumber(candidate) {
  const digits = candidate.replace(/\D/g, '')
  if (candidate.startsWith('+') || digits.startsWith('00')) return digits.length >= 8 && digits.length <= 17
  if (digits.length < 9 || digits.length > 15) return false
  // "12 15 20 25 30" is a list of small numbers, "06 12 34 56 78" is a phone number
  return digits.startsWith('0') || candidate.split(/\D+/).some((group) => group.length >= 3)
}

function blank(text, regexp) {
  return text.replace(regexp, (found) => '|'.repeat(found.length))
}

function overlaps(a, b) {
  return a.index < b.lastIndex && b.index < a.lastIndex
}

function typeOf(schema) {
  if (schema === 'mailto:') return 'email'
  return /^[+(\d]$/.test(schema) ? 'phone' : 'link'
}

function CensorifyIt() {
  LinkifyIt.call(this)

  // Match international format with leading +
  this.add('+', {
    validate: function (text, pos, self) {
      const tail = text.slice(pos)

      if (!self.re.phone) {
        self.re.phone = new RegExp(phoneRe)
      }

      if (!self.re.date) {
        self.re.date = new RegExp(dateRe)
      }

      if (self.re.phone.test(tail) && !self.re.date.test(tail)) {
        return tail.match(self.re.phone)[0].length
      }

      return 0
    },
  })

  // Alias (123) 123 1234 to the previous rule
  this.add('(', '+')

  // Alias fuzzy phone numbers
  Array.from(Array(10).keys()).map((_, i) => this.add(i.toString(), '+'))

  this.replacementText = REPLACEMENT_TEXT
  this.exceptions = []
}

CensorifyIt.prototype = Object.create(LinkifyIt.prototype)

// `exceptions` is either a list, tried on every match, or lists by type of match: { link, phone, email }.
// Prefer the lists by type: a loose phone number pattern in a single list also lets through the links holding
// these digits.
CensorifyIt.prototype.set = function set({ exceptions = [], replacementText = REPLACEMENT_TEXT, ...options }) {
  LinkifyIt.prototype.set.call(this, options)
  this.exceptions = exceptions
  this.replacementText = replacementText
  return this
}

function Match(match, text) {
  this.schema = match.schema
  this.type = match.type
  this.index = match.index
  this.lastIndex = match.lastIndex
  this.raw = match.text
  this.url = match.url
  this.text = text.trim()
}

CensorifyIt.prototype.matchExceptions = function matchExceptions(match) {
  const exceptions = Array.isArray(this.exceptions) ? this.exceptions : this.exceptions[match.type] || []
  return exceptions.some((exception) => {
    if (exception instanceof Function) return exception(match)
    if (exception instanceof RegExp) return match.raw.match(exception)
    throw new Error(`Exception should either be a Function or a RegExp, got ${typeof exception}`)
  })
}

CensorifyIt.prototype.replace = function replace(length = 1) {
  if (this.replacementText.length === 1) {
    return this.replacementText.repeat(length)
  }
  return this.replacementText
}

// Links and phone numbers found by the strict detection, exceptions not applied yet
CensorifyIt.prototype.matchStrict = function matchStrict(text) {
  if (!text) return []

  const links = Array.from(text.matchAll(strictLinkRe), (found) => {
    const raw = found[2].replace(trailingPunctuationRe, '')
    const index = found.index + found[1].length
    return { schema: '', type: 'link', index, lastIndex: index + raw.length, text: raw, raw }
  }).map((link) => ({ ...link, url: /^[a-z][a-z0-9+.-]*:\/\//i.test(link.raw) ? link.raw : `http://${link.raw}` }))

  // the digits of a link (an event id) or of a date are not a phone number
  const withoutLinksAndDates = blank(blank(text, strictLinkRe), strictDateRe)
  const phones = Array.from(withoutLinksAndDates.matchAll(strictPhoneRe), (found) => {
    // "(06 12 34 56 78)" is found without its closing parenthesis: drop the opening one
    const unbalanced = found[2].startsWith('(') && !found[2].includes(')')
    const raw = unbalanced ? found[2].slice(1) : found[2]
    const index = found.index + found[1].length + (unbalanced ? 1 : 0)
    return { schema: '', type: 'phone', index, lastIndex: index + raw.length, text: raw, raw, url: raw }
  }).filter((phone) => isStrictPhoneNumber(phone.raw))

  return links.concat(phones).sort((a, b) => a.index - b.index)
}

CensorifyIt.prototype.match = function match(text) {
  if (!text) return []
  const loose = (LinkifyIt.prototype.match.call(this, text) || []).map((found) => ({
    ...found,
    type: typeOf(found.schema),
  }))
  // A strict link wins over the loose matches it overlaps: "evil.com?eatwith.com/x" is one link to evil.com,
  // not a link to eatwith.com. Everything `forbidden` reports is therefore censored as well.
  const strict = this.matchStrict(text).filter(
    (found) => found.type === 'link' || !loose.some((other) => overlaps(found, other)),
  )
  const matches = loose
    .filter((found) => !strict.some((other) => other.type === 'link' && overlaps(found, other)))
    .concat(strict)
    .sort((a, b) => a.index - b.index)

  return matches.map((found) => {
    const replacement = this.matchExceptions({ ...found, raw: found.text })
      ? found.url
      : this.replace(found.text.length)
    return new Match(found, replacement)
  })
}

CensorifyIt.prototype.process = function process(text) {
  return this.match(text).reduce((acc, match) => acc.replace(match.raw, match.text), text)
}

// The links and phone numbers a text should be refused for: found by the strict detection, and not allowed
// by an exception. Each one has a `type` ('link' or 'phone'), its `raw` text and its position.
CensorifyIt.prototype.forbidden = function forbidden(text) {
  return this.matchStrict(text)
    .filter((found) => !this.matchExceptions(found))
    .map((found) => new Match(found, found.raw))
}

export default CensorifyIt
