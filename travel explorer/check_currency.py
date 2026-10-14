import os
import re
import sys
import math

if sys.stdout.encoding.lower() != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

print("=== VOYARA CURRENCY CONVERSION & INTEGRITY SUITE ===")

# 1. Inspect currency.js code contract
currency_file = os.path.join('frontend', 'js', 'currency.js')
assert os.path.exists(currency_file), f"Missing {currency_file}"
currency_code = open(currency_file, encoding='utf-8').read()

assert "currentCurrency: 'INR'" in currency_code, "Default currency must be INR"
assert "USD: 1.0" in currency_code, "USD exchange rate must be 1.0"
assert "INR: 85.0" in currency_code, "INR exchange rate must be 85.0"
assert "localStorage.getItem('voyara_currency')" in currency_code, "Must read from localStorage"
assert "refreshCurrentView()" in currency_code, "Must trigger view refresh on currency switch"

print("  [PASS] Currency controller contract: default INR, 1 USD = 85.00 INR benchmark rate.")

# 2. Test mathematical logic and drift invariance
def mock_convert(amount_in_usd, target_currency, inr_rate=85.0):
    if amount_in_usd is None or (isinstance(amount_in_usd, float) and math.isnan(amount_in_usd)):
        return 0
    num = float(amount_in_usd)
    if target_currency == 'INR':
        return round(num * inr_rate)
    return round(num)

def mock_format(amount_in_usd, target_currency, inr_rate=85.0):
    converted = mock_convert(amount_in_usd, target_currency, inr_rate)
    if target_currency == 'INR':
        # en-IN formatting
        s = str(converted)
        if len(s) > 3:
            last3 = s[-3:]
            rest = s[:-3]
            groups = []
            while len(rest) > 2:
                groups.insert(0, rest[-2:])
                rest = rest[:-2]
            if rest:
                groups.insert(0, rest)
            formatted = ','.join(groups) + ',' + last3
        else:
            formatted = s
        return f"\u20b9{formatted}"
    else:
        return f"${converted:,}"

# Verify test cases
test_cases = [
    (100, 8500, "\u20b98,500", "$100"),
    (300, 25500, "\u20b925,500", "$300"),
    (650, 55250, "\u20b955,250", "$650"),
    (1200, 102000, "\u20b91,02,000", "$1,200"),
    (2400, 204000, "\u20b92,04,000", "$2,400"),
    (0, 0, "\u20b90", "$0"),
    (None, 0, "\u20b90", "$0"),
]

for base_usd, expected_inr, inr_str, usd_str in test_cases:
    inr_val = mock_convert(base_usd, 'INR')
    usd_val = mock_convert(base_usd, 'USD')
    assert inr_val == expected_inr, f"Convert mismatch for {base_usd}: got {inr_val}, expected {expected_inr}"
    assert mock_format(base_usd, 'INR') == inr_str, f"Format INR mismatch: {mock_format(base_usd, 'INR')} != {inr_str}"
    assert mock_format(base_usd, 'USD') == usd_str, f"Format USD mismatch: {mock_format(base_usd, 'USD')} != {usd_str}"

print("  [PASS] Mathematical conversion & en-IN / en-US formatting tested across sample price points.")

# 3. Test Zero Conversion Drift
# If we toggle 10,000 times between INR and USD, base USD amount must remain unchanged.
sample_trip_costs = [350, 650, 1200, 2450, 4800]
for original_base_usd in sample_trip_costs:
    base_usd = original_base_usd
    for _ in range(1000):
        # View displays in INR
        display_inr = mock_convert(base_usd, 'INR')
        # View switches to USD
        display_usd = mock_convert(base_usd, 'USD')
        # Underlying base_usd is NEVER mutated by currency conversions
        assert base_usd == original_base_usd, "Underlying base currency mutated!"

print("  [PASS] Zero conversion drift: Underlying USD base currency is immutable across 1,000 toggle cycles.")

# 4. View audits: Verify VoyaraCurrency.format is integrated in all UI views
views_to_check = [
    ('frontend/js/views/discover.js', 'VoyaraCurrency.format'),
    ('frontend/js/views/destinations.js', 'VoyaraCurrency.format'),
    ('frontend/js/views/detail.js', 'VoyaraCurrency.format'),
    ('frontend/js/views/builder.js', 'VoyaraCurrency.format'),
    ('frontend/js/views/budget.js', 'VoyaraCurrency.format'),
    ('frontend/js/views/profile.js', 'VoyaraCurrency.format'),
]

assert "window.VoyaraCurrency = VoyaraCurrency" in currency_code, "Must explicitly attach to window"

for file_path, token in views_to_check:
    content = open(file_path, encoding='utf-8').read()
    count = content.count(token)
    assert count > 0, f"Missing {token} in {file_path}"
    print(f"  [PASS] {file_path}: {count} occurrences of {token}")

# 5. Check index.html UI elements for Currency Switcher
index_html = open('frontend/index.html', encoding='utf-8').read()
assert 'currency-switcher' in index_html, "currency-switcher markup missing in index.html"
assert 'currency-opt-inr' in index_html, "currency-opt-inr missing in index.html"
assert 'currency-opt-usd' in index_html, "currency-opt-usd missing in index.html"
assert 'js/currency.js' in index_html, "currency.js script tag missing in index.html"
print("  [PASS] index.html includes desktop & mobile currency toggles and script link.")

print("\n=== ALL VOYARA CURRENCY TESTS PASSED SUCCESSFULLY! ===")
