---
name: route-decision
description: Invokes a router agent to classify a task, then dispatches to the matching workstream skill
tools: []
---

# route-decision

Classifies an incoming task and dispatches it to the correct workstream skill. This is the entry point for `/route` and for any situation where the right workstream is not obvious.

---

## Pipeline steps

### Step 1 — Router agent

Invoke a router subagent with the raw task description.

Agent role prompt:

```
You are a task router. Classify the task below into exactly one workstream.
Valid workstreams: build | review | refactor | test | document | investigate | operate

Classification rules:
- build: net-new feature, new file, new module, new endpoint, anything additive
- review: review an existing diff, PR, or completed change
- refactor: restructure existing code without changing behavior
- test: write or fix tests; no production code changes
- document: write or update documentation; no code changes
- investigate: diagnose a bug, anomaly, or unknown behavior; no changes
- operate: infrastructure, deployment, migration, secrets, access, any running-system change

Return ONLY a JSON object:
{
  "workstream": "<one of the valid workstreams>",
  "confidence": "high | medium | low",
  "reason": "<one sentence explaining the classification>",
  "ambiguities": ["<any aspect of the task that made classification uncertain>"]
}

Task: [TASK_DESCRIPTION]
```

Model selection: any capable model; Sonnet is sufficient for routing.

### Step 2 — Parse router output

Extract `workstream`, `confidence`, `reason`, and `ambiguities` from the router's JSON response.

**If `confidence=low` or `ambiguities` is non-empty:** surface the ambiguities to the human and ask for clarification before dispatching. Do not guess.

**If `confidence=medium` or `confidence=high`:** proceed to dispatch.

### Step 3 — Dispatch

Invoke the matching workstream skill with the original task description as the argument:

| Router output | Skill to invoke |
|---|---|
| `build` | `workstream-build` |
| `review` | `workstream-review` |
| `refactor` | `workstream-refactor` |
| `test` | `workstream-test` |
| `document` | `workstream-document` |
| `investigate` | `workstream-investigate` |
| `operate` | `workstream-operate` |

Before dispatching, inform the human of the classification decision:

> Routing to **[WORKSTREAM]** — [REASON]

If the human disagrees with the classification, they can override by naming the workstream explicitly. Accept the override without argument.

### Step 4 — Hand off

Pass the original task description and the router's JSON output to the target workstream skill. The workstream skill takes it from there.

---

## Router output schema

```json
{
  "workstream": "build | review | refactor | test | document | investigate | operate",
  "confidence": "high | medium | low",
  "reason": "<string>",
  "ambiguities": ["<string>"]
}
```
