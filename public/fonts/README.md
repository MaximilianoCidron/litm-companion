# PDF fonts

Drop these six TTF files in this directory. Bundled with the deployment so
PDF export runs without a network fetch at request time.

Required filenames:

- `Inter-Regular.ttf`
- `Inter-Bold.ttf`
- `Spectral-Regular.ttf`
- `Spectral-Italic.ttf`
- `Cinzel-Regular.ttf`
- `Cinzel-Bold.ttf`

All three families are open-source (OFL). Download from
<https://fonts.google.com/>:

- Inter: <https://fonts.google.com/specimen/Inter>
- Spectral: <https://fonts.google.com/specimen/Spectral>
- Cinzel: <https://fonts.google.com/specimen/Cinzel>

The "Get font" → "Download all" zip contains the static `.ttf` files in
sub-folders. Rename to the filenames above.

Combined size: ~500 KB. Commit to the repo so Vercel deploys them.

Until these files exist, `/api/characters/{charId}/export-pdf` will throw at
the first `Font.register` call.
