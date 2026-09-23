# CartShare — Tests

Automated tests that open the real app in a real (hidden) Chrome browser
and click through it like a user, with two tabs acting as two people.

| File | Purpose |
|---|---|
| `e2e.js` | 70 checks across 18 groups; see `../docs/05-testing-report.md` |
| `screenshots.js` | Regenerates the 12 screenshots + receipt PDF in `../docs/screenshots/` |
| `serve.js` | Tiny web server for `../CartShare`, so Live Server isn't needed |
| `package.json` | Declares the one dependency (Playwright) and the `npm` commands |

## One-time setup (needs Node.js 18 or newer)

```powershell
cd tests
npm install
npx playwright install chromium
```

## Run

```powershell
npm test               # ~15 s — prints PASS/FAIL per check, ends with "70 passed, 0 failed"
npm run screenshots    # ~15 s — rewrites ../docs/screenshots/
```

Results are saved to `test-results/` (`report.txt`, `receipt.pdf`, phone screenshots).

These files are **not** part of the submission. Don't copy `tests/` into
the `CartShare` folder, and don't commit `node_modules/`.
