# dominate 

[![Version Badge][version-image]][project-url]
[![Build Status][build-image]][build-url]
[![Dependencies][dependencies-image]][project-url]
[![License][license-image]][license-url]
[![File Size][file-size-image]][project-url]

> Convert HTML, SVG, and XML markup strings into DOM objects.

## Usage

Convert a single element HTML string into a DOM element:

``` javascript
const div = dominate('<div>foo</div>');
div.nodeName; // DIV
```

Convert a multiple element HTML string into a document fragment:

``` javascript
const frag = dominate('<strong>Hello</strong> <em>World</em>');
frag.nodeName; // #document-fragment
```

Convert plain text to a DOM text node:

``` javascript
const text = dominate('This is plain text.');
text.nodeName; // #text
```

Convert an SVG element into a DOM element:

``` javascript
const rect = dominate('<rect x="10" y="10" width="100" height="100"/>');
rect instanceof SVGRectElement; // true
```

Executes script tags within an HTML string by default:

``` javascript
const script = dominate('<script>console.log("foo");</script>');
document.body.appendChild(script); // console outputs "foo"
```

Remove script tags to prevent execution:

``` javascript
const el = dominate('<section><script src="foo.js"></script></section>', {scripts: false});
const script = el.querySelector('script'); // null
```

Use a custom document instead of the default (`window.document`)

``` javascript
import { jsdom } from 'jsdom';
const doc = jsdom('<html><body></body></html>');

const el = dominate('<div></div>', {context: doc});
el.ownerDocument === doc; // true
```

Convert XML string into a DOM element:

``` javascript
const xml = dominate('<name>foo</name>', {type: 'xml'});
xml instanceof Element; // true
xml instanceof HTMLElement; // false
```

Supports [tagged template literals](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Template_literals#Tagged_template_literals):

``` javascript
const names = ['John', 'Amy', 'Joe'];

const el = dominate`
    <div>
        <ul>
            ${names.map(name => `<li>${name}</li>`)}
        </ul>
    </div>
`;

document.body.appendChild(el);
```

## Installation

Dominate is [CommonJS](http://www.commonjs.org/) and [AMD](https://github.com/amdjs/amdjs-api/wiki/AMD) compatible with no dependencies. You can download the [development](http://github.com/ryanmorr/dominate/raw/master/dist/dominate.js) or [minified](http://github.com/ryanmorr/dominate/raw/master/dist/dominate.min.js) version, or install it in one of the following ways:

``` sh
npm install ryanmorr/dominate

bower install ryanmorr/dominate
```

## Tests

Open `test/runner.html` in your browser or test with PhantomJS by issuing the following commands:

``` sh
npm install
npm install -g gulp
gulp test
```

## License

This project is dedicated to the public domain as described by the [Unlicense](http://unlicense.org/).

[project-url]: https://github.com/ryanmorr/dominate
[version-image]: https://badge.fury.io/gh/ryanmorr%2Fdominate.svg
[build-url]: https://travis-ci.org/ryanmorr/dominate
[build-image]: https://travis-ci.org/ryanmorr/dominate.svg
[dependencies-image]: https://david-dm.org/ryanmorr/dominate.svg
[license-image]: https://img.shields.io/badge/license-Unlicense-blue.svg
[license-url]: UNLICENSE
[file-size-image]: https://badge-size.herokuapp.com/ryanmorr/dominate/master/dist/dominate.min.js.svg?color=blue&label=file%20size