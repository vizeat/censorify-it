import LinkifyIt from 'linkify-it'
const REPLACEMENT_TEXT = '⏤⏤⏤⏤'
const phoneRegex = /(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4,5}/g

function CensorifyIt () {
  LinkifyIt.call(this)
  this.add('+', {
    validate: function (text, pos, self) {
      if (!self.re.phone) {
        self.re.phone = new RegExp(phoneRegex)
      }

      if (self.re.phone.test(text)) {
        return text.match(self.re.phone)[0].length
      }

      return 0
    },
  })
  this.add('(', '+')

  for (let i = 0; i < 10; i++) {
    this.add(i.toString(), '+')
  }

  this.replacementText = REPLACEMENT_TEXT
}

CensorifyIt.prototype = Object.create(LinkifyIt.prototype)

CensorifyIt.prototype.set = function set ({ exceptions = [], replacementText = REPLACEMENT_TEXT, ...options }) {
  LinkifyIt.prototype.set.call(this, options)
  this.exceptions = exceptions
  this.replacementText = replacementText
  return this
}

function Match (match, text) {
  this.schema = match.schema
  this.index = match.index
  this.lastIndex = match.lastIndex
  this.raw = match.text
  this.text = text.trim()
}

CensorifyIt.prototype.matchExceptions = function matchExceptions (text) {
  return this.exceptions.some((exception) => {
    if (exception instanceof Function) return exception(text)
    if (exception instanceof RegExp) return text.match(exception)
    throw new Error('Exception should either be a Function or a RegExp, got', typeof exception)
  })
}

CensorifyIt.prototype.match = function match (text) {
  if (!text) return []
  const matches = LinkifyIt.prototype.match.call(this, text)
  if (!matches) return []
  return matches.map((match, i) => {
    return this.matchExceptions(text) ? match : new Match(match, this.replacementText)
  })
}

export default CensorifyIt
