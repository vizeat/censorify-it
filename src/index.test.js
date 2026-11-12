import CensorifyIt from './index'
let censor = new CensorifyIt()

beforeEach(() => {
  // clear up censorify's configuration for each test
  censor = new CensorifyIt()
})

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
    Here is a phone number +33123456789 with text around

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
    Here is a phone number ************ with text around

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
  function matchHostnameFactory(hostname) {
    const regexp = new RegExp(hostname, 'i')
    return function matchHostname(match) {
      try {
        const url = new URL(match.url)
        return regexp.test(url.hostname)
      } catch (e) {
        return false
      }
    }
  }

  censor.set({
    exceptions: [matchHostnameFactory('google.com'), matchHostnameFactory('facebook.com'), /eatwith.com/i],
  })

  const text = `
    Here is a link that will match https://example.com
    Here is a link that will be ignored https://www.google.com/abcd
    Here is a link that witll be enriched developers.facebook.com/hello
    Here is a link will be matched by regex https://www.eatwith.com
  `

  const censoredText = `
    Here is a link that will match *******************
    Here is a link that will be ignored https://www.google.com/abcd
    Here is a link that witll be enriched http://developers.facebook.com/hello
    Here is a link will be matched by regex https://www.eatwith.com
  `

  const processed = censor.process(text)
  expect(processed).toBe(censoredText)
})

it("Does error if an exceptions isn't of a supported type", () => {
  censor.set({ exceptions: ['This String is not a function nor a regex'] })
  const text = 'Here is a link https://example.com'
  expect(() => censor.process(text)).toThrow(new Error('Exception should either be a Function or a RegExp, got string'))
})

it('Does use an alternative replacement text when provided', () => {
  // Multi char replacement text is not repeated
  censor.set({ replacementText: 'REMOVED' })
  const text = 'Here is a link https://example.com'
  const censoredText = 'Here is a link REMOVED'
  const processed = censor.process(text)
  expect(processed).toBe(censoredText)

  // Single char replacement text is repeated to match the length of the censored text
  censor.set({ replacementText: '-' })
  const censoredText2 = 'Here is a link -------------------'
  const processed2 = censor.process(text)
  expect(processed2).toBe(censoredText2)
})

describe('types of matches', () => {
  it('Does tell links, emails and phone numbers apart', () => {
    const matches = censor.match('https://alink.to/x or john.doe@gmail.com or 01 23 45 67 89')
    expect(matches.map(({ type, raw }) => [type, raw])).toEqual([
      ['link', 'https://alink.to/x'],
      ['email', 'john.doe@gmail.com'],
      ['phone', '01 23 45 67 89'],
    ])
  })

  it('Does apply exceptions by type of match', () => {
    const supportPhone = /33.?1.?23.?45.?67.?89/
    const text = 'Call +33 1 23 45 67 89 or go to https://evil.com/33123456789 or https://www.eatwith.com/x'

    // a single list: the loose phone pattern also lets the link through
    censor.set({ exceptions: [/^https:\/\/www\.eatwith\.com/, supportPhone] })
    expect(censor.process(text)).toBe(
      'Call +33 1 23 45 67 89 or go to https://evil.com/33123456789 or https://www.eatwith.com/x',
    )

    censor.set({ exceptions: { link: [/^https:\/\/www\.eatwith\.com/], phone: [supportPhone] } })
    expect(censor.process(text)).toBe(
      'Call +33 1 23 45 67 89 or go to **************************** or https://www.eatwith.com/x',
    )
  })
})

