# Caveat (subset)

`caveat-600-accent.woff2` is the Google Fonts **Caveat** SemiBold (600) face,
latin subset, further subsetted with `pyftsubset` to the 34 glyphs used by the
handwritten accent on the tortilla landing page — 51 KB down to 5 KB.

It is **self-hosted deliberately**. The production CSP sets
`font-src 'self' data:` (deploy/nginx.conf), so a `fonts.gstatic.com` URL is
blocked outright and the accent would silently fall back to the body font.

## Regenerating

If the accent copy changes, the subset must be rebuilt or missing characters
render as blanks. The `--text` argument is the concatenation of the three
`tt_hero_accent` strings in `src/i18n/translations.js`:

```
pyftsubset caveat-latin.woff2 \
  --text="<sq string><en string><de string>" \
  --flavor=woff2 --layout-features='' --no-hinting --desubroutinize \
  --output-file=caveat-600-accent.woff2
```

Licensed under the SIL Open Font License 1.1 — see `OFL.txt`.
