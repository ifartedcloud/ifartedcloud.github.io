# /test

Write or fix tests for existing code. This command invokes the `workstream-test` skill, which orchestrates: test-writer → reviewer → human approve. No production code may be modified during this workstream. If the task description does not specify what to cover, the command will ask for clarification before proceeding.

## Instructions

When this command is invoked with `$ARGUMENTS`:

1. Take the full text of `$ARGUMENTS` as the task description.
2. If `$ARGUMENTS` does not specify what to cover (which function, module, edge case, or regression scenario), ask the human for clarification before invoking the skill.
3. Invoke the `workstream-test` skill with that task description.
4. Follow the `workstream-test` skill instructions exactly:
   - Run the test-writer with the no-production-code-changes constraint.
   - After the test-writer returns, immediately scan `files_changed` for non-test paths. Halt and warn the human if any are found.
   - Validate the handoff payload with the `handoff` skill before the reviewer.
   - If the reviewer returns `verdict=block` (production files modified), halt and surface the finding.
   - If the reviewer returns `verdict=request_changes`, return to the test-writer (max 2 cycles).
5. Do not mark the workstream complete until the human explicitly approves.
