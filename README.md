# censorify-it

[![codecov](https://codecov.io/gh/vizeat/censorify-it/branch/master/graph/badge.svg)](https://codecov.io/gh/vizeat/censorify-it)

Censor unwanted URLs, emails and telephone numbers to prevent spam

Annoyed by spammers & scammers orchestrating fishing attacks with links, phone numbers or email address within your app? CensorifyIt is the answer!

Built as an extension of [LinkifyIt](https://github.com/markdown-it/linkify-it)

## Install

```
yarn add censorify-it
```

## Usage

```js
import CensorifyIt from 'censorify-it'

const censorify = new CensorifyIt()

console.log(censorify.process('Hello, here is https://alink.to/a-website can you find it?'))
// 'Hello, here is ************************** can you find it?'
console.log(censorify.process('My phone number is +1 123 456 7890'))
// 'My phone number is ***************'

console.log(censorify.match('Site github.com!'))
// [
//   Match {
//     schema: '',
//     index: 5,
//     lastIndex: 15,
//     raw: 'github.com',
//     url: 'http://github.com',
//     text: '**********'
//   }
// ]

console.log(censorify.match('My phone number is 01 01 01 01 01'))
// [
//   Match {
//     schema: '0',
//     index: 19,
//     lastIndex: 33,
//     raw: '01 01 01 01 01',
//     url: '01 01 01 01 01',
//     text: '**************'
//   }
// ]
```

To change the replacement string:

```js
const censorify = new CensorifyIt()
censorify.set({ replacementText: 'REMOVED' })

console.log(censorify.match('My phone number is 01 01 01 01 01'))
// [
//   Match {
//     schema: '0',
//     index: 19,
//     lastIndex: 33,
//     raw: '01 01 01 01 01',
//     url: '01 01 01 01 01',
//     text: 'REMOVED'
//   }
// ]
```

Accepts an exceptions array of regex or function
regex are executed against the raw text that was matched
functions takes the full match as parameters

```js
const censorify = new CensorifyIt()

const mysiteRegex = new RegExp(/mysite.com/g)
const mySophisticatedException = match => match.url === 'http://example.com'
censorify.set({ exceptions: [mysiteRegex, mySophisticatedException] })

console.log(censorify.match('Check out github.com or mysite.com or even example.com'))
// [
//   Match {
//     schema: '',
//     index: 10,
//     lastIndex: 20,
//     raw: 'github.com',
//     url: 'http://github.com',
//     text: '**********'
//   },
//   Match {
//     schema: '',
//     index: 24,
//     lastIndex: 34,
//     raw: 'mysite.com',
//     url: 'http://mysite.com',
//     text: 'http://mysite.com'
//   },
//   Match {
//     schema: '',
//     index: 43,
//     lastIndex: 54,
//     raw: 'example.com',
//     url: 'http://example.com',
//     text: 'http://example.com'
//   }
// ]
```

Every match has a `type`: `link`, `email` or `phone`. Exceptions can be given by type, which is safer than a single
list: a loose phone number pattern in a single list also lets through the links holding these digits.

```js
censorify.set({
  exceptions: {
    link: [/^(?:https?:\/\/)?(?:[\w-]+\.)*mysite\.com(?=[/?#]|$)/i],
    phone: [/\+33.?1.?23.?45.?67.?89/],
  },
})
```

## Refusing a text instead of censoring it

Censoring can afford false positives: a date taken for a phone number only costs a few stars. Refusing a text
cannot. `forbidden` only reports what is a link or a phone number beyond doubt, exceptions applied:

- links: `scheme://`, `www.`, `domain/path` or `domain?query`, whatever the TLD. A bare domain is not reported,
  it would also catch a missing space after a period (`see you soon.In any case`);
- phone numbers: international ones (`+…`, `00…`) from 8 digits, national ones from 9 digits. Dates and lists of
  small numbers (`12 15 20 25 30 people`) are left aside.

```js
const censorify = new CensorifyIt()

console.log(censorify.forbidden('Go to evil.cfd/a/x or call 06 12 34 56 78, we are 12 on 2026-11-20'))
// [
//   Match { schema: '', type: 'link', index: 6, lastIndex: 18, raw: 'evil.cfd/a/x', url: 'http://evil.cfd/a/x', text: 'evil.cfd/a/x' },
//   Match { schema: '', type: 'phone', index: 27, lastIndex: 41, raw: '06 12 34 56 78', url: '06 12 34 56 78', text: '06 12 34 56 78' }
// ]
```

Everything `forbidden` reports is censored by `process` as well.

All the other settings and additions as defined by [LinkifyIt](https://github.com/markdown-it/linkify-it/blob/master/README.md#api) also apply.
