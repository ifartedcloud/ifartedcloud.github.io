# /refactor

Restructure existing code without changing observable behavior. This command invokes the `workstream-refactor` skill, which orchestrates: coder → cross-family reviewer → documenter (only if a public API changed) → human approve. If the reviewer returns `verdict=block` citing a behavioral change, the pipeline stops and must be restarted as `/build`.

## Instructions

When this command is invoked with `$ARGUMENTS`:

1. Take the full text of `$ARGUMENTS` as the task description.
2. Before invoking the skill, confirm the task is a pure refactor. If `$ARGUMENTS` describes adding new capability rather than restructuring existing code, inform the human and suggest `/build` instead.
3. Invoke the `workstream-refactor` skill with that task description.
4. Follow the `workstream-refactor` skill instructions exactly:
   - Run coder with refactor constraints enforced.
   - Validate the handoff payload with the `handoff` skill before each agent.
   - Enforce the cross-family reviewer requirement.
   - If the reviewer returns `verdict=block` with a BEHAVIORAL CHANGE reason, halt and tell the human to restart via `/build`.
   - If the reviewer returns `verdict=request_changes` for non-behavioral reasons, return to coder (max 2 cycles).
   - Run the documenter only if `api_changed=true`.
5. Do not mark the workstream complete until the human explicitly approves.
