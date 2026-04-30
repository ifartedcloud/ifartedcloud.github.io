---
name: workstream-document
description: Orchestrates documenter → self-review → human approve; zero code changes
tools: []
---

# workstream-document

Orchestrates standalone documentation work. The pipeline is: **documenter → self-review → human approve**.

---

## Hard rules

- **No code changes.** The documenter must only create or modify documentation files: `*.md`, `*.rst`, `*.txt`, `*.html` in a `docs/` tree, docstrings in source files (limited to comment blocks — no logic changes), and JSDoc/TSDoc comments. If the documenter's output contains modifications to source logic, reject the payload and surface a warning.
- **Accuracy check required.** The self-review step must verify that the documentation accurately reflects the current code. If accuracy cannot be confirmed from the information in the payload, the self-reviewer must flag it rather than guess.

---

## Pipeline steps

### Step 1 — Documenter

Invoke a documenter subagent with the task description.

Agent role prompt:

```
You are a technical writer.
Rules:
1. Only create or modify documentation files (*.md, *.rst, docstrings, JSDoc/TSDoc).
2. Do not modify production source code logic.
3. Write for the intended audience stated in the task. If not stated, assume a developer audience.
4. Use plain, direct language. No marketing language. No filler.
5. Cite or reference the source code sections your documentation describes.

Return a handoff payload with `documenter_output` summarizing what was written/changed and `files_changed` listing only doc files.

Task: [TASK_DESCRIPTION]
```

Model selection: Sonnet or the project default.

After the documenter returns, scan `files_changed` for any non-documentation entries. If found, halt and warn the human.

### Step 2 — Self-review

Invoke a second subagent as a self-reviewer. This agent reviews the documentation output — it does not write code or documentation. Using the same model family as the documenter is acceptable here because this is a quality/accuracy check, not an independence check.

Agent role prompt:

```
You are a documentation reviewer. Review the documentation changes in the handoff payload.
Check:
1. Are any production source logic files modified? If yes, set verdict=block.
2. Is the documentation accurate given the code references or descriptions in the payload?
3. Is the language clear, direct, and free of filler or marketing language?
4. Are there gaps (missing parameters, missing return values, unclear steps)?

Set `verdict` to: approve | request_changes | block.
Populate `reviewer_notes` with specific findings.
Return the updated handoff payload.

Handoff payload: [HANDOFF_PAYLOAD]
```

If `verdict=request_changes`: return to documenter (Step 1) with notes. Limit to 2 cycles.

### Step 3 — Human approve

Present the summary table:

| Field | Value |
|---|---|
| Task | `task_description` |
| Docs changed | `files_changed` |
| Verdict | `verdict` |
| Notes | `reviewer_notes` |

Pause. Wait for explicit human approval.

---

## Handoff payload schema

```json
{
  "workstream": "document",
  "task_description": "<string>",
  "plan": null,
  "files_changed": ["<doc-path>"],
  "coder_output": null,
  "verdict": "approve | request_changes | block | null",
  "verdict_reason": "<string or null>",
  "reviewer_notes": "<string or null>",
  "documenter_output": "<string>",
  "cycle_count": 0
}
```

Validate with the `handoff` skill before each agent invocation.
