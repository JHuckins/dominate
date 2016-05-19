// Regex to extract the tag name
const tagNameRe = /<([\w-]+)/;

// Determine if `DOMParser` supports 'text/html'
const supportsDOMParser = (() => {
    try {
        if ((new DOMParser()).parseFromString('', 'text/html')) {
            return true;
        }
    } catch (e) {
        return false;
    }
})();

// Prevent the parser from ignoring certain
// elements by wrapping them with the necessary
// parent elements to appease XHTML compliance
// (courtesy of jQuery: https://github.com/jquery/jquery/blob/master/src/manipulation/wrapMap.js)
const wrapMap = {
    thead: [1, '<table>', '</table>'],
    col: [2, '<table><colgroup>', '</colgroup></table>'],
    tr: [2, '<table><tbody>', '</tbody></table>'],
    td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
    default: [0, '', '']
};
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

// Support SVG elements
'circle ellipse g image line path polygon polyline rect text'.split(' ').forEach((tag) => {
    wrapMap[tag] = [1, '<svg xmlns="http://www.w3.org/2000/svg">', '</svg>'];
});

/**
 * Copy the attributes from one node
 * to another
 *
 * @param {Element} el
 * @param {Element} target
 * @return {Element}
 * @api private
 */
function copyAttributes(el, target) {
    const attrs = target.attributes;
    for (let i = 0, len = attrs.length, attr; i < len; i++) {
        attr = attrs[i];
        el.setAttribute(attr.name, attr.value);
    }
    return el;
}

/**
 * Create a script element that will
 * execute
 *
 * @param {Element} el
 * @param {Document} doc
 * @return {Element}
 * @api private
 */
function copyScript(el, doc) {
    const script = doc.createElement('script');
    script.async = true;
    script.text = el.textContent;
    return copyAttributes(script, el);
}

/**
 * Parse HTML and XML documents
 *
 * @param {String} markup
 * @param {String} type
 * @return {Element}
 * @api private
 */
function parseDocument(markup, type) {
    const parser = new DOMParser();
    const newDoc = parser.parseFromString(markup, type);
    return newDoc.removeChild(newDoc.documentElement);
}

/**
 * Parse HTML string using the
 * proper parent element
 *
 * @param {Document} doc
 * @param {String} tag
 * @param {String} html
 * @return {Element}
 * @api private
 */
function parseHTML(doc, tag, html) {
    const el = doc.createElement(tag);
    el.innerHTML = html;
    return el;
}

/**
 * Parse an HMTL string in a
 * DOM node
 *
 * @param {String} html
 * @param {String} tag
 * @param {Document} doc
 * @return {Element|DocumentFragment}
 * @api private
 */
function parse(html, tag, doc) {
    // Support <html> elements
    if (tag === 'html') {
        if (supportsDOMParser) {
            return parseDocument(html, 'text/html');
        }
        // Attributes of the <html> element do not get
        // parsed using `innerHTML` here, so we parse it
        // as XML and then copy the attributes
        const el = parseHTML(doc, 'html', html);
        const xml = parseDocument(html, 'text/xml');
        return copyAttributes(el, xml);
    }
    // Support <body> and <head> elements
    if (tag === 'head' || tag === 'body') {
        const el = parseHTML(doc, 'html', html);
        return el.removeChild(tag === 'head' ? el.firstChild : el.lastChild);
    }
    // Wrap the element in the appropriate container
    const wrap = wrapMap[tag] || wrapMap.default;
    // Parse HTML string
    let el = parseHTML(doc, 'div', wrap[1] + html + wrap[2]);
    // Descend through wrappers to get the right element
    let depth = wrap[0];
    while (depth--) {
        el = el.lastChild;
    }
    // Support <script> elements
    if (tag === 'script') {
        return copyScript(el.firstChild, doc);
    }
    // Single element
    if (el.childNodes.length === 1) {
        return el.removeChild(el.firstChild);
    }
    // Use a document fragment for multiple elements
    const frag = doc.createDocumentFragment();
    while (el.firstChild) {
        frag.appendChild(el.firstChild);
    }
    return frag;
}

/**
 * Convert a string into a DOM node
 *
 * @param {String} html
 * @param {Document} doc
 * @param {Boolean} execScripts
 * @return {Element|TextNode|DocumentFragment}
 * @api public
 */
export default function dominate(html, doc = document, execScripts = true) {
    // Validate html param
    if (~~('string boolean number').indexOf(typeof html)) {
        throw new TypeError('Invalid input, string/number/boolean expected');
    }
    // Parse the HTML string for a tag name
    const match = tagNameRe.exec(html);
    // If no tag name exists, treat it as plain text
    if (!match) {
        return doc.createTextNode(html);
    }
    // Get the tag name
    const tag = match[1].toLowerCase();
    // Get DOM object
    const el = parse(html.trim(), tag, doc);
    // If it's a script element, return it as it
    // should always execute regardless of the
    // `execScripts` param
    if (tag === 'script') {
        return el;
    }
    // If `execScripts` is true, replace all script
    // elements with a new script element to enable
    // execution, otherwise remove the script elements
    const scripts = el.querySelectorAll('script');
    for (let i = 0, len = scripts.length, script, parent; i < len; i++) {
        script = scripts[i];
        parent = script.parentNode;
        if (execScripts === false) {
            parent.removeChild(script);
        } else {
            parent.replaceChild(copyScript(script, doc), script);
        }
    }
    return el;
}
