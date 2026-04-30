# /investigate

Diagnose a bug, anomaly, or unknown system behavior. This command invokes the `workstream-investigate` skill, which orchestrates: investigator → human review. The investigator produces structured findings only — no code changes, no patches, no diffs intended for direct application. Use this command to understand a problem before deciding how to fix it.

## Instructions

When this command is invoked with `$ARGUMENTS`:

1. Take the full text of `$ARGUMENTS` as the symptom description.
2. Invoke the `workstream-investigate` skill with that symptom description.
3. Follow the `workstream-investigate` skill instructions exactly:
   - Run the investigator with read-only access and no-changes constraints.
   - The investigator must distinguish CONFIRMED facts from HYPOTHESIS in its findings.
   - Validate the handoff payload with the `handoff` skill before presenting findings.
   - Present the structured findings to the human: summary, confirmed facts, hypotheses with confidence levels, recommended next step.
4. This workstream ends at human review. The human decides whether to follow up with `/build`, `/refactor`, `/test`, or another command.
5. If the human asks the investigator to apply a fix during this workstream, decline and suggest `/build` or `/refactor` instead.
