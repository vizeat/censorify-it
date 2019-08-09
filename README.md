# censorify-it

Censor unwanted URLs, emails and telephone numbers to prevent spam

Annoyed by spammers & scammers orchestrating fishing attacks with links, phone numbers or email address within your app? CensorifyIt is the answer!

Built as an extension of [LinkifyIt](https://github.com/markdown-it/linkify-it)

## Install

```
yarn add censorify-it
```

## Usage

```js
import CensorifyIt from "censorify-it";

const censorify = new CensorifyIt();

console.log(censorify.match("Site github.com!"));
// [ {
//   schema: "",
//   index: 5,
//   lastIndex: 15,
//   raw: "github.com",
//   text: "⏤⏤⏤⏤",
// } ]

console.log(censorify.match("My phone number is 01 01 01 01 01"));
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
const censorify = new CensorifyIt();
censorify.set({ replacementText: "REMOVED" });

console.log(censorify.match("My phone number is 01 01 01 01 01"));
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
const mysiteRegex = new RegExp(/mysite.com/g);

const censorify = new CensorifyIt();
censorify.set({ exception: mysiteRegex });

console.log(censorify.match("Check out github.com or mysite.com"));
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
