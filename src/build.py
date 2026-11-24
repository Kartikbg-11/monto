#!/usr/bin/env python3
"""Assemble the Zonexa Phase I application into a single self-contained HTML file."""
import os
import sys

import os
PARTS_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'parts')
OUT_FILE = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'zonexa.html')

ORDER = [
    '01_styles.css',
    '02_core.js',
    '03_ui.js',
    '04_auth.js',
    '05_seed.js',
    '06_user_m1_3.js',
    '07_user_m4_8.js',
    '08_user_m9_12.js',
    '09_user_m13_17.js',
    '10_admin_m18_28.js',
    '11_admin_m29_37.js',
    '12_bootstrap.js',
]

def main():
    chunks = []
    for fname in ORDER:
        path = os.path.join(PARTS_DIR, fname)
        if not os.path.exists(path):
            print(f'ERROR: missing part file {path}', file=sys.stderr)
            sys.exit(1)
        with open(path, 'r', encoding='utf-8') as f:
            chunks.append((fname, f.read()))

    css = next(c for n, c in chunks if n == '01_styles.css')
    js_parts = [(n, c) for n, c in chunks if n != '01_styles.css']

    html = []
    html.append('<!DOCTYPE html>')
    html.append('<html lang="en">')
    html.append('<head>')
    html.append('<meta charset="UTF-8">')
    html.append('<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">')
    html.append('<meta name="description" content="Zonexa Phase I - Industrial & Commercial Real Estate Platform">')
    html.append('<meta name="robots" content="noindex">')
    html.append('<title>Zonexa — Industrial & Commercial Real Estate Platform</title>')
    html.append(f'<style>\n{css}\n</style>')
    html.append('</head>')
    html.append('<body>')
    html.append('<div id="app"><div class="splash-wrap"><div class="splash-logo">Z</div>'
                '<div class="splash-name">ZONEXA</div><div class="splash-tag">Loading…</div>'
                '<div class="splash-loading"><div></div></div></div></div>')
    html.append('<div id="toasts"></div>')
    html.append('<script>')
    # wrap each part in an IIFE-safe script with a file marker comment
    for name, content in js_parts:
        html.append(f'\n/* ===== PART: {name} ===== */\n')
        html.append(content)
        html.append('\n/* ===== END: ' + name + ' ===== */\n')
    html.append('</script>')
    html.append('</body>')
    html.append('</html>')

    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(html))
    size_kb = os.path.getsize(OUT_FILE) / 1024
    print(f'✓ Assembled {OUT_FILE} ({size_kb:.1f} KB)')
    print(f'  Parts: {len(js_parts)} JS + 1 CSS')

if __name__ == '__main__':
    main()
