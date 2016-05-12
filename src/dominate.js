// Detect HTML string
const htmlRe = /^<[a-z][\s\S]*>$/;

export function dominate(html, doc = document) {
    // If the parameter is not an HTML string,
    // return a text node
    if (!htmlRe.test(html)) {
        return doc.createTextNode(html);
    }
    // Create parsing element
    const el = doc.createElement('div');
    // Parse HTML string
    el.innerHTML = html;
    // Single element
    if (el.childNodes.length === 1) {
        return el.removeChild(el.firstChild);
    }
    // Multiple elements
    const frag = doc.createDocumentFragment();
    while (el.firstChild) {
        frag.appendChild(el.firstChild);
    }
    return frag;
}
