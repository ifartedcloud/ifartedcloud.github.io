---
name: handoff
description: Validates handoff payload schema between agents; ensures required fields are present before passing to the next agent
tools: []
---

# handoff

Utility skill. Call this before passing a handoff payload to any agent in any workstream. It checks that the payload is well-formed and that required fields are present. If validation fails, it surfaces the specific missing or malformed fields and halts the pipeline until corrected.

---

## Required fields (all workstreams)

Every handoff payload must contain the following fields, regardless of workstream:

| Field | Type | Allowed values |
|---|---|---|
| `workstream` | string | `build`, `review`, `refactor`, `test`, `document`, `investigate`, `operate` |
| `task_description` | string | Non-empty |
| `files_changed` | array | May be empty; elements must be strings |
| `cycle_count` | integer | >= 0 |

---

## Conditional required fields

These fields become required once the corresponding pipeline step has run:

| Field | Required after |
|---|---|
| `coder_output` | coder step completes |
| `verdict` | reviewer step completes |
| `verdict_reason` | reviewer sets verdict=block |
| `reviewer_notes` | reviewer step completes |
| `documenter_output` | documenter step completes |
| `operator_plan` | operator step completes (operate workstream only) |
| `log_record` | documenter step completes (operate workstream only) |
| `findings` | investigator step completes (investigate workstream only) |

---

## Validation procedure

When invoked, perform these checks in order:

1. **Parse check.** Confirm the payload is valid JSON. If not, halt: "Handoff payload is not valid JSON. Fix before continuing."

2. **Workstream field check.** Confirm `workstream` is present and is one of the allowed values. If not, halt with the specific error.

3. **Required field check.** Confirm all required fields from the table above are present and non-null. Report all missing fields at once, not one at a time.

4. **Conditional field check.** Based on which pipeline steps have already run (inferred from which fields are populated), confirm that the expected conditional fields are present. Report any that are missing.

5. **Cycle count check.** If `cycle_count` >= 3, halt and surface a warning: "This payload has cycled [N] times. Escalate to human before continuing."

6. **Verdict consistency check.** If `verdict=block` and `verdict_reason` is null or empty, halt: "verdict=block requires a non-empty verdict_reason."

---

## On validation pass

Return the payload unchanged. Inform the caller: "Payload validated. Proceeding."

## On validation failure

Do not pass the payload to the next agent. List every validation error found. Wait for the pipeline orchestrator to correct the payload before re-validating.

---

## Usage pattern

Call the `handoff` skill at each agent boundary:

```
[before invoking agent N]
validate payload with handoff skill
→ if pass: invoke agent N
→ if fail: fix errors, re-validate, then invoke agent N
```
