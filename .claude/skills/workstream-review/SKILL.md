---
name: workstream-review
description: Invokes a single reviewer agent against an existing handoff payload or diff
tools: []
---

# workstream-review

Orchestrates a standalone code review. Use this when work has already been coded and you want an independent review without running the full build pipeline. Pipeline: **reviewer only**.

---

## When to use

- A PR or diff already exists and needs a review pass.
- The build workstream completed but a secondary review was requested.
- A human wants a cross-family opinion on existing code.

---

## Pipeline steps

### Step 1 — Assemble the handoff payload

If a handoff payload already exists (e.g., from a prior workstream), use it directly. Validate it with the `handoff` skill before proceeding.

If no payload exists, construct a minimal one from the diff or file list provided by the caller:

```json
{
  "workstream": "review",
  "task_description": "[TASK_OR_PR_DESCRIPTION]",
  "plan": null,
  "files_changed": ["[LIST_OF_FILES]"],
  "coder_output": "[DIFF_OR_DESCRIPTION_OF_CHANGES]",
  "verdict": null,
  "verdict_reason": null,
  "reviewer_notes": null,
  "documenter_output": null,
  "cycle_count": 0
}
```

### Step 2 — Reviewer

Invoke a reviewer subagent with the handoff payload.

**Cross-family requirement:** select a model from a different family than the one that produced the code. If the code origin is unknown, prefer a non-Anthropic model (GPT-series via Azure AI Foundry) as the reviewer to maximize independence.

Agent role prompt:

```
You are a code reviewer. Review the changes described in the handoff payload.
Check for correctness, security issues, style violations, and missing tests.
Set `verdict` to one of: approve | request_changes | block.
Set `verdict_reason` to a one-sentence summary.
Populate `reviewer_notes` with specific, actionable feedback organized by file.
Return the updated handoff payload.

Handoff payload: [HANDOFF_PAYLOAD]
```

### Step 3 — Surface findings

Present the reviewer output to the human:

| Field | Value |
|---|---|
| Files reviewed | `files_changed` |
| Verdict | `verdict` |
| Verdict reason | `verdict_reason` |
| Notes | `reviewer_notes` |

This workstream does not proceed to documenter or require human approval — findings are advisory. The human decides what to do next.

---

## Handoff payload schema

```json
{
  "workstream": "review",
  "task_description": "<string>",
  "plan": "<string or null>",
  "files_changed": ["<path>"],
  "coder_output": "<string>",
  "verdict": "approve | request_changes | block | null",
  "verdict_reason": "<string or null>",
  "reviewer_notes": "<string or null>",
  "documenter_output": null,
  "cycle_count": 0
}
```

Validate with the `handoff` skill before invoking the reviewer.
