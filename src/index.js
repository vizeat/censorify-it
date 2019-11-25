import LinkifyIt from 'linkify-it'
const REPLACEMENT_TEXT = '⏤⏤⏤⏤'
const telRegex = /(\+\d{1,2}\s)?\(?\d{3}\)?[\s.-]?\d{3}[\s.-]?\d{4,5}/g

function CensorifyIt () {
  LinkifyIt.call(this)
  this.add('+', {
    validate: function (text, pos, self) {
      if (!self.re.phone) {
        self.re.phone = new RegExp(telRegex)
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

CensorifyIt.prototype.set = function set ({ exception, replacementText = REPLACEMENT_TEXT, ...options }) {
  LinkifyIt.prototype.set.call(this, options)
  this.exception = exception
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

CensorifyIt.prototype.match = function match (text) {
  if (!text) return []
  const matches = LinkifyIt.prototype.match.call(this, text)
  if (!matches) return []
  return matches.map((match, i) => {
    if (this.exception && match.text.match(this.exception)) {
      return match
    }

    return new Match(match, this.replacementText)
  })
}

export default CensorifyIt
