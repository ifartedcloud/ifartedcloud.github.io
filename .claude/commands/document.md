# /document

Write or update documentation without touching source code. This command invokes the `workstream-document` skill, which orchestrates: documenter → self-review → human approve. Only documentation files may be created or modified (*.md, *.rst, docstrings, JSDoc/TSDoc). Any attempt to modify production source logic is a pipeline-stopper.

## Instructions

When this command is invoked with `$ARGUMENTS`:

1. Take the full text of `$ARGUMENTS` as the task description.
2. Invoke the `workstream-document` skill with that task description.
3. Follow the `workstream-document` skill instructions exactly:
   - Run the documenter with the no-code-changes constraint enforced.
   - After the documenter returns, scan `files_changed` for non-documentation entries. Halt and warn the human if any are found.
   - Validate the handoff payload with the `handoff` skill before the self-reviewer.
   - Run the self-reviewer to check accuracy and quality.
   - If the self-reviewer returns `verdict=request_changes`, return to the documenter (max 2 cycles).
4. Do not mark the workstream complete until the human explicitly approves.
