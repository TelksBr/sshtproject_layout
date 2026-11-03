"""Build-time machine translation of static UI copy only; never run by the app.

Requires an explicit --allow-network invocation. Existing reviewed entries are preserved.
Only literal catalog text is sent; placeholders and product/protocol names are protected.
"""
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
import html
import json
from pathlib import Path
import re
import time
import urllib.error
import urllib.parse
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
FOLDER = ROOT / 'src/i18n/messages'
TARGETS = {'en': 'en', 'es': 'es', 'fr': 'fr', 'de': 'de', 'it': 'it', 'ar': 'ar', 'ru': 'ru', 'hi': 'hi', 'id': 'id', 'sw': 'sw', 'zh-Hans': 'zh-CN', 'zh-Hant': 'zh-TW'}
PROTECTED = re.compile(r'\{p\d+\}|\b(?:SSH T Project|SSH T PROJECT|VT Share|V2Ray|VMess|VLESS|VLess|VTProxy|VTproxy|UUID|SSH|VPN|DNS|IPv[46]|IP|APN|TCP|UDP|HTTP|HTTPS|SOCKS5?|TLS|SSL|SDK|JSON|Android|Windows|iPhone|Smart TV|Telegram|WhatsApp|YouTube|BugHost|Mercado Pago|ROOT|Cloudflare|Google|AdGuard|Quad9|NextDNS|OpenDNS|Device IDs?)\b|R\$\s*\d+(?:[.,]\d+)?|\d{1,2}/\d{1,2}/\d{2,4}')


def protect(text):
    originals = []
    def replace(match):
        originals.append(match.group())
        return f'__SSHTKEEP{len(originals) - 1}__'
    return PROTECTED.sub(replace, text), originals


def restore(text, originals, source):
    text = html.unescape(text).strip()
    for index, original in enumerate(originals):
        token = f'__SSHTKEEP{index}__'
        if token not in text:
            raise ValueError(f'Protected token was changed: {token}')
        text = text.replace(token, original)
    if sorted(re.findall(r'\{p\d+\}', text)) != sorted(re.findall(r'\{p\d+\}', source)):
        raise ValueError('Translation changed interpolation placeholders')
    if not text or '__SSHTKEEP' in text or '@@SSHT' in text:
        raise ValueError('Invalid translation result')
    return text


def request_translation(text, target):
    query = urllib.parse.urlencode({'client': 'gtx', 'sl': 'pt', 'tl': target, 'dt': 't', 'q': text})
    url = 'https://translate.googleapis.com/translate_a/single?' + query
    for attempt in range(4):
        try:
            request = urllib.request.Request(url, headers={'User-Agent': 'SSHT-Static-Catalog-Builder/1.0'})
            with urllib.request.urlopen(request, timeout=30) as response:
                data = json.load(response)
            return ''.join(row[0] for row in data[0] if row[0])
        except (urllib.error.URLError, TimeoutError):
            if attempt == 3:
                raise
            time.sleep(min(2 ** attempt, 8))


def translate_batch(items, target):
    protected = [(key, source, *protect(source)) for key, source in items]
    joined = '\n'.join(f'@@SSHT{index:04d}@@\n{text}' for index, (_, _, text, _) in enumerate(protected))
    result = request_translation(joined, target)
    matches = list(re.finditer(r'@@\s*SSHT(\d{4})\s*@@', result))
    chunks = {int(match.group(1)): result[match.end(): matches[index + 1].start() if index + 1 < len(matches) else len(result)] for index, match in enumerate(matches)}
    translated = {}
    for index, (key, source, text, originals) in enumerate(protected):
        try:
            translated[key] = restore(chunks.get(index, ''), originals, source)
        except ValueError:
            # A phrase made exclusively of protocol/product names needs no translation.
            if not re.search(r'[A-Za-z\u00c0-\u024f]', re.sub(r'__SSHTKEEP\d+__', '', text)):
                translated[key] = source
                continue
            alternate = text
            for token_index in range(len(originals)):
                alternate = alternate.replace(f'__SSHTKEEP{token_index}__', f'ZXQPH{token_index:04d}QXZ')
            alternate_result = request_translation(alternate, target)
            for token_index in range(len(originals)):
                alternate_result = alternate_result.replace(f'ZXQPH{token_index:04d}QXZ', f'__SSHTKEEP{token_index}__')
            try:
                translated[key] = restore(alternate_result, originals, source)
            except ValueError as error:
                raise ValueError(f'{target}/{key}: {error}') from error
    return translated


def translate_locale(locale, target, source):
    path = FOLDER / f'{locale}.json'
    messages = json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
    if any(key.startswith('country.') and key not in messages for key in source):
        raise ValueError(f'{locale}: run npm run i18n:countries to populate ICU country names first')
    missing = [(key, text) for key, text in source.items() if key not in messages]
    batches, current, size = [], [], 0
    for item in missing:
        length = len(item[1]) + 100
        if current and size + length > 2400:
            batches.append(current)
            current, size = [], 0
        current.append(item)
        size += length
    if current:
        batches.append(current)
    for index, batch in enumerate(batches):
        messages.update(translate_batch(batch, target))
        for attempt in range(5):
            try:
                path.write_text(json.dumps(dict(sorted(messages.items())), ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
                break
            except OSError:
                if attempt == 4:
                    raise
                time.sleep(0.25 * (attempt + 1))
        print(f'{locale}: batch {index + 1}/{len(batches)}, {len(messages)}/{len(source)} messages', flush=True)
    return locale


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--allow-network', action='store_true')
    args = parser.parse_args()
    if not args.allow_network:
        parser.error('Pass --allow-network to send static catalog copy to Google Translate.')
    source = json.loads((FOLDER / 'pt-BR.json').read_text(encoding='utf-8'))
    with ThreadPoolExecutor(max_workers=3) as pool:
        futures = [pool.submit(translate_locale, locale, target, source) for locale, target in TARGETS.items()]
        failures = []
        for future in as_completed(futures):
            try:
                print(f'Completed: {future.result()}', flush=True)
            except Exception as error:
                failures.append(str(error))
        if failures:
            raise RuntimeError('; '.join(failures))
