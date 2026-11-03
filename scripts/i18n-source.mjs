import ts from 'typescript';
import { readdirSync, readFileSync } from 'node:fs';
import { join, relative } from 'node:path';
import { createHash } from 'node:crypto';

const displayProperties = new Set(['title', 'label', 'description', 'message', 'text', 'question', 'answer', 'content', 'subtitle', 'hint', 'placeholder', 'alt', 'aria-label', 'aria-description', 'fallbackTitle', 'fallbackMessage', 'price', 'features', 'steps', 'tips', 'instructions', 'reason']);
const technicalProperties = new Set(['className', 'style', 'href', 'src', 'url', 'link', 'id', 'key', 'event', 'eventName', 'method', 'mode', 'type', 'status', 'code', 'host', 'username', 'password', 'uuid', 'fontFamily', 'border', 'background', 'color', 'transform', 'transition', 'boxShadow', 'filter', 'animation', 'mask', 'WebkitMask', 'display', 'accept', 'htmlFor', 'name', 'target', 'rel', 'role', 'autoComplete', 'inputMode', 'data-testid']);
const technicalWords = new Set(['SSH', 'VPN', 'IP', 'IPv4', 'IPv6', 'UUID', 'V2Ray', 'VMess', 'VLess', 'VLESS', 'VTProxy', 'VTproxy', 'DNS', 'APN', 'TCP', 'UDP', 'HTTP', 'HTTPS', 'SOCKS', 'SOCKS5', 'TLS', 'SSL', 'SDK', 'JSON', 'Android', 'Windows', 'Wi-Fi', 'YouTube', 'Telegram', 'WhatsApp', 'Pix', 'Email', 'E-mail', 'Hotspot', 'Proxy', 'SSH T PROJECT', 'SSH T Project', 'T PROJECT', 'N/A', 'ms', 'MB', 'GB', 'KB', 'Mbps', 'Kbps', 'KB/s', 'MB/s', 'v2ray', 'ssh', 'auto', 'true', 'false', 'null', 'undefined', 'unknown', 'default', 'success', 'error', 'info', 'warning', 'online', 'offline', 'active', 'pending', 'completed', 'failed', 'cancelled', 'connected', 'disconnected', 'connecting']);
const messageCalls = /^(showToast|showSuccess|showError|showInfo|showWarning|setError|set.*Error|set.*Message|setStatusMessage|setStatusText|Error|alert|confirm)$/;
const internalCalls = /^(console\.|recordDebugLog|logPayment|logEvent|paymentLogger\.|debugLogger\.|getStorageItem|setStorageItem|removeStorageItem|localStorage\.|sessionStorage\.|JSON\.|document\.|window\.addEventListener|window\.removeEventListener|fetch|openExternalUrl|onNativeEvent|onDTunnelEvent)/;

export function sourceFiles(root = 'src') {
  return readdirSync(root, { withFileTypes: true }).flatMap(entry => {
    const path = join(root, entry.name);
    if (entry.isDirectory()) return ['i18n'].includes(entry.name) ? [] : sourceFiles(path);
    return /\.tsx?$/.test(path) && !/\.d\.ts$/.test(path) && !/countryNames\.ts$/.test(path) ? [path] : [];
  });
}

export function messageId(text) { return 'm' + createHash('sha256').update(text).digest('hex').slice(0, 10); }

function jsxValue(raw) {
  const lines = raw.split(/\r\n|\n|\r/);
  let last = 0;
  for (let index = 0; index < lines.length; index++) if (/[^ \t]/.test(lines[index])) last = index;
  return lines.map((line, index) => {
    let text = line.replace(/\t/g, ' ');
    if (index !== 0) text = text.replace(/^ +/, '');
    if (index !== lines.length - 1) text = text.replace(/ +$/, '');
    return text && index !== last ? text + ' ' : text;
  }).join('');
}

function propertyName(node, source) {
  return node.name && (ts.isIdentifier(node.name) || ts.isStringLiteral(node.name)) ? node.name.text : node.name?.getText(source);
}

