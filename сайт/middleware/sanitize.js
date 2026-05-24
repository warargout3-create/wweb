/**
 * HTML sanitization to prevent XSS attacks.
 * Uses the sanitize-html library for robust protection.
 * Allows safe HTML tags (p, h1-h6, ul, ol, li, img, a, strong, em, br, table, etc.)
 * but strips dangerous elements like script, iframe, embed, object, and event handlers.
 */
const sanitizeHtmlLib = require('sanitize-html');

const SANITIZE_OPTIONS = {
  allowedTags: [
    'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
    'p', 'br', 'hr',
    'ul', 'ol', 'li',
    'a', 'img',
    'strong', 'em', 'b', 'i', 'u', 's', 'del', 'ins', 'sub', 'sup',
    'blockquote', 'pre', 'code', 'kbd',
    'table', 'thead', 'tbody', 'tr', 'td', 'th',
    'div', 'span', 'figure', 'figcaption',
    'abbr', 'cite', 'dfn', 'small', 'mark',
    'dl', 'dt', 'dd'
  ],
  allowedAttributes: {
    a: ['href', 'title', 'target', 'rel'],
    img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
    abbr: ['title'],
    '*': ['class', 'id', 'style']
  },
  allowedSchemes: ['http', 'https', 'mailto'],
  allowedSchemesAppliedToAttributes: ['href', 'src'],
  transformTags: {
    a: function(tagName, attribs) {
      // Добавляем rel="noopener noreferrer" для внешних ссылок
      return {
        tagName: 'a',
        attribs: {
          ...attribs,
          rel: 'noopener noreferrer',
          target: '_blank'
        }
      };
    }
  },
  // Разрешаем определённые CSS-стили
  allowedStyles: {
    '*': {
      'text-align': [/^left$/, /^right$/, /^center$/],
      'color': [/^#(0x)?[0-9a-fA-F]+$/i, /^rgb\(\s*(\d{1,3})\s*,\s*(\d{1,3})\s*,\s*(\d{1,3})\s*\)$/],
      'font-size': [/^\d+(px|em|rem)%?$/]
    }
  },
  // Максимальная глубина вложенности
  nestingLimit: 20
};

function sanitizeHtml(html) {
  if (!html) return '';
  return sanitizeHtmlLib(html, SANITIZE_OPTIONS);
}

module.exports = { sanitizeHtml };
