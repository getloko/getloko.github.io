# LoKO Documentation

Official documentation website for [LoKO](https://github.com/getloko/loko) - Local Kubernetes Oasis.

Live site: https://getloko.github.io/

## About

This repository contains the source for the LoKO documentation website, built with:
- [Astro](https://astro.build/)
- [Starlight](https://starlight.astro.build/)

## Prerequisites

- Node.js 20+
- npm

## Development

```bash
# Clone the repository
git clone https://github.com/getloko/getloko.github.io.git
cd getloko.github.io

# Install dependencies
npm ci

# Start local dev server
npm run dev
```

Open the URL shown by Astro (typically `http://localhost:4321`).

## Build

```bash
# Build static site
npm run build

# Preview production build locally
npm run preview
```

Build output is generated in `dist/`.

## Deployment

Documentation is deployed to GitHub Pages via GitHub Actions.

Workflow file:
- `.github/workflows/deploy-astro.yml`

High-level flow:
1. Install dependencies
2. Build Astro site
3. Upload `dist/` artifact
4. Deploy to GitHub Pages

## Project Structure

```text
getloko.github.io/
├── src/
│   ├── content/docs/        # Primary docs source (Starlight content)
│   ├── components/          # Astro components
│   ├── styles/              # Site styles
│   └── assets/              # Images and other assets
├── docs/                    # Legacy/compat docs copies
├── public/                  # Static public assets
├── astro.config.mjs         # Astro + Starlight configuration
├── package.json
└── .github/workflows/deploy-astro.yml
```

## Contributing

1. Create a branch
2. Make documentation changes
3. Run `npm run build`
4. Submit a PR

## License

MIT License - see [LICENSE](https://github.com/getloko/loko/blob/main/LICENSE) for details.
