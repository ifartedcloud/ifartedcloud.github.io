---
name: workstream-refactor
description: Orchestrates coder → reviewer → (documenter if API change) → human approve for refactors
tools: []
---

# workstream-refactor

Orchestrates refactoring work. The pipeline is: **coder → reviewer → documenter (conditional) → human approve**.

Hard rules are enforced at each stage. A behavioral change detected by the reviewer is a pipeline-stopper.

---

## Hard rules

- **No behavioral changes.** The refactor must be functionally equivalent. If the reviewer returns `verdict=block` citing a behavioral change, the pipeline stops and restarts as `workstream-build` with the full planner-included pipeline.
- **No new features.** If the task description implies adding capability rather than restructuring existing code, reject it and ask the human to route through `/build` instead.
- **Scope creep check.** If the coder's output touches files not in the original `files_changed` list, surface a warning and pause for human confirmation before continuing.

---

## Pipeline steps

### Step 1 — Coder

Invoke a coder subagent with the task description. Emphasize the refactor constraints in the prompt.

Agent role prompt:

```
You are a senior software engineer performing a refactor.
Rules:
1. Do not change observable behavior — inputs and outputs must remain identical.
2. Do not add new features or change public APIs unless explicitly listed in the task.
3. Do not modify test files unless the test was itself wrong (document why if you do).
4. Keep the diff minimal. Prefer targeted changes over wholesale rewrites.

Return a handoff payload with `coder_output` populated and `files_changed` listing every modified file.

Task: [TASK_DESCRIPTION]
```

Model selection: Sonnet or the project default.

### Step 2 — Reviewer

Invoke a reviewer subagent with the handoff payload.

**Cross-family requirement:** reviewer must be from a different model family than the coder.

Agent role prompt:

```
You are a code reviewer specializing in refactor safety.
Primary concern: did the refactor change observable behavior?
Secondary concerns: correctness, style, test coverage gaps.

Set `verdict` to one of: approve | request_changes | block.
If you set `verdict=block`, you MUST set `verdict_reason` to start with "BEHAVIORAL CHANGE:" followed by a description.
Populate `reviewer_notes` with file-by-file findings.
Return the updated handoff payload.

Handoff payload: [HANDOFF_PAYLOAD]
```

**If `verdict=block` with a BEHAVIORAL CHANGE reason:** stop this pipeline. Inform the human that the change is too broad for a refactor and must be restarted as `workstream-build`. Do not proceed.

If `verdict=request_changes` for non-behavioral reasons: return to coder (Step 1) with reviewer notes. Limit to 2 cycles before escalating to human.

### Step 3 — Documenter (conditional)

Invoke the documenter only if the refactor changed a public API signature, module interface, or exported type. If the change is purely internal, skip this step.

Agent role prompt:

```
You are a technical writer. The refactor in the handoff payload changed a public API or interface.
Update the relevant documentation (README, API docs, docstrings, TSDoc).
Do not modify source code. Populate `documenter_output` and return the payload.

Handoff payload: [HANDOFF_PAYLOAD]
```

### Step 4 — Human approve

Present the summary table:

| Field | Value |
|---|---|
| Task | `task_description` |
| Files changed | `files_changed` |
| Verdict | `verdict` |
| Verdict reason | `verdict_reason` |
| API change | yes / no |
| Docs updated | yes / no |

Pause. Wait for explicit human approval before marking complete.

---

## Handoff payload schema

```json
{
  "workstream": "refactor",
  "task_description": "<string>",
  "plan": null,
  "files_changed": ["<path>"],
  "coder_output": "<string>",
  "verdict": "approve | request_changes | block | null",
  "verdict_reason": "<string or null>",
  "reviewer_notes": "<string or null>",
  "documenter_output": "<string or null>",
  "cycle_count": 0,
  "api_changed": false
}
```

Validate with the `handoff` skill before each agent invocation.
