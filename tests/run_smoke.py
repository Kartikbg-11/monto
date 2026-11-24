#!/usr/bin/env python3
"""
Headless smoke-test runner for the Zonexa app.

Loads zonexa.html in headless Chromium via Playwright and runs the in-browser
smoke test (tests/smoke_test.js). Prints a pass/fail summary and exits non-zero
on any failure.

Prerequisites (one-time):
    pip install playwright
    python -m playwright install chromium

Usage:
    python3 tests/run_smoke.py
"""
import json
import sys
from pathlib import Path

try:
    from playwright.sync_api import sync_playwright
except ImportError:
    print('ERROR: playwright is not installed.')
    print('       Run:  pip install playwright && python -m playwright install chromium')
    sys.exit(2)

ROOT       = Path(__file__).resolve().parent.parent
HTML_PATH  = ROOT / 'zonexa.html'
SMOKE_JS   = (ROOT / 'tests' / 'smoke_test.js').read_text()

if not HTML_PATH.exists():
    print(f'ERROR: {HTML_PATH} not found. Run build.py first (Ctrl+Shift+B).')
    sys.exit(2)

with sync_playwright() as p:
    browser = p.chromium.launch(headless=True)
    page    = browser.new_page(viewport={'width': 390, 'height': 844})

    logs = []
    page.on('pageerror', lambda err: logs.append(f'[pageerror] {err}'))

    page.goto(HTML_PATH.as_uri(), wait_until='domcontentloaded')
    page.wait_for_timeout(800)

    raw  = page.evaluate(SMOKE_JS)
    data = json.loads(raw)

    browser.close()

    print('=' * 56)
    print(' ZONEXA SMOKE TEST')
    print('=' * 56)
    for r in data['results']:
        mark = 'PASS' if r['ok'] else 'FAIL'
        line = f"  [{mark}] {r['name']}"
        if not r['ok'] and r.get('detail'):
            line += f"  -> {r['detail']}"
        print(line)

    s = data['summary']
    print('-' * 56)
    print(f"  Total: {s['total']}   Passed: {s['passed']}   Failed: {s['failed']}")
    print('=' * 56)

    if logs:
        print('\nPage errors:')
        for l in logs[:10]:
            print(f'  {l}')

    sys.exit(0 if s['failed'] == 0 else 1)
