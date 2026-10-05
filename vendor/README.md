# Vendored upstream projects

Source imported from three open-source projects. These folders are **not part of
the app build**: `tsconfig.json` excludes `vendor/`, ESLint ignores it, and
nothing in `src/` imports from here yet. They are the raw material for the UGC
product, so each one keeps its upstream layout to make it easy to compare with
and pull updates from its original repository.

| Folder | Upstream | Commit | License | What it gives us |
| --- | --- | --- | --- | --- |
| `open-ai-ugc/` | [Anil-matcha/Open-AI-UGC](https://github.com/Anil-matcha/Open-AI-UGC) | `3229488` | MIT | The dashboard UI the product is modelled on: workspace/composer, gallery, credits, Stripe billing, MuAPI video generation (Veo 3.1, Seedance 2, Grok Video) with webhook job pipeline. Next.js + NextAuth + Prisma. |
| `open-higgsfield-ai/` | [ClabstreamTeam/Open-Higgsfield-AI](https://github.com/ClabstreamTeam/Open-Higgsfield-AI) | `44788b5` | **No LICENSE file** (see below) | Higgsfield-style studio: image, video, cinema and lip-sync studios (`packages/studio`), model catalogue (`models_dump.json`), Next.js shell and API routes, Electron/Vite desktop build. |
| `ugc-factory/` | [charlesdove977/UGC-Factory](https://github.com/charlesdove977/UGC-Factory) | `e5ac1b1` | MIT | The generation pipeline as a Claude Code skill: persona interview, consistent creator/product "Elements", keyframes, Seedance 2.0 clips, ffmpeg stitching, plus 15 genre style guides and UGC ad frameworks (`skill/`). |

## Left out on import

- `.git` history (each folder is a snapshot of the commit above)
- Demo media only used by upstream READMEs: `open-ai-ugc/*.mp4`,
  `open-higgsfield-ai/docs/assets/{demo.mp4,generated_example.webp,studio_demo.webp}`

## Licensing note: open-higgsfield-ai

The upstream repository has no top-level LICENSE file, and its README describes
it as an internal Clabstream tool. Only `packages/studio/package.json` declares
`"license": "MIT"`. Without a license, the rest of that code is all rights
reserved by default. Confirm the terms with the authors (or trace it back to an
MIT-licensed original) before shipping any of it in the product.
