# CLAUDE.md — ifarted.cloud

Claude Code-specific extensions to the cross-tool `AGENTS.md` brief. Read `AGENTS.md` first — this file only covers what is Claude Code-specific.

## What ifarted.cloud is

A fun, irreverent single-page site. Currently: landing page with logo, tagline, and interactive fart sounds. The site is intentionally simple but built on a proper stack so it can grow.

## SPA

Vite 6 + React 19 + TypeScript, deployed to GitHub Pages via GitHub Actions.

```
src/
├── App.tsx              Root component
├── main.tsx             Entry point (React 19 createRoot)
├── pages/Home.tsx       Landing page — logo + tagline + click interaction
├── styles/global.css    All styles
├── utils/               Client-side utilities (audio synthesis, etc.)
└── vite-env.d.ts        Vite type reference
```

**Run locally:** `npm run dev` — starts Vite dev server at `http://localhost:5173/`
**Build:** `npm run build` — outputs to `dist/`. Runs TypeScript type check. Run before every commit touching `src/`.
**Deploy:** automatic on push to `main` via `.github/workflows/deploy.yml`
**Live:** `https://ifarted.cloud/`

## Runtime structure

```
.claude/
├── agents/           Subagent definitions (YAML frontmatter + procedure)
├── skills/           Skill folders (SKILL.md)
├── commands/         Slash command definitions
├── hooks/            Lifecycle hook scripts
├── logs/             Operate/token/session logs
└── settings.json     Claude Code settings (agent teams flag + hooks)
```

## Subagents

| Agent | Model | Purpose |
|---|---|---|
| router | claude-sonnet-4-6 | Classify task into workstream |
| planner | claude-sonnet-4-6 | Write implementation plan for non-trivial tasks |
| coder | claude-opus-4-7 | Implement code |
| reviewer | (different family than coder) | Review — cross-family requirement enforced |
| documenter | claude-sonnet-4-6 | Write docs, READMEs |
| test-writer | claude-sonnet-4-6 | Write tests |
| security-reviewer | claude-opus-4-7 | Security audit |
| investigator | claude-opus-4-7 | Root cause analysis |
| operator | claude-opus-4-7 | Infra/deploy changes |

## Hard rules

1. Reviewer model family ≠ coder model family. Non-negotiable.
2. Max 2 revision rounds before human escalation.
3. Touching `.env`, `secrets/`, or `permissions/` auto-upgrades to operate workstream.
4. Stop and summarize at 70–80% of token budget.
5. No silent additions: call out new deps/files/commands in rationale.
6. Subagents do not inherit parent skills — preload in frontmatter.

## Style rules

1. No emojis in repo content unless user explicitly requests it.
2. No filler phrases. Get to work.
3. No hype words: powerful, seamless, robust, leverage, unlock, game-changing.
4. Keep it fun where the site content warrants it (this is a fart site).
5. Don't invent tool or model names. Search before assuming an unfamiliar name is a typo.

## File conventions

| Content type | Location |
|---|---|
| Page components | `src/pages/` |
| Reusable components | `src/components/` |
| Utilities | `src/utils/` |
| Global styles | `src/styles/global.css` |
| Static assets | `public/` |

## When to ask vs. when to act

Ask before:
- Creating a new top-level folder.
- Renaming or restructuring existing files.
- Adding new external npm packages.
- Changing the deployment workflow.

Act without asking:
- Implementing features in existing pages/utils.
- Fixing TypeScript errors and lint issues.
- Updating styles for existing components.
- Adding `CHANGELOG.md` entries and bumping version when shipping meaningful changes.

## How to extend

**Add a page:** create `src/pages/<Name>.tsx`, add a route in `App.tsx`.

**Add a utility:** create `src/utils/<name>.ts` and import where needed.

**Add a component:** create `src/components/<Name>.tsx`.

**Add a workstream agent:** create `.claude/agents/<name>.md`, update AGENTS.md table.

**Add a hook:** create `.claude/hooks/<name>.sh`, `chmod +x` it, register in `.claude/settings.json`.
