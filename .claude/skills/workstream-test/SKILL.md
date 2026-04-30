---
name: workstream-test
description: Orchestrates test-writer → reviewer → human approve; zero production code changes
tools: []
---

# workstream-test

Orchestrates test authoring for existing production code. The pipeline is: **test-writer → reviewer → human approve**.

---

## Hard rules

- **No production code changes.** The test-writer must not modify any file outside the designated test directories (e.g., `tests/`, `__tests__/`, `*.test.*`, `*.spec.*`). If the test-writer's output includes changes to production code, reject the payload and surface a warning to the human.
- **No mocking of behavior that should be tested.** If the reviewer detects that mocks are hiding the real behavior under test, it must flag this in `reviewer_notes` and set verdict to `request_changes`.
- **Coverage intent.** The task description should specify what to cover (function, module, edge cases, regression scenario). If it does not, ask the human for clarification before invoking the test-writer.

---

## Pipeline steps

### Step 1 — Test-writer

Invoke a test-writer subagent with the task description.

Agent role prompt:

```
You are a test engineer. Write tests for the code described in the task.
Rules:
1. Only create or modify files in test directories (tests/, __tests__/, *.test.*, *.spec.*).
2. Do not modify production source files under any circumstances.
3. Cover the happy path, at least two edge cases, and one error/failure case.
4. Use the existing test framework and conventions already in the project.
5. Return a handoff payload with `coder_output` describing what was written and `files_changed` listing only test files.

Task: [TASK_DESCRIPTION]
```

Model selection: Sonnet or the project default.

Immediately after the test-writer returns, scan `files_changed` for any non-test-path entries. If found, halt and warn the human.

### Step 2 — Reviewer

Invoke a reviewer subagent with the handoff payload.

Agent role prompt:

```
You are a test reviewer. Review the tests in the handoff payload.
Check:
1. Are any production files modified? If yes, set verdict=block immediately.
2. Do the tests actually test the right behavior (not just mock everything)?
3. Are edge cases and failure cases present?
4. Do the tests follow the project's existing patterns?

Set `verdict` to: approve | request_changes | block.
Populate `reviewer_notes` with specific findings.
Return the updated handoff payload.

Handoff payload: [HANDOFF_PAYLOAD]
```

If `verdict=block` (production files modified): halt, surface the finding to the human, do not proceed.

If `verdict=request_changes`: return to test-writer (Step 1) with notes. Limit to 2 cycles.

### Step 3 — Human approve

Present the summary table:

| Field | Value |
|---|---|
| Task | `task_description` |
| Test files written | `files_changed` |
| Verdict | `verdict` |
| Notes | `reviewer_notes` |

Pause. Wait for explicit human approval.

---

## Handoff payload schema

```json
{
  "workstream": "test",
  "task_description": "<string>",
  "plan": null,
  "files_changed": ["<test-path>"],
  "coder_output": "<string>",
  "verdict": "approve | request_changes | block | null",
  "verdict_reason": "<string or null>",
  "reviewer_notes": "<string or null>",
  "documenter_output": null,
  "cycle_count": 0
}
```

Validate with the `handoff` skill before each agent invocation.
