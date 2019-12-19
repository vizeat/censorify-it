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

function CensorifyIt() {
  LinkifyIt.call(this)

  // Match international format with leading +
  this.add('+', {
    validate: function(text, pos, self) {
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

CensorifyIt.prototype.set = function set({ exceptions = [], replacementText = REPLACEMENT_TEXT, ...options }) {
  LinkifyIt.prototype.set.call(this, options)
  this.exceptions = exceptions
  this.replacementText = replacementText
  return this
}

function Match(match, text) {
  this.schema = match.schema
  this.index = match.index
  this.lastIndex = match.lastIndex
  this.raw = match.text
  this.url = match.url
  this.text = text.trim()
}

CensorifyIt.prototype.matchExceptions = function matchExceptions(match) {
  return this.exceptions.some((exception) => {
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

CensorifyIt.prototype.match = function match(text) {
  if (!text) return []
  const matches = LinkifyIt.prototype.match.call(this, text)
  if (!matches) return []
  return matches.map((match, i) => {
    const replacement = this.matchExceptions(match) ? match.url : this.replace(match.raw.length)
    return new Match(match, replacement)
  })
}

CensorifyIt.prototype.process = function process(text) {
  return this.match(text).reduce((acc, match) => acc.replace(match.raw, match.text), text)
}

export default CensorifyIt
