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

All the other settings and additions as defined by [LinkifyIt](https://github.com/markdown-it/linkify-it/blob/master/README.md#api) also apply.