function technical(text) {
  const plain = text.replace(/\{p\d+\}/g, '').trim();
  const words = plain.replace(/R\$/g, '').match(/[\p{L}\p{N}]+/gu) || [];
  if (!/[\p{L}]/u.test(plain.replace(/R\$/g, ''))) return true;
  if (!/[\p{L}]/u.test(plain) || words.length && words.every(word => technicalWords.has(word))) return true;
  return !/[\p{L}]/u.test(text) || technicalWords.has(text.trim()) || ['s', 'm', 'd', 'v', 'px', 'configs', 'UUID V2Ray', 'UUID V2Ray:', 'V2RAY', 'SSH:', 'V2Ray:', 'VTProxy:', 'UUID:', 'ID:', 'MB /', '- SSH T Project'].includes(text.trim()) ||
    /^\d[\d., ]*\s*(?:KB|MB|GB|KB\/s|MB\/s|Mbps|Kbps)\b/.test(text) ||
    /^use[A-Z].*(?:Provider|Context)/.test(text) ||
    /^(?:https?:|mailto:|tel:|data:|blob:|#[0-9a-f]{3,8}\b|var\(|rgba?\(|linear-gradient|translate|scale\(|rotate\(|calc\(|@)/i.test(text) ||
    /^(?:[\w.-]+@|[a-z0-9_.:/-]+\.[a-z]{2,}(?:\b|\/))/i.test(text) ||
    /(?:\b(?:px|py|mx|my|pt|pb|pl|pr|gap|w|h|text|bg|border|rounded|flex|grid|min-w|max-w|shadow|top|bottom|left|right|translate-x|translate-y)-|\b(?:flex|absolute|relative|fixed|sticky|block|hidden|overflow-hidden|noopener|noreferrer)\b)/.test(text) ||
    /^\{(?!p\d+\})|^\[\s*["'{]|[{};]\s*\n|<\/?[a-z]|^\(prefers-/i.test(text) ||
    /^(?:application\/|text\/|image\/|audio\/|video\/)/.test(text);
}

export function findMessages(file, content = readFileSync(file, 'utf8')) {
  if (file.replace(/\\/g, '/').endsWith('/paymentLogger.ts')) return [];
  const source = ts.createSourceFile(file, content, ts.ScriptTarget.Latest, true, file.endsWith('.tsx') ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const messages = [];
  function visit(node) {
    const isJSX = ts.isJsxText(node);
    const literal = ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node);
    const template = ts.isTemplateExpression(node);
    if (isJSX || literal || template) {
      let text = isJSX ? jsxValue(node.text) : literal ? node.text : node.head.text + node.templateSpans.map((span, index) => `{p${index}}` + span.literal.text).join('');
      if (text.trim() && !technical(text.trim())) {
        let display = isJSX;
        let ignored = false;
        let functionNode;
        let topLevel = true;
        for (let parent = node.parent; parent && !ts.isSourceFile(parent); parent = parent.parent) {
          if (ts.isBinaryExpression(parent) && [ts.SyntaxKind.EqualsEqualsToken, ts.SyntaxKind.EqualsEqualsEqualsToken, ts.SyntaxKind.ExclamationEqualsToken, ts.SyntaxKind.ExclamationEqualsEqualsToken].includes(parent.operatorToken.kind)) { ignored = true; break; }
          if (ts.isCaseClause(parent) && parent.expression === node || ts.isEnumMember(parent) || ts.isElementAccessExpression(parent) && parent.argumentExpression === node) { ignored = true; break; }
          if (ts.isTypeNode(parent) || ts.isImportDeclaration(parent) || ts.isExportDeclaration(parent)) { ignored = true; break; }
          if (ts.isFunctionLike(parent)) { functionNode ||= parent; topLevel = false; }
          if (ts.isJsxAttribute(parent)) {
            const name = propertyName(parent, source);
            if (technicalProperties.has(name)) { ignored = true; break; }
            if (displayProperties.has(name)) display = true;
          }
          if (ts.isPropertyAssignment(parent)) {
            const name = propertyName(parent, source);
            if (parent.name === node || technicalProperties.has(name)) { ignored = true; break; }
            if (displayProperties.has(name)) display = true;
          }
          if (ts.isCallExpression(parent) || ts.isNewExpression(parent)) {
            const called = parent.expression.getText(source);
            if ((['t', 'm', 'tr', 'message'].includes(called) && parent.arguments[0] === node) || /\.(?:includes|startsWith|endsWith|match|replace|test|querySelector(?:All)?|matchMedia|open|createElement|setAttribute|getAttribute|setProperty)$/.test(called) || internalCalls.test(called)) { ignored = true; break; }
            if (messageCalls.test(called.split('.').at(-1))) display = true;
          }
        }
        const plainWords = ['agora', 'dia', 'dias', 'hora', 'horas', 'minuto', 'minutos', 'segundo', 'segundos', 'ano', 'anos', 'sim'];
        const prose = plainWords.includes(text.trim()) || (/\s/.test(text.trim()) || /[À-ÿ]/.test(text) || /^[A-Z][a-z]+$/.test(text.trim())) && /[\p{L}]{2}/u.test(text) && !/^[a-z_./:@#=-]+$/.test(text.trim());
        if (!ignored && (display || prose)) {
          const normalized = text.trim();
          const position = source.getLineAndCharacterOfPosition(node.getStart(source));
          messages.push({ id: messageId(normalized), text: normalized, raw: text, file: relative('.', file).replace(/\\/g, '/'), line: position.line + 1, start: node.getStart(source), end: node.getEnd(), kind: isJSX ? 'jsx' : template ? 'template' : 'literal', expressions: template ? node.templateSpans.map(span => span.expression.getText(source)) : [], topLevel, functionNode, node, source });
          if (template) return; // Spans are parameters, never translation source.
        }
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return messages;
}

if (process.argv[1]?.endsWith('i18n-source.mjs')) {
  const all = sourceFiles().flatMap(file => findMessages(file));
  const unique = new Map(all.map(item => [item.id, item.text]));
  console.log(`${all.length} occurrences; ${unique.size} unique messages; ${[...unique.values()].join('').length} source characters`);
  for (const item of all) console.log(`${item.file}:${item.line} ${item.id} ${item.kind} ${JSON.stringify(item.text)}`);
  if (all.length && process.argv.includes('--check')) process.exitCode = 1;
}
