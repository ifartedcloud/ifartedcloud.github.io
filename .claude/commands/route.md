# /route

Classify an ambiguous task and dispatch it to the correct workstream. Use this when you are unsure which workstream applies, or when you want the router agent to make the call rather than guessing yourself. The command invokes the `route-decision` skill, which runs a router agent to classify the task into one of the seven workstreams (build, review, refactor, test, document, investigate, operate), then automatically dispatches to the matching workstream skill.

## Instructions

When this command is invoked with `$ARGUMENTS`:

1. Take the full text of `$ARGUMENTS` as the task description.
2. Invoke the `route-decision` skill with that task description.
3. Follow the `route-decision` skill instructions exactly — run the router agent, parse its output, surface the classification decision to the human, and dispatch to the identified workstream skill.
4. If the router returns `confidence=low` or non-empty `ambiguities`, surface those to the human and ask for clarification before dispatching. Do not proceed without clarification.
5. If the human overrides the router's classification, accept the override and dispatch to the human-specified workstream skill instead.
