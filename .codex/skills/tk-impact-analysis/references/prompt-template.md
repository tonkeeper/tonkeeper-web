# Prompt Template

Use this when invoking the skill.

```text
Use $tk-impact-analysis to perform QA impact analysis for PLATFORM=Web.
Detect the current branch and compare it with the correct release branch automatically.
If the local run already produced `raw-git-data.txt`, `report.md`, and `test-collection.txt` for this execution date, use those files as the primary input and refine them instead of redoing git discovery.
Use the current source repository for git comparison and `sources/Web/regress.txt` unless I provide SOURCE_REPOSITORY or REGRESS_PATH overrides.
Use `report.md` as the template and mirror the final analysis into REPORT_PATH=<reports/<execution-date>/Web/report.md>, updating that run report in place instead of regenerating the whole report.
Use `test-collection-template.txt` as the TXT template and generate TESTS_COLLECTION_PATH=<reports/<execution-date>/Web/test-collection.txt> with the recommended test subset.

Return:
1. Scope and assumptions.
2. Changed areas and risk summary.
3. Changed files that did not match a known QA area, with probable impact and suggested tests.
4. Existing regress.txt blocks that should be executed, listed as separate rows when there are only a few relevant tests.
5. Missing blocks that should be added to regress.txt.
6. Additional exploratory and edge-case checks based on the diff.
7. Open questions or blockers.

Also ensure the generated TXT test collection includes:
- selected existing regress rows
- unmatched-file test suggestions
- Missing Blocks
- Additional Checks
```

## Examples

```text
Use $tk-impact-analysis to analyze Web impact. Detect the current branch, compare it with the correct release branch automatically, and use the default repo and regress.txt paths.
```

```text
Use $tk-impact-analysis to analyze Web impact. Detect the current branch and compare it with the correct release branch automatically. REGRESS_PATH=/path/to/custom/regress.txt
```
