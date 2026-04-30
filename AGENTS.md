# AGENTS.md — ifarted.cloud

Cross-tool agent brief. Read this first. For Claude Code-specific extensions, see `CLAUDE.md`.

## What this repo is

The source for [ifarted.cloud](https://ifarted.cloud/) — a Vite + React 19 + TypeScript single-page site deployed to GitHub Pages. The site is intentionally simple and fun: a landing page with a logo, tagline, and interactive fart sounds. More features will come.

## Stack

| Layer | Technology |
|---|---|
| Framework | Vite 6 + React 19 + TypeScript |
| Styling | Plain CSS (`src/styles/global.css`) |
| Deployment | GitHub Actions → GitHub Pages |
| Domain | ifarted.cloud (CNAME in `public/CNAME`) |

## Repo structure

```
src/
├── App.tsx              Root component
├── main.tsx             Entry point (React createRoot)
├── pages/Home.tsx       Landing page
├── styles/global.css    All styles
├── utils/               Client-side utilities (audio, etc.)
└── vite-env.d.ts        Vite type reference
public/
├── logo.jpeg            Site logo
└── CNAME                Custom domain
.github/workflows/
└── deploy.yml           GitHub Pages deploy workflow
.claude/
├── agents/              Subagent definitions
├── skills/              Skill folders
├── commands/            Slash command definitions
├── hooks/               Lifecycle hook scripts
├── logs/                Session and token logs (gitignored)
└── settings.json        Claude Code settings
```

## Subagents

| Agent | Model | Purpose |
|---|---|---|
| router | claude-sonnet-4-6 | Classify task into workstream |
| planner | claude-sonnet-4-6 | Write implementation plan |
| coder | claude-opus-4-7 | Implement code |
| reviewer | claude-opus-4-7 | Review — must be different model family than coder |
| documenter | claude-sonnet-4-6 | Write docs |
| test-writer | claude-sonnet-4-6 | Write tests |
| security-reviewer | claude-opus-4-7 | Security audit |
| investigator | claude-opus-4-7 | Root cause analysis |
| operator | claude-opus-4-7 | Infra/deploy changes (requires human approval) |

## Hard rules

1. Reviewer model family ≠ coder model family. Non-negotiable.
2. Max 2 revision rounds before human escalation.
3. No production code changes from the test-writer or documenter agents.
4. Operate workstream requires security-reviewer approval AND human APPROVE before execution.
5. No silent new dependencies — all new packages must be flagged.
