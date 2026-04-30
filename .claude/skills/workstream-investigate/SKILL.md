---
name: workstream-investigate
description: Orchestrates investigator → human review; produces structured findings, no code changes
tools: []
---

# workstream-investigate

Orchestrates an investigation into a bug, anomaly, or unknown system behavior. The pipeline is: **investigator → human review**.

---

## Hard rules

- **No code changes.** The investigator must not write, edit, or delete any file. Read-only access only. If the investigator attempts to write a file (other than a findings report to a designated scratch path), reject the output.
- **No patches.** The investigator must not propose patches, diffs, or code snippets intended for direct application. It may quote existing code as evidence.
- **Structured findings only.** The investigator's output must conform to the findings schema below. Prose summaries without structure are not acceptable.
- **Hypothesis, not conclusion.** The investigator should distinguish confirmed facts from hypotheses. Label each finding accordingly.

---

## Pipeline steps

### Step 1 — Investigator

Invoke an investigator subagent with the symptom description.

Agent role prompt:

```
You are a software investigator. Your job is to understand a problem, not to fix it.
Rules:
1. Do not write, edit, or delete any file.
2. Do not produce patches or diffs intended for direct application.
3. Distinguish CONFIRMED facts (directly observed in code, logs, or data) from HYPOTHESIS (inferred).
4. Be specific: cite file paths, line numbers, function names, and log entries as evidence.
5. If you cannot confirm a hypothesis, say so explicitly.

Return ONLY a handoff payload with `findings` populated. No prose outside the payload.

Symptom: [SYMPTOM_DESCRIPTION]
```

Model selection: use the highest-capability model available (Opus preferred) since investigation is reasoning-heavy.

### Step 2 — Human review

Present the structured findings to the human in a readable format:

**Summary:** `findings.summary`

**Confirmed facts:**

For each item in `findings.confirmed`:
- File/location: `location`
- Observation: `observation`

**Hypotheses:**

For each item in `findings.hypotheses`:
- Hypothesis: `statement`
- Supporting evidence: `evidence`
- Confidence: `confidence` (high / medium / low)

**Recommended next step:** `findings.recommended_next_step`

This workstream ends here. The human decides whether to open a `/build`, `/refactor`, or `/test` workstream to act on the findings.

---

## Handoff payload schema

```json
{
  "workstream": "investigate",
  "task_description": "<symptom description>",
  "plan": null,
  "files_changed": [],
  "coder_output": null,
  "verdict": null,
  "verdict_reason": null,
  "reviewer_notes": null,
  "documenter_output": null,
  "cycle_count": 0,
  "findings": {
    "summary": "<one paragraph>",
    "confirmed": [
      {
        "location": "<file:line or system component>",
        "observation": "<what was directly observed>"
      }
    ],
    "hypotheses": [
      {
        "statement": "<hypothesis>",
        "evidence": "<supporting observations>",
        "confidence": "high | medium | low"
      }
    ],
    "recommended_next_step": "<workstream or action to take next>"
  }
}
```

Validate with the `handoff` skill before presenting findings to the human.
