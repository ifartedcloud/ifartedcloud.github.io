---
name: workstream-build
description: Orchestrates planner → coder → reviewer → documenter → human approve for net-new work
tools: []
---

# workstream-build

Orchestrates the full build pipeline for net-new features, multi-file changes, or any work estimated at more than one hour. The pipeline is: **planner (conditional) → coder → reviewer → documenter → human approve**.

---

## When to invoke the planner

Invoke the planner subagent before coding if ANY of the following is true:

- The change touches more than 3 files.
- The work estimate is greater than 1 hour.
- The task introduces a new module, service boundary, or public API.
- The coder agent explicitly requests a plan before proceeding.

If none of the above apply, skip the planner and pass the raw task description directly to the coder as the handoff payload.

---

## Pipeline steps

### Step 1 — Planner (conditional)

Invoke a planner subagent with the raw task description. The planner must return a handoff payload (see schema below). Do not proceed until the planner returns a valid payload.

Agent role prompt:

```
You are a technical planner. Given the task below, produce a structured plan.
Return ONLY a JSON object matching the handoff payload schema. No prose outside the JSON.

Task: [TASK_DESCRIPTION]
```

Model selection: use the highest-capability model available (Opus preferred; fall back to Sonnet if Opus is unavailable or rate-limited).

### Step 2 — Coder

Invoke a coder subagent with the handoff payload from Step 1 (or the raw task if the planner was skipped).

Agent role prompt:

```
You are a senior software engineer. Implement the task described in the handoff payload.
Follow the plan exactly. Do not refactor unrelated code. Do not change tests.
Return an updated handoff payload with `coder_output` populated.

Handoff payload: [HANDOFF_PAYLOAD]
```

Model selection: Sonnet or the project default.

### Step 3 — Reviewer

Invoke a reviewer subagent with the coder's updated handoff payload.

**Cross-family requirement:** the reviewer must be from a different model family than the coder. If the coder used an Anthropic model, use a non-Anthropic model for review (e.g., GPT-series via Azure AI Foundry), and vice versa.

Agent role prompt:

```
You are a code reviewer. Review the changes described in the handoff payload.
Check for correctness, security issues, style violations, and missing tests.
Set `verdict` to one of: approve | request_changes | block.
Set `verdict_reason` to a one-sentence summary.
Populate `reviewer_notes` with specific, actionable feedback.
Return the updated handoff payload.

Handoff payload: [HANDOFF_PAYLOAD]
```

If verdict is `block`, stop the pipeline and surface the `verdict_reason` to the human. Do not proceed to documenter.

If verdict is `request_changes`, return the payload to the coder (Step 2) with reviewer notes appended. Limit to 2 coder-reviewer cycles before escalating to human.

### Step 4 — Documenter

Invoke a documenter subagent only when the reviewer returns verdict `approve`.

Agent role prompt:

```
You are a technical writer. Update or create documentation for the changes in the handoff payload.
Only touch documentation files (*.md, docstrings, JSDoc, TSDoc, etc.). Do not change source code.
Populate `documenter_output` in the handoff payload and return it.

Handoff payload: [HANDOFF_PAYLOAD]
```

### Step 5 — Human approve

Present the final handoff payload to the human with a summary table:

| Field | Value |
|---|---|
| Task | `task_description` |
| Files changed | `files_changed` |
| Verdict | `verdict` |
| Reviewer notes | `reviewer_notes` |
| Docs updated | yes / no |

Pause and wait for explicit human approval before marking the workstream complete. Do not merge, push, or apply further changes until approval is received.

---

## Handoff payload schema

```json
{
  "workstream": "build",
  "task_description": "<string>",
  "plan": "<string or null>",
  "files_changed": ["<path>"],
  "coder_output": "<string>",
  "verdict": "approve | request_changes | block | null",
  "verdict_reason": "<string or null>",
  "reviewer_notes": "<string or null>",
  "documenter_output": "<string or null>",
  "cycle_count": 0
}
```

Validate the payload with the `handoff` skill before passing it to each agent.