describe('strict detection', () => {
  const ours = {
    link: [/^(?:https?:\/\/)?(?:[\w-]+\.)*eatwith\.com(?=[/?#]|$)/i],
    phone: [/\+?(33.?1.?2.?3.?4.?5.?6.?7.?8.?9|\(?844\)?.?5.?5.?5.?0.?1.?0.?0)/],
  }

  beforeEach(() => {
    censor.set({ exceptions: ours })
  })

  const forbidden = (text) => censor.forbidden(text).map(({ type, raw }) => [type, raw])

  it.each([
    ['Please verify your account: https://evil.cfd/a/x1y2z3', 'https://evil.cfd/a/x1y2z3'],
    ['evil.cfd/a/x1y2z3', 'evil.cfd/a/x1y2z3'],
    ['go to www.evil.cfd now', 'www.evil.cfd'],
    ['see (https://evil.cfd/a/x).', 'https://evil.cfd/a/x'],
    ['https://evil.cfd/eatwith.com/a/x', 'https://evil.cfd/eatwith.com/a/x'],
    ['https://secure-eatwith.com/verify', 'https://secure-eatwith.com/verify'],
    ['https://eatwith.com.evil.cfd/', 'https://eatwith.com.evil.cfd/'],
    ['https://eatwith.com@evil.cfd/', 'https://eatwith.com@evil.cfd/'],
    ['evil.cfd?eatwith.com/verify', 'evil.cfd?eatwith.com/verify'],
    ['https://evil.cfd/33123456789', 'https://evil.cfd/33123456789'],
    ['write me on t.me/some_support', 't.me/some_support'],
    ['tg://resolve?domain=some_support', 'tg://resolve?domain=some_support'],
  ])('Does forbid the link of "%s"', (text, link) => {
    expect(forbidden(text)).toEqual([['link', link]])
  })

  it.each([
    ['call me on +33 6 12 34 56 78', '+33 6 12 34 56 78'],
    ['my number: 06 12 34 56 78.', '06 12 34 56 78'],
    ['06.12.34.56.78', '06.12.34.56.78'],
    ['0612345678', '0612345678'],
    ['0 6 1 2 3 4 5 6 7 8', '0 6 1 2 3 4 5 6 7 8'],
    ['whatsapp 0033612345678 please', '0033612345678'],
    ['US cell (555) 123-4567', '(555) 123-4567'],
    ['UK 07911 123456', '07911 123456'],
    ['Italy 333 1234567', '333 1234567'],
    ['Denmark +45 12 34 56 78', '+45 12 34 56 78'],
    ['(06 12 34 56 78)', '06 12 34 56 78'],
    ['Hello!\nMy phone is +447911123456\nThanks', '+447911123456'],
  ])('Does forbid the phone number of "%s"', (text, phone) => {
    expect(forbidden(text)).toEqual([['phone', phone]])
  })

  it.each([
    'Hello, we are 4 people and would love to join on 12/11 or 13/11 around 7.30pm!',
    'See you soon.In any case, thank you.My email is john.doe1234567890@gmail.com',
    'Is lunch/dinner possible? Budget is 25.50€/person, a.m./p.m. both work.',
    'We are 12 adults and 3 kids, aged 5 7 9, budget 1500-2000 euros',
    'Could we come on 2026-11-20 or 2026-11-21? Or from 2026-11-20 - 2026-11-22',
    'On 20.11.2026 at 19.30, or on 21-11-2026 at 20.00',
    'Our group: 12 15 20 25 30 people over five dates',
    'I saw your event https://www.eatwith.com/events/123456789?date=2026-12-01.',
    'I saw it on eatwith.com, (www.eatwith.com) and booking reference #4954127',
    'You can call us on +33 1 23 45 67 89 or (844) 555-0100',
    '',
    null,
    undefined,
  ])('Does not forbid anything in "%s"', (text) => {
    expect(forbidden(text)).toEqual([])
  })

  it('Does give the position of what it forbids', () => {
    const text = 'Go to www.evil.com or call 06 12 34 56 78'
    expect(censor.forbidden(text).map(({ index, lastIndex }) => text.slice(index, lastIndex))).toEqual([
      'www.evil.com',
      '06 12 34 56 78',
    ])
  })

  it('Does censor everything it forbids', () => {
    const texts = [
      'evil.cfd/a/x1y2z3',
      'evil.cfd?eatwith.com/verify',
      'go to www.evil.cfd now or t.me/some_support',
      'call me on +33 6 12 34 56 78 or (555) 123-4567',
      'Hello!\nMy phone is +447911123456\nThanks',
    ]

    texts.forEach((text) => {
      const processed = censor.process(text)
      const found = censor.forbidden(text)
      expect(found.length).toBeGreaterThan(0)
      found.forEach(({ raw }) => expect(processed).not.toContain(raw))
    })
  })

  it('Does censor a link written without scheme on an unknown TLD', () => {
    expect(censor.process('go to evil.cfd/a/x now')).toBe('go to ************ now')
    // a strict link wins over the loose match it holds
    expect(censor.process('evil.cfd?eatwith.com/verify')).toBe('***************************')
  })
})
