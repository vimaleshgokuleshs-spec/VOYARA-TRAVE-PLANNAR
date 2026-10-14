import subprocess
import urllib.request
import time
import sys

print("--- Testing Live HTTP Static Server on Windows ---", flush=True)

# Launch python http server
proc = subprocess.Popen(['py', '-m', 'http.server', '8089'], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
time.sleep(1.2)

test_paths = [
    '/',
    '/frontend/index.html',
    '/frontend/css/variables.css',
    '/frontend/css/base.css',
    '/frontend/css/navigation.css',
    '/frontend/css/hero.css',
    '/frontend/css/cards.css',
    '/frontend/css/builder.css',
    '/frontend/css/budget.css',
    '/frontend/css/profile.css',
    '/frontend/css/auth.css',
    '/frontend/css/globe.css',
    '/frontend/js/data.js',
    '/frontend/js/currency.js',
    '/frontend/js/state.js',
    '/frontend/js/animations.js',
    '/frontend/js/globe.js',
    '/frontend/js/views/discover.js',
    '/frontend/js/views/destinations.js',
    '/frontend/js/views/detail.js',
    '/frontend/js/views/builder.js',
    '/frontend/js/views/budget.js',
    '/frontend/js/views/profile.js',
    '/frontend/js/views/auth.js',
    '/frontend/js/router.js',
    '/frontend/js/app.js'
]

success = True
for path in test_paths:
    url = f"http://localhost:8089{path}"
    try:
        resp = urllib.request.urlopen(url, timeout=3)
        code = resp.getcode()
        size = len(resp.read())
        if code == 200:
            print(f"  [HTTP 200 OK] {path} ({size} bytes)", flush=True)
        else:
            print(f"  [ERROR] {path} returned code {code}", flush=True)
            success = False
    except Exception as e:
        print(f"  [ERROR] Failed to fetch {url}: {e}", flush=True)
        success = False

proc.terminate()
proc.kill()

if success:
    print("\nSUCCESS: All 25 live HTTP endpoints served without any issues!", flush=True)
else:
    print("\nFAILED: Server endpoints failed.", flush=True)
    sys.exit(1)
