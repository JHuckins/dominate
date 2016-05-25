/*! dominate v0.1.0 | https://github.com/ryanmorr/dominate */
(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
(function (global, factory) {
    if (typeof define === "function" && define.amd) {
        define(['module', 'exports'], factory);
    } else if (typeof exports !== "undefined") {
        factory(module, exports);
    } else {
        var mod = {
            exports: {}
        };
        factory(mod, mod.exports);
        global.dominate = mod.exports;
    }
})(this, function (module, exports) {
    'use strict';

    Object.defineProperty(exports, "__esModule", {
        value: true
    });
    exports.default = dominate;
    // Regex to extract the tag name
    var tagNameRe = /<([\w-]+)/;

    // Determine if `DOMParser` supports 'text/html'
    var supportsDOMParserHTML = function () {
        try {
            if (new DOMParser().parseFromString('', 'text/html')) {
                return true;
            }
        } catch (e) {
            return false;
        }
    }();

    // Prevent the parser from ignoring certain
    // elements by wrapping them with the necessary
    // parent elements to appease XHTML compliance
    // (courtesy of jQuery: https://github.com/jquery/jquery/blob/master/src/manipulation/wrapMap.js)
    var wrapMap = {
        thead: [1, '<table>', '</table>'],
        col: [2, '<table><colgroup>', '</colgroup></table>'],
        tr: [2, '<table><tbody>', '</tbody></table>'],
        td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
        _default: [0, '', '']
    };
    wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
    wrapMap.th = wrapMap.td;

    // Support SVG elements
    'circle ellipse g image line path polygon polyline rect text'.split(' ').forEach(function (tag) {
        wrapMap[tag] = [1, '<svg xmlns="http://www.w3.org/2000/svg">', '</svg>'];
    });

    /**
     * Copy the attributes from one node to another
     *
     * @param {Element} el
     * @param {Element} target
     * @return {Element}
     * @api private
     */
    function copyAttributes(el, target) {
        var attrs = target.attributes;
        for (var i = 0, len = attrs.length, attr; i < len; i++) {
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
        var script = doc.createElement('script');
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
        var parser = new DOMParser();
        var newDoc = parser.parseFromString(markup, type);
        return newDoc.removeChild(newDoc.documentElement);
    }

    /**
     * Parse HTML string using the proper parent
     * element
     *
     * @param {Document} doc
     * @param {String} tag
     * @param {String} html
     * @return {Element}
     * @api private
     */
    function parseHTML(doc, tag, html) {
        var el = doc.createElement(tag);
        el.innerHTML = html;
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
            var _el = parseHTML(doc, 'html', html);
            var xml = parseDocument(html, 'text/xml');
            return copyAttributes(_el, xml);
        }
        // Support <body> and <head> elements
        if (tag === 'head' || tag === 'body') {
            var _el2 = parseHTML(doc, 'html', html);
            return _el2.removeChild(tag === 'head' ? _el2.firstChild : _el2.lastChild);
        }
        // Wrap the element in the appropriate container
        var wrap = wrapMap[tag] || wrapMap._default;
        // Parse HTML string
        var el = parseHTML(doc, 'div', wrap[1] + html + wrap[2]);
        // Descend through wrappers to get the right element
        var depth = wrap[0];
        while (depth--) {
            el = el.lastChild;
        }
        // Support executable <script> elements
        if (tag === 'script') {
            return copyScript(doc, el.firstChild);
        }
        // Single element
        if (el.childNodes.length === 1) {
            return el.removeChild(el.firstChild);
        }
        // Use a document fragment for multiple elements
        var frag = doc.createDocumentFragment();
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
    function dominate(html) {
        var _ref = arguments.length <= 1 || arguments[1] === undefined ? {} : arguments[1];

        var _ref$context = _ref.context;
        var context = _ref$context === undefined ? document : _ref$context;
        var _ref$type = _ref.type;
        var type = _ref$type === undefined ? 'html' : _ref$type;
        var _ref$scripts = _ref.scripts;
        var scripts = _ref$scripts === undefined ? true : _ref$scripts;

        // Return an XML element if the type param is 'xml'
        if (type.toLowerCase() === 'xml') {
            return parseDocument(html, 'text/xml');
        }
        // Parse the HTML string for a tag name
        var match = tagNameRe.exec(html);
        // If no tag name exists, treat it as plain text
        if (!match) {
            return context.createTextNode(html);
        }
        // Get the tag name
        var tag = match[1].toLowerCase();
        // Parse the HTML string into a DOM node
        var el = parse(context, tag, html.trim());
        // If it's a script element, return it as it
        // should always execute regardless of the
        // `execScripts` param
        if (tag === 'script') {
            return el;
        }
        // If `execScripts` is true, replace all script
        // elements with a new script element to enable
        // execution, otherwise remove the script elements
        var elements = el.querySelectorAll('script');
        for (var i = 0, len = elements.length, script, parent; i < len; i++) {
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
    module.exports = exports['default'];
});

},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmNcXGRvbWluYXRlLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBOzs7Ozs7Ozs7Ozs7Ozs7Ozs7O3NCQzhKd0IsUTs7QUE3SnhCLFFBQU0sWUFBWSxXQUFsQjs7O0FBR0EsUUFBTSx3QkFBeUIsWUFBTTtBQUNqQyxZQUFJO0FBQ0EsZ0JBQUssSUFBSSxTQUFKLEVBQUQsQ0FBa0IsZUFBbEIsQ0FBa0MsRUFBbEMsRUFBc0MsV0FBdEMsQ0FBSixFQUF3RDtBQUNwRCx1QkFBTyxJQUFQO0FBQ0g7QUFDSixTQUpELENBSUUsT0FBTyxDQUFQLEVBQVU7QUFDUixtQkFBTyxLQUFQO0FBQ0g7QUFDSixLQVI2QixFQUE5Qjs7Ozs7O0FBY0EsUUFBTSxVQUFVO0FBQ1osZUFBTyxDQUFDLENBQUQsRUFBSSxTQUFKLEVBQWUsVUFBZixDQURLO0FBRVosYUFBSyxDQUFDLENBQUQsRUFBSSxtQkFBSixFQUF5QixxQkFBekIsQ0FGTztBQUdaLFlBQUksQ0FBQyxDQUFELEVBQUksZ0JBQUosRUFBc0Isa0JBQXRCLENBSFE7QUFJWixZQUFJLENBQUMsQ0FBRCxFQUFJLG9CQUFKLEVBQTBCLHVCQUExQixDQUpRO0FBS1osa0JBQVUsQ0FBQyxDQUFELEVBQUksRUFBSixFQUFRLEVBQVI7QUFMRSxLQUFoQjtBQU9BLFlBQVEsS0FBUixHQUFnQixRQUFRLEtBQVIsR0FBZ0IsUUFBUSxRQUFSLEdBQW1CLFFBQVEsT0FBUixHQUFrQixRQUFRLEtBQTdFO0FBQ0EsWUFBUSxFQUFSLEdBQWEsUUFBUSxFQUFyQjs7O0FBR0Esa0VBQThELEtBQTlELENBQW9FLEdBQXBFLEVBQXlFLE9BQXpFLENBQWlGLFVBQUMsR0FBRCxFQUFTO0FBQ3RGLGdCQUFRLEdBQVIsSUFBZSxDQUFDLENBQUQsRUFBSSwwQ0FBSixFQUFnRCxRQUFoRCxDQUFmO0FBQ0gsS0FGRDs7Ozs7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QVA7QUFDSCIsImZpbGUiOiJnZW5lcmF0ZWQuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlc0NvbnRlbnQiOlsiKGZ1bmN0aW9uIGUodCxuLHIpe2Z1bmN0aW9uIHMobyx1KXtpZighbltvXSl7aWYoIXRbb10pe3ZhciBhPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7aWYoIXUmJmEpcmV0dXJuIGEobywhMCk7aWYoaSlyZXR1cm4gaShvLCEwKTt2YXIgZj1uZXcgRXJyb3IoXCJDYW5ub3QgZmluZCBtb2R1bGUgJ1wiK28rXCInXCIpO3Rocm93IGYuY29kZT1cIk1PRFVMRV9OT1RfRk9VTkRcIixmfXZhciBsPW5bb109e2V4cG9ydHM6e319O3Rbb11bMF0uY2FsbChsLmV4cG9ydHMsZnVuY3Rpb24oZSl7dmFyIG49dFtvXVsxXVtlXTtyZXR1cm4gcyhuP246ZSl9LGwsbC5leHBvcnRzLGUsdCxuLHIpfXJldHVybiBuW29dLmV4cG9ydHN9dmFyIGk9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtmb3IodmFyIG89MDtvPHIubGVuZ3RoO28rKylzKHJbb10pO3JldHVybiBzfSkiLCIvLyBSZWdleCB0byBleHRyYWN0IHRoZSB0YWcgbmFtZVxyXG5jb25zdCB0YWdOYW1lUmUgPSAvPChbXFx3LV0rKS87XHJcblxyXG4vLyBEZXRlcm1pbmUgaWYgYERPTVBhcnNlcmAgc3VwcG9ydHMgJ3RleHQvaHRtbCdcclxuY29uc3Qgc3VwcG9ydHNET01QYXJzZXJIVE1MID0gKCgpID0+IHtcclxuICAgIHRyeSB7XHJcbiAgICAgICAgaWYgKChuZXcgRE9NUGFyc2VyKCkpLnBhcnNlRnJvbVN0cmluZygnJywgJ3RleHQvaHRtbCcpKSB7XHJcbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xyXG4gICAgICAgIH1cclxuICAgIH0gY2F0Y2ggKGUpIHtcclxuICAgICAgICByZXR1cm4gZmFsc2U7XHJcbiAgICB9XHJcbn0pKCk7XHJcblxyXG4vLyBQcmV2ZW50IHRoZSBwYXJzZXIgZnJvbSBpZ25vcmluZyBjZXJ0YWluXHJcbi8vIGVsZW1lbnRzIGJ5IHdyYXBwaW5nIHRoZW0gd2l0aCB0aGUgbmVjZXNzYXJ5XHJcbi8vIHBhcmVudCBlbGVtZW50cyB0byBhcHBlYXNlIFhIVE1MIGNvbXBsaWFuY2VcclxuLy8gKGNvdXJ0ZXN5IG9mIGpRdWVyeTogaHR0cHM6Ly9naXRodWIuY29tL2pxdWVyeS9qcXVlcnkvYmxvYi9tYXN0ZXIvc3JjL21hbmlwdWxhdGlvbi93cmFwTWFwLmpzKVxyXG5jb25zdCB3cmFwTWFwID0ge1xyXG4gICAgdGhlYWQ6IFsxLCAnPHRhYmxlPicsICc8L3RhYmxlPiddLFxyXG4gICAgY29sOiBbMiwgJzx0YWJsZT48Y29sZ3JvdXA+JywgJzwvY29sZ3JvdXA+PC90YWJsZT4nXSxcclxuICAgIHRyOiBbMiwgJzx0YWJsZT48dGJvZHk+JywgJzwvdGJvZHk+PC90YWJsZT4nXSxcclxuICAgIHRkOiBbMywgJzx0YWJsZT48dGJvZHk+PHRyPicsICc8L3RyPjwvdGJvZHk+PC90YWJsZT4nXSxcclxuICAgIF9kZWZhdWx0OiBbMCwgJycsICcnXVxyXG59O1xyXG53cmFwTWFwLnRib2R5ID0gd3JhcE1hcC50Zm9vdCA9IHdyYXBNYXAuY29sZ3JvdXAgPSB3cmFwTWFwLmNhcHRpb24gPSB3cmFwTWFwLnRoZWFkO1xyXG53cmFwTWFwLnRoID0gd3JhcE1hcC50ZDtcclxuXHJcbi8vIFN1cHBvcnQgU1ZHIGVsZW1lbnRzXHJcbidjaXJjbGUgZWxsaXBzZSBnIGltYWdlIGxpbmUgcGF0aCBwb2x5Z29uIHBvbHlsaW5lIHJlY3QgdGV4dCcuc3BsaXQoJyAnKS5mb3JFYWNoKCh0YWcpID0+IHtcclxuICAgIHdyYXBNYXBbdGFnXSA9IFsxLCAnPHN2ZyB4bWxucz1cImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCI+JywgJzwvc3ZnPiddO1xyXG59KTtcclxuXHJcbi8qKlxyXG4gKiBDb3B5IHRoZSBhdHRyaWJ1dGVzIGZyb20gb25lIG5vZGUgdG8gYW5vdGhlclxyXG4gKlxyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXHJcbiAqIEBwYXJhbSB7RWxlbWVudH0gdGFyZ2V0XHJcbiAqIEByZXR1cm4ge0VsZW1lbnR9XHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuZnVuY3Rpb24gY29weUF0dHJpYnV0ZXMoZWwsIHRhcmdldCkge1xyXG4gICAgY29uc3QgYXR0cnMgPSB0YXJnZXQuYXR0cmlidXRlcztcclxuICAgIGZvciAobGV0IGkgPSAwLCBsZW4gPSBhdHRycy5sZW5ndGgsIGF0dHI7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgIGF0dHIgPSBhdHRyc1tpXTtcclxuICAgICAgICBlbC5zZXRBdHRyaWJ1dGUoYXR0ci5uYW1lLCBhdHRyLnZhbHVlKTtcclxuICAgIH1cclxuICAgIHJldHVybiBlbDtcclxufVxyXG5cclxuLyoqXHJcbiAqIENyZWF0ZSBhIHNjcmlwdCBlbGVtZW50IHRoYXQgd2lsbCBleGVjdXRlXHJcbiAqXHJcbiAqIEBwYXJhbSB7RG9jdW1lbnR9IGRvY1xyXG4gKiBAcGFyYW0ge0VsZW1lbnR9IGVsXHJcbiAqIEByZXR1cm4ge0VsZW1lbnR9XHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuZnVuY3Rpb24gY29weVNjcmlwdChkb2MsIGVsKSB7XHJcbiAgICBjb25zdCBzY3JpcHQgPSBkb2MuY3JlYXRlRWxlbWVudCgnc2NyaXB0Jyk7XHJcbiAgICBzY3JpcHQuYXN5bmMgPSB0cnVlO1xyXG4gICAgc2NyaXB0LnRleHQgPSBlbC50ZXh0Q29udGVudDtcclxuICAgIHJldHVybiBjb3B5QXR0cmlidXRlcyhzY3JpcHQsIGVsKTtcclxufVxyXG5cclxuLyoqXHJcbiAqIFBhcnNlIEhUTUwgYW5kIFhNTCBkb2N1bWVudHNcclxuICpcclxuICogQHBhcmFtIHtTdHJpbmd9IG1hcmt1cFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gdHlwZVxyXG4gKiBAcmV0dXJuIHtFbGVtZW50fVxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcbmZ1bmN0aW9uIHBhcnNlRG9jdW1lbnQobWFya3VwLCB0eXBlKSB7XHJcbiAgICBjb25zdCBwYXJzZXIgPSBuZXcgRE9NUGFyc2VyKCk7XHJcbiAgICBjb25zdCBuZXdEb2MgPSBwYXJzZXIucGFyc2VGcm9tU3RyaW5nKG1hcmt1cCwgdHlwZSk7XHJcbiAgICByZXR1cm4gbmV3RG9jLnJlbW92ZUNoaWxkKG5ld0RvYy5kb2N1bWVudEVsZW1lbnQpO1xyXG59XHJcblxyXG4vKipcclxuICogUGFyc2UgSFRNTCBzdHJpbmcgdXNpbmcgdGhlIHByb3BlciBwYXJlbnRcclxuICogZWxlbWVudFxyXG4gKlxyXG4gKiBAcGFyYW0ge0RvY3VtZW50fSBkb2NcclxuICogQHBhcmFtIHtTdHJpbmd9IHRhZ1xyXG4gKiBAcGFyYW0ge1N0cmluZ30gaHRtbFxyXG4gKiBAcmV0dXJuIHtFbGVtZW50fVxyXG4gKiBAYXBpIHByaXZhdGVcclxuICovXHJcbmZ1bmN0aW9uIHBhcnNlSFRNTChkb2MsIHRhZywgaHRtbCkge1xyXG4gICAgY29uc3QgZWwgPSBkb2MuY3JlYXRlRWxlbWVudCh0YWcpO1xyXG4gICAgZWwuaW5uZXJIVE1MID0gaHRtbDtcclxuICAgIHJldHVybiBlbDtcclxufVxyXG5cclxuLyoqXHJcbiAqIFBhcnNlIGFuIEhNVEwgc3RyaW5nIGludG8gYSBET00gbm9kZVxyXG4gKlxyXG4gKiBAcGFyYW0ge0RvY3VtZW50fSBkb2NcclxuICogQHBhcmFtIHtTdHJpbmd9IHRhZ1xyXG4gKiBAcGFyYW0ge1N0cmluZ30gaHRtbFxyXG4gKiBAcmV0dXJuIHtFbGVtZW50fERvY3VtZW50RnJhZ21lbnR9XHJcbiAqIEBhcGkgcHJpdmF0ZVxyXG4gKi9cclxuZnVuY3Rpb24gcGFyc2UoZG9jLCB0YWcsIGh0bWwpIHtcclxuICAgIC8vIFN1cHBvcnQgPGh0bWw+IGVsZW1lbnRzXHJcbiAgICBpZiAodGFnID09PSAnaHRtbCcpIHtcclxuICAgICAgICBpZiAoc3VwcG9ydHNET01QYXJzZXJIVE1MKSB7XHJcbiAgICAgICAgICAgIHJldHVybiBwYXJzZURvY3VtZW50KGh0bWwsICd0ZXh0L2h0bWwnKTtcclxuICAgICAgICB9XHJcbiAgICAgICAgLy8gQXR0cmlidXRlcyBvZiB0aGUgPGh0bWw+IGVsZW1lbnQgZG8gbm90IGdldFxyXG4gICAgICAgIC8vIHBhcnNlZCB1c2luZyBgaW5uZXJIVE1MYCBoZXJlLCBzbyB3ZSBwYXJzZSBpdFxyXG4gICAgICAgIC8vIGFzIFhNTCBhbmQgdGhlbiBjb3B5IHRoZSBhdHRyaWJ1dGVzXHJcbiAgICAgICAgY29uc3QgZWwgPSBwYXJzZUhUTUwoZG9jLCAnaHRtbCcsIGh0bWwpO1xyXG4gICAgICAgIGNvbnN0IHhtbCA9IHBhcnNlRG9jdW1lbnQoaHRtbCwgJ3RleHQveG1sJyk7XHJcbiAgICAgICAgcmV0dXJuIGNvcHlBdHRyaWJ1dGVzKGVsLCB4bWwpO1xyXG4gICAgfVxyXG4gICAgLy8gU3VwcG9ydCA8Ym9keT4gYW5kIDxoZWFkPiBlbGVtZW50c1xyXG4gICAgaWYgKHRhZyA9PT0gJ2hlYWQnIHx8IHRhZyA9PT0gJ2JvZHknKSB7XHJcbiAgICAgICAgY29uc3QgZWwgPSBwYXJzZUhUTUwoZG9jLCAnaHRtbCcsIGh0bWwpO1xyXG4gICAgICAgIHJldHVybiBlbC5yZW1vdmVDaGlsZCh0YWcgPT09ICdoZWFkJyA/IGVsLmZpcnN0Q2hpbGQgOiBlbC5sYXN0Q2hpbGQpO1xyXG4gICAgfVxyXG4gICAgLy8gV3JhcCB0aGUgZWxlbWVudCBpbiB0aGUgYXBwcm9wcmlhdGUgY29udGFpbmVyXHJcbiAgICBjb25zdCB3cmFwID0gd3JhcE1hcFt0YWddIHx8IHdyYXBNYXAuX2RlZmF1bHQ7XHJcbiAgICAvLyBQYXJzZSBIVE1MIHN0cmluZ1xyXG4gICAgbGV0IGVsID0gcGFyc2VIVE1MKGRvYywgJ2RpdicsIHdyYXBbMV0gKyBodG1sICsgd3JhcFsyXSk7XHJcbiAgICAvLyBEZXNjZW5kIHRocm91Z2ggd3JhcHBlcnMgdG8gZ2V0IHRoZSByaWdodCBlbGVtZW50XHJcbiAgICBsZXQgZGVwdGggPSB3cmFwWzBdO1xyXG4gICAgd2hpbGUgKGRlcHRoLS0pIHtcclxuICAgICAgICBlbCA9IGVsLmxhc3RDaGlsZDtcclxuICAgIH1cclxuICAgIC8vIFN1cHBvcnQgZXhlY3V0YWJsZSA8c2NyaXB0PiBlbGVtZW50c1xyXG4gICAgaWYgKHRhZyA9PT0gJ3NjcmlwdCcpIHtcclxuICAgICAgICByZXR1cm4gY29weVNjcmlwdChkb2MsIGVsLmZpcnN0Q2hpbGQpO1xyXG4gICAgfVxyXG4gICAgLy8gU2luZ2xlIGVsZW1lbnRcclxuICAgIGlmIChlbC5jaGlsZE5vZGVzLmxlbmd0aCA9PT0gMSkge1xyXG4gICAgICAgIHJldHVybiBlbC5yZW1vdmVDaGlsZChlbC5maXJzdENoaWxkKTtcclxuICAgIH1cclxuICAgIC8vIFVzZSBhIGRvY3VtZW50IGZyYWdtZW50IGZvciBtdWx0aXBsZSBlbGVtZW50c1xyXG4gICAgY29uc3QgZnJhZyA9IGRvYy5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XHJcbiAgICB3aGlsZSAoZWwuZmlyc3RDaGlsZCkge1xyXG4gICAgICAgIGZyYWcuYXBwZW5kQ2hpbGQoZWwuZmlyc3RDaGlsZCk7XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZnJhZztcclxufVxyXG5cclxuLyoqXHJcbiAqIENvbnZlcnQgYSBzdHJpbmcgaW50byBhIERPTSBub2RlXHJcbiAqXHJcbiAqIEBwYXJhbSB7U3RyaW5nfSBodG1sXHJcbiAqIEBwYXJhbSB7T2JqZWN0fSBvcHRpb25zXHJcbiAqIEBwYXJhbSB7RG9jdW1lbnR9IG9wdGlvbnMuY29udGV4dFxyXG4gKiBAcGFyYW0ge1N0cmluZ30gb3B0aW9ucy50eXBlXHJcbiAqIEBwYXJhbSB7Qm9vbGVhbn0gb3B0aW9ucy5zY3JpcHRzXHJcbiAqIEByZXR1cm4ge0VsZW1lbnR8VGV4dE5vZGV8RG9jdW1lbnRGcmFnbWVudH1cclxuICogQGFwaSBwdWJsaWNcclxuICovXHJcbmV4cG9ydCBkZWZhdWx0IGZ1bmN0aW9uIGRvbWluYXRlKGh0bWwsIHtjb250ZXh0ID0gZG9jdW1lbnQsIHR5cGUgPSAnaHRtbCcsIHNjcmlwdHMgPSB0cnVlfSA9IHt9KSB7XHJcbiAgICAvLyBSZXR1cm4gYW4gWE1MIGVsZW1lbnQgaWYgdGhlIHR5cGUgcGFyYW0gaXMgJ3htbCdcclxuICAgIGlmICh0eXBlLnRvTG93ZXJDYXNlKCkgPT09ICd4bWwnKSB7XHJcbiAgICAgICAgcmV0dXJuIHBhcnNlRG9jdW1lbnQoaHRtbCwgJ3RleHQveG1sJyk7XHJcbiAgICB9XHJcbiAgICAvLyBQYXJzZSB0aGUgSFRNTCBzdHJpbmcgZm9yIGEgdGFnIG5hbWVcclxuICAgIGNvbnN0IG1hdGNoID0gdGFnTmFtZVJlLmV4ZWMoaHRtbCk7XHJcbiAgICAvLyBJZiBubyB0YWcgbmFtZSBleGlzdHMsIHRyZWF0IGl0IGFzIHBsYWluIHRleHRcclxuICAgIGlmICghbWF0Y2gpIHtcclxuICAgICAgICByZXR1cm4gY29udGV4dC5jcmVhdGVUZXh0Tm9kZShodG1sKTtcclxuICAgIH1cclxuICAgIC8vIEdldCB0aGUgdGFnIG5hbWVcclxuICAgIGNvbnN0IHRhZyA9IG1hdGNoWzFdLnRvTG93ZXJDYXNlKCk7XHJcbiAgICAvLyBQYXJzZSB0aGUgSFRNTCBzdHJpbmcgaW50byBhIERPTSBub2RlXHJcbiAgICBjb25zdCBlbCA9IHBhcnNlKGNvbnRleHQsIHRhZywgaHRtbC50cmltKCkpO1xyXG4gICAgLy8gSWYgaXQncyBhIHNjcmlwdCBlbGVtZW50LCByZXR1cm4gaXQgYXMgaXRcclxuICAgIC8vIHNob3VsZCBhbHdheXMgZXhlY3V0ZSByZWdhcmRsZXNzIG9mIHRoZVxyXG4gICAgLy8gYGV4ZWNTY3JpcHRzYCBwYXJhbVxyXG4gICAgaWYgKHRhZyA9PT0gJ3NjcmlwdCcpIHtcclxuICAgICAgICByZXR1cm4gZWw7XHJcbiAgICB9XHJcbiAgICAvLyBJZiBgZXhlY1NjcmlwdHNgIGlzIHRydWUsIHJlcGxhY2UgYWxsIHNjcmlwdFxyXG4gICAgLy8gZWxlbWVudHMgd2l0aCBhIG5ldyBzY3JpcHQgZWxlbWVudCB0byBlbmFibGVcclxuICAgIC8vIGV4ZWN1dGlvbiwgb3RoZXJ3aXNlIHJlbW92ZSB0aGUgc2NyaXB0IGVsZW1lbnRzXHJcbiAgICBjb25zdCBlbGVtZW50cyA9IGVsLnF1ZXJ5U2VsZWN0b3JBbGwoJ3NjcmlwdCcpO1xyXG4gICAgZm9yIChsZXQgaSA9IDAsIGxlbiA9IGVsZW1lbnRzLmxlbmd0aCwgc2NyaXB0LCBwYXJlbnQ7IGkgPCBsZW47IGkrKykge1xyXG4gICAgICAgIHNjcmlwdCA9IGVsZW1lbnRzW2ldO1xyXG4gICAgICAgIHBhcmVudCA9IHNjcmlwdC5wYXJlbnROb2RlO1xyXG4gICAgICAgIGlmIChzY3JpcHRzID09PSBmYWxzZSkge1xyXG4gICAgICAgICAgICBwYXJlbnQucmVtb3ZlQ2hpbGQoc2NyaXB0KTtcclxuICAgICAgICB9IGVsc2Uge1xyXG4gICAgICAgICAgICBwYXJlbnQucmVwbGFjZUNoaWxkKGNvcHlTY3JpcHQoY29udGV4dCwgc2NyaXB0KSwgc2NyaXB0KTtcclxuICAgICAgICB9XHJcbiAgICB9XHJcbiAgICByZXR1cm4gZWw7XHJcbn1cclxuIl19
