import CensorifyIt from './index'
const censor = new CensorifyIt()

it('Does find a website url', () => {
  const matches = censor.match('Hello, here is https://alink.to/a-website can you find it?')
  expect(matches.length).toBe(1)
  expect(matches[0].url).toBe('https://alink.to/a-website')
})

it('Does process a text', () => {
  const textWithCensorableContent = 'Hello, here is https://alink.to/a-website can you find it?'
  const textWithoutCensorableContent = 'Hello, this is a perfectly fine text.'

  expect(censor.process(textWithCensorableContent)).toBe('Hello, here is ************************** can you find it?')
  expect(censor.process(textWithoutCensorableContent)).toBe(textWithoutCensorableContent)
})

it('Does find phone numbers of various format and do not touch dates', () => {
  const text = `
    Here is a date 2019-12-02
    Here is a fuzzy EU formatted phone number 01 23 45 67 89

    US:
      Local 754-3010
      Domestic (541) 754-3010
      International +1-541-754-3010
      Dialed in the US 1-541-754-3010
      Dialed from Germany 001-541-754-3010
      Dialed from France +1 541 754 3010
    DE:
      Local 636-48018
      Domestic (089) / 636-48018
      International +49-89-636-48018
      Dialed from France +49-89-636-48018
    FR:
      +33 1 23 45 67 89
      +33 123 456 789
      +33123456789
      +331 23 45 67 89
      0123456789
      01 23 45 67 89
      01 234 567 89

    Here is a short date 11/11
    Here is another one 05-12
    Here is a full date 01/02/1999
    Here is another one 01-02-1999
    Here is a last one 02-1999
    Here is a 4 digit code 1234
  `

  const censoredText = `
    Here is a date 2019-12-02
    Here is a fuzzy EU formatted phone number **************

    US:
      Local ********
      Domestic **************
      International +1-************
      Dialed in the US 1-************
      Dialed from Germany ****************
      Dialed from France ***************
    DE:
      Local *********
      Domestic (089) / *********
      International ****************
      Dialed from France ****************
    FR:
      *****************
      ***************
      ************
      ****************
      **********
      **************
      *************

    Here is a short date 11/11
    Here is another one 05-12
    Here is a full date 01/02/1999
    Here is another one 01-02-1999
    Here is a last one 02-1999
    Here is a 4 digit code 1234
  `

  const processed = censor.process(text)
  expect(processed).toBe(censoredText)
})

it('Does allow exceptions', () => {
  function matchHostnameFactory (hostname) {
    const regexp = new RegExp(hostname, 'i')
    return function matchHostname (match) {
      try {
        const url = new URL(match.url)
        return regexp.test(url.hostname)
      } catch (e) {
        return false
      }
    }
  }

  censor.set({
    exceptions: [matchHostnameFactory('google.com'), matchHostnameFactory('facebook.com')],
  })

  const text = `
    Here is a link that will match https://example.com
    Here is a link that will be ignored https://www.google.com/abcd
    Here is a link that witll be enriched developers.facebook.com/hello
  `

  const censoredText = `
    Here is a link that will match *******************
    Here is a link that will be ignored https://www.google.com/abcd
    Here is a link that witll be enriched http://developers.facebook.com/hello
  `

  const processed = censor.process(text)
  expect(processed).toBe(censoredText)
})
