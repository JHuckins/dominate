/**
 * Regular expression to extract the tag name
 */
const tagNameRe = /<([\w-]+)/;

/**
 * Check if the browser supports the <template> element
 */
const supportsTemplate = 'content' in document.createElement('template');

/**
 * Determine if `DOMParser` supports 'text/html'
 */
const supportsDOMParserHTML = (() => {
    try {
        if ((new DOMParser()).parseFromString('', 'text/html')) {
            return true;
        }
    } catch (e) {
        return false;
    }
})();

/**
 * Prevent the parser from ignoring certain
 * elements by wrapping them with the necessary
 * parent elements to appease XHTML compliance
 * courtesy of jQuery: https://github.com/jquery/jquery/blob/master/src/manipulation/wrapMap.js
 */
const wrapMap = {
    thead: [1, '<table>', '</table>'],
    col: [2, '<table><colgroup>', '</colgroup></table>'],
    tr: [2, '<table><tbody>', '</tbody></table>'],
    td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
    _default: [0, '', '']
};
wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
wrapMap.th = wrapMap.td;

/**
 * SVG elements
 */
const svgTags = [
    'animate',
    'animateColor',
    'animateMotion',
    'animateTransform',
    'circle',
    'clipPath',
    'defs',
    'desc',
    'ellipse',
    'foreignObject',
    'filter',
    'g',
    'gradient',
    'image',
    'line',
    'linearGradient',
    'marker',
    'mask',
    'metadata',
    'path',
    'pattern',
    'polygon',
    'polyline',
    'radialGradient',
    'rect',
    'set',
    'stop',
    'switch',
    'symbol',
    'text',
    'textPath',
    'tref',
    'tspan',
    'use',
    'view'
];

/**
 * Add wrap to support SVG elements
 */
const svgWrap = [1, '<svg xmlns="http://www.w3.org/2000/svg">', '</svg>'];
svgTags.reduce((wrap, tag) => (wrapMap[tag] = wrap), svgWrap);

/**
 * Is the tag an SVG tag
 *
 * @param {String} tag
 * @return {Boolean}
 * @api private
 */
function isSVG(tag) {
    return svgTags.indexOf(tag) !== -1;
}

/**
 * Are the passed arguments a result of a
 * tagged template literal invocation
 *
 * @param {Arguments} args
 * @return {Boolean}
 * @api private
 */
function isTaggedTemplate(args) {
    if (!args || typeof args !== 'object') {
        return false;
    }
    const strings = args[0];
    return (
        strings &&
        Array.isArray(strings) &&
        Array.isArray(strings.raw) &&
        typeof strings[0] === 'string' &&
        typeof strings.raw[0] === 'string'
    ) || false;
}

/**
 * Copy the attributes from one node to another
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
 * Create a script element that will execute
 *
 * @param {Document} doc
 * @param {Element} el
 * @return {Element}
 * @api private
 */
function copyScript(doc, el) {
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
 * Parse HTML string using the proper parent
 * element
 *
 * @param {Document} doc
 * @param {String} html
 * @param {String} tag
 * @return {Element}
 * @api private
 */
function parseHTML(doc, html, tag = 'div') {
    const el = doc.createElement(tag);
    el.innerHTML = html;
    return el;
}

/**
 * Parse HTML elements
 *
 * @param {Document} doc
 * @param {String} tag
 * @param {String} html
 * @return {Element}
 * @api private
 */
function parseElements(doc, tag, html) {
    // Use the <template> element if it is supported and
    // the tag is not an SVG element
    if (supportsTemplate && !isSVG(tag)) {
        // Create a template element to parse the HTML string
        const template = doc.createElement('template');
        template.innerHTML = html;
        // Clone and return the document fragment within
        // the template
        return doc.importNode(template.content, true);
    }
    // Wrap the element in the appropriate container
    const wrap = wrapMap[tag] || wrapMap._default;
    // Parse HTML string
    let el = parseHTML(doc, wrap[1] + html + wrap[2]);
    // Descend through wrappers to get the right element
    let depth = wrap[0];
    while (depth--) {
        el = el.lastChild;
    }
    return el;
}

/**
 * Parse an HMTL string into a DOM node
 *
 * @param {Document} doc
 * @param {String} tag
 * @param {String} html
 * @return {Element|DocumentFragment}
 * @api private
 */
function parse(doc, tag, html) {
    // Support <html> elements
    if (tag === 'html') {
        if (supportsDOMParserHTML) {
            return parseDocument(html, 'text/html');
        }
        // Attributes of the <html> element do not get
        // parsed using `innerHTML` here, so we parse it
        // as XML and then copy the attributes
        const el = parseHTML(doc, html, 'html');
        const xml = parseDocument(html, 'text/xml');
        return copyAttributes(el, xml);
    }
    // Support <body> and <head> elements
    if (tag === 'head' || tag === 'body') {
        const el = parseHTML(doc, html, 'html');
        return el.removeChild(tag === 'head' ? el.firstChild : el.lastChild);
    }
    // Support every other element
    const el = parseElements(doc, tag, html);
    // Support executable <script> elements
    if (tag === 'script') {
        return copyScript(doc, el.firstChild);
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
 * @param {Object} options
 * @param {Document} options.context
 * @param {String} options.type
 * @param {Boolean} options.scripts
 * @return {Element|TextNode|DocumentFragment}
 * @api public
 */
export default function dominate(html, {context = document, type = 'html', scripts = true} = {}) {
    // Check if it is a tagged template invocation
    if (isTaggedTemplate(arguments)) {
        const [strings, ...values] = arguments;
        return dominate(strings.raw.reduce((acc, str, i) => acc + (values[i - 1]).join('') + str));
    }
    // Return an XML element if the type param is 'xml'
    if (type.toLowerCase() === 'xml') {
        return parseDocument(html, 'text/xml');
    }
    // Parse the HTML string for a tag name
    const match = tagNameRe.exec(html);
    // If no tag name exists, treat it as plain text
    if (!match) {
        return context.createTextNode(html);
    }
    // Get the tag name
    const tag = match[1];
    // Parse the HTML string into a DOM node
    const el = parse(context, tag, html.trim());
    // If it's a script element, return it as it
    // should always execute regardless of the
    // `scripts` param
    if (tag === 'script') {
        return el;
    }
    // If `scripts` param is true, replace all script
    // elements with a new script element to enable
    // execution, otherwise remove the script elements
    const elements = el.querySelectorAll('script');
    for (let i = 0, len = elements.length, script, parent; i < len; i++) {
        script = elements[i];
        parent = script.parentNode;
        if (scripts === false) {
            parent.removeChild(script);
        } else {
            parent.replaceChild(copyScript(context, script), script);
        }
    }
    return el;
}
