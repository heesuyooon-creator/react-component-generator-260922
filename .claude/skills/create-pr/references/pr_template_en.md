# PR Body Template (English / open-source projects)

Use this template when the repository is an **English-based open-source project** — signals include an English `README.md`/`CONTRIBUTING.md`, an existing `.github/PULL_REQUEST_TEMPLATE.md` written in English, English commit history/issue-and-PR conventions, or a public repo clearly maintained for an international audience. Fill in `<...>` based only on the actual diff and commit history — never fabricate content.

```markdown
## Summary
- <Key change 1: what changed and why>
- <Key change 2 (if applicable)>
- <Key change 3 (if applicable)>

## Test plan
- [ ] <Tests/build/lint that were run or should be run>
- [ ] <Manual verification performed, or scenarios that still need checking>
```

## Writing rules

- `Summary` should only list changes actually visible in the diff. Do not claim performance improvements or effects without measured evidence.
- In `Test plan`, check off (`- [x]`) items you actually verified; leave unchecked (`- [ ]`) items that weren't run or need manual confirmation by a reviewer. If no verification method exists at all, say so plainly instead of inventing one.
- Keep the section headers (`## Summary`, `## Test plan`) as-is. Additional sections (e.g. `## Related Issues`) can be appended below them if useful.
- Append the attribution line specified in the conversation's system-reminder at the very end of the body (it is not included in this template — add it at skill execution time).
