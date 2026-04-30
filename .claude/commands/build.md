# /build

Build net-new features, add files, or implement new capabilities. This command invokes the `workstream-build` skill, which orchestrates the full build pipeline: planner (for large or complex tasks) → coder → cross-family reviewer → documenter → human approve. No changes are committed until the human explicitly approves the final handoff payload.

## Instructions

When this command is invoked with `$ARGUMENTS`:

1. Take the full text of `$ARGUMENTS` as the task description.
2. Invoke the `workstream-build` skill with that task description.
3. Follow the `workstream-build` skill instructions exactly:
   - Determine whether the planner is needed (>3 files or >1hr estimate).
   - Run planner → coder → reviewer → documenter in sequence.
   - Validate the handoff payload with the `handoff` skill before each agent invocation.
   - Enforce the cross-family reviewer requirement.
   - If the reviewer returns `verdict=block`, halt and surface the reason to the human.
   - If the reviewer returns `verdict=request_changes`, return to the coder (max 2 cycles).
4. Do not mark the workstream complete until the human explicitly approves.
