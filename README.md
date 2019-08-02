# deletify-it
Delete unwanted URLs, emails and telephone numbers to prevent spam

Annoyed by users sending links to external websites? Frustrated by clients taking their payment offline? Just don't want to let anyone contact anyone else via email or telephone? DeletifyIt is the answer!

Built as an extension of [LinkifyIt](https://github.com/markdown-it/linkify-it)

## Install

```
yarn add deletify-it
```

## Usage

```js
import DeletifyIt from 'deletify-it'

const deletify = new DeletifyIt()

console.log(deletify.match('Site github.com!'));
  // [ {
  //   schema: "",
  //   index: 5,
  //   lastIndex: 15,
  //   raw: "github.com",
  //   text: "⏤⏤⏤⏤",
  // } ]

console.log(deletify.match('My phone number is 01 01 01 01 01'));
  // [ {
  //   schema: "",
  //   index: 19,
  //   lastIndex: 33,
  //   raw: "01 01 01 01 01",
  //   text: "⏤⏤⏤⏤",
  // } ]
```

To change the replacement string:

```js
const deletify = new DeletifyIt()
deletify.set({ replacementText: 'REMOVED' })

console.log(deletify.match('My phone number is 01 01 01 01 01'));
  // [ {
  //   schema: "",
  //   index: 19,
  //   lastIndex: 33,
  //   raw: "01 01 01 01 01",
  //   text: "REMOVED",
  // } ]
``` 

Accepts an exception regex which will not remove matched terms

```js
const mysiteRegex = new RegExp(/mysite.com/g)

const deletify = new DeletifyIt()
deletify.set({ exception: mysiteRegex })

console.log(deletify.match('Check out github.com or mysite.com'));
  // [ {
  //   schema: "",
  //   index: 10,
  //   lastIndex: 20,
  //   raw: "github.com",
  //   text: "⏤⏤⏤⏤",
  // }, {
  //   schema: "",
  //   index: 24,
  //   lastIndex: 34,
  //   raw: "mysite.com",
  //   text: "mysite.com",
  //   url: "http://mysite.com",
  // } ]
```

All the other settings and additions as defined by [LinkifyIt](https://github.com/markdown-it/linkify-it/blob/master/README.md#api) also apply.
