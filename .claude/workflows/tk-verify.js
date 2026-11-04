export const meta = {
    name: 'tk-verify',
    description:
        'QA-verify a TK ticket PR with Playwright on its preview: plan (for human approval) or run (specs with video, STE report)',
    whenToUse:
        'After tk-implement and the human visual check. args: {ticket, mode: "plan" | "run", baseUrl?}. Run "plan" first; "run" needs the approved plan.',
    phases: [
        { title: 'Context', detail: 'PR, labels, preview URL, worktree on the PR branch' },
        { title: 'Plan', detail: 'feasibility + cases + transactions, for approval' },
        { title: 'Run', detail: 'write/update the spec, run it with video, max 3 runs' },
        { title: 'Report', detail: 'STE report, commit the spec to the PR branch' }
    ]
};

const MAX_RUNS = 3;

const ticket = String((args && args.ticket) || '')
    .trim()
    .toUpperCase();
const mode = (args && args.mode) || 'plan';
if (!/^TK-\d+$/.test(ticket) || !['plan', 'run'].includes(mode)) {
    throw new Error(
        'Pass args: {"ticket": "TK-1234", "mode": "plan" | "run", "baseUrl"?: "https://…"}'
    );
}
const STE = 'Write every text field in STE (.claude/skills/ste-writing/SKILL.md).';
const SKILL = '.claude/skills/tk-qa-verify-web/SKILL.md';

const CONTEXT = {
    type: 'object',
    properties: {
        ok: { type: 'boolean' },
        problem: { type: 'string' },
        pr: { type: 'number' },
        prUrl: { type: 'string' },
        branch: { type: 'string' },
        previewUrl: { type: 'string' },
        visual: { type: 'boolean', description: 'Linear issue has label "visual" or a Figma link' },
        visualApproved: { type: 'boolean', description: 'PR has the label visual-ok' },
        worktree: { type: 'string' },
        mainRepo: { type: 'string' },
        changedFiles: { type: 'array', items: { type: 'string' } },
        planApproved: { type: 'boolean' }
    },
    required: ['ok', 'worktree', 'mainRepo']
};
const PLAN = {
    type: 'object',
    properties: {
        verdict: {
            type: 'string',
            enum: ['Automatable', 'Automatable with mocks', 'Partial', 'Manual only']
        },
        estimate: { type: 'string', enum: ['S', 'M', 'L'] },
        planFile: { type: 'string' },
        markdown: { type: 'string', description: 'the full plan.md text' },
        transactions: { type: 'number' }
    },
    required: ['verdict', 'estimate', 'planFile', 'markdown', 'transactions']
};
const RUN = {
    type: 'object',
    properties: {
        runs: { type: 'number' },
        specFile: { type: 'string' },
        cases: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    title: { type: 'string' },
                    route: { type: 'string' },
                    expected: { type: 'string' },
                    interaction: { type: 'string' },
                    readBack: { type: 'string' },
                    result: { type: 'string', enum: ['PASS', 'FAIL', 'NOT RUN'] },
                    video: { type: 'string' },
                    evidence: { type: 'string' },
                    note: { type: 'string' }
                },
                required: ['id', 'title', 'result']
            }
        },
        notCovered: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    why: { type: 'string' },
                    byHand: { type: 'string' }
                },
                required: ['id', 'why']
            }
        },
        findings: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    scope: { type: 'string', enum: ['ticket', 'adjacent'] },
                    kind: { type: 'string', enum: ['failure', 'bug', 'question'] },
                    text: { type: 'string' },
                    evidence: { type: 'string' }
                },
                required: ['scope', 'kind', 'text']
            }
        },
        stability: {
            type: 'string',
            description: 'page errors / crashes caught, or "clean" with counts'
        },
        spent: { type: 'string', description: 'transactions signed: id, asset, amount; or "none"' }
    },
    required: ['runs', 'specFile', 'cases', 'notCovered', 'findings', 'stability', 'spent']
};

// ---------- Context ----------
phase('Context');
const ctx = await agent(
    `Collect the verification context for Linear ticket ${ticket}. Never touch the main checkout's working tree.
1. MAIN = \`git rev-parse --show-toplevel\`. WT = absolute path of "$MAIN/../tonkeeper-web-agent".
2. Find the open PR whose head branch contains "${ticket.toLowerCase()}": \`gh pr list --state open --json number,url,headRefName,labels --search "${ticket}"\`. None → ok=false.
3. visualApproved = the PR has the label "visual-ok". changedFiles = \`gh pr diff <n> --name-only\`.
4. previewUrl = ${
        args && args.baseUrl
            ? `"${args.baseUrl}"`
            : 'the latest Cloudflare preview URL from the PR comments (gh pr view <n> --json comments)'
    }.
5. visual = the Linear issue ${ticket} (Linear MCP get_issue, read-only) has the label "visual" or a Figma link.
6. Worktree: \`git -C "$MAIN" fetch origin\`. If WT does not exist: \`git -C "$MAIN" worktree add --detach "$WT" origin/<branch>\`. If \`git -C "$WT" status --porcelain\` prints anything: ok=false. Else check out <branch> in WT tracking origin and fast-forward it, then \`yarn install --immutable\` in WT.
7. planApproved = "$MAIN/tests/playwright/qa/out/${ticket}/plan.json" exists and has a non-empty "approvedAt" (read it with \`node -e\`, print only that field).
Return the fields.`,
    { label: 'context', phase: 'Context', model: 'haiku', effort: 'low', schema: CONTEXT }
);
if (!ctx || !ctx.ok)
    return {
        status: 'blocked',
        ticket,
        report: `BLOCKED: ${(ctx && ctx.problem) || 'no context'}`
    };
if (ctx.visual && !ctx.visualApproved) {
    return {
        status: 'waiting-visual',
        ticket,
        report: `WAITING: ${ticket} has a visual change. A human checks the preview first.\n\n1. Open ${
            ctx.previewUrl || 'the PR preview'
        } and compare it with Figma.\n2. Add the label \`visual-ok\` to PR #${
            ctx.pr
        }, or comment what is wrong.\n3. Run tk-verify again.`
    };
}
if (!ctx.previewUrl) {
    return {
        status: 'blocked',
        ticket,
        report: `BLOCKED: no preview URL on PR #${ctx.pr}. Pass args.baseUrl.`
    };
}
const wt = ctx.worktree;
const qaHome = `${ctx.mainRepo}/tests/playwright/qa`;
const common = `Ticket ${ticket}, PR #${ctx.pr} (${ctx.prUrl}), branch ${
    ctx.branch
}, worktree ${wt}, preview ${ctx.previewUrl}.
QA home (plans, spend log, saved wallets; shared by all worktrees): ${qaHome}.
Read ${SKILL} and follow it, including every reference it tells you to read for this phase.
Changed files:
${(ctx.changedFiles || []).join('\n')}`;

// ---------- Plan ----------
if (mode === 'plan') {
    phase('Plan');
    const plan = await agent(
        `${common}

Do Phase A (feasibility) and Phase B (plan) of the skill. Do not run tests.
Input: the QA cases at ${wt}/tests/playwright/qa/cases/${ticket}.json, the Linear issue (read-only), the PR diff (\`gh pr diff ${ctx.pr}\`).
Write ${qaHome}/out/${ticket}/plan.json (format: skill, "Plan file"; leave "approvedAt" out) and ${qaHome}/out/${ticket}/plan.md (the plan in STE, from references/report-template.md, section "Plan").
Return the verdict, the estimate, the plan file path, the plan.md text, and the number of transactions that sign. ${STE}`,
        { label: 'plan', phase: 'Plan', model: 'sonnet', schema: PLAN }
    );
    if (!plan)
        return { status: 'blocked', ticket, report: 'BLOCKED: the planner returned no result.' };
    return {
        status: 'plan-ready',
        ticket,
        planFile: plan.planFile,
        transactions: plan.transactions,
        report: `${plan.markdown}\n\n---\nNext: a human approves, trims or extends this plan. On approval, set "approvedAt" in ${plan.planFile}, then run tk-verify ${ticket} with mode "run".`
    };
}

// ---------- Run ----------
if (!ctx.planApproved) {
    return {
        status: 'blocked',
        ticket,
        report: `BLOCKED: the plan for ${ticket} is not approved. Run mode "plan", approve it, then run again.`
    };
}
phase('Run');
const run = await agent(
    `${common}

Do Phase C (execute) of the skill. The approved plan is ${qaHome}/out/${ticket}/plan.json — run its cases only.
1. Write or update ${wt}/tests/playwright/qa/specs/${ticket.toLowerCase()}.spec.ts (one test per case, title starts with "${ticket} <case id>").
2. From ${wt}/tests/playwright run: \`QA_TICKET=${ticket} QA_BASE_URL=${
        ctx.previewUrl
    } yarn qa --grep ${ticket}\`, then \`node qa/summary.mjs ${ticket}\`. Read only the summary, not the raw results.
3. For each failure decide: spec problem (selector, wait, route) → fix the spec and run again; app problem → keep the failing test and record a finding. Never edit application code. Max ${MAX_RUNS} runs in total.
4. Never sign outside signPlanned(). Never print or read secrets.
Return the case ledger, what is not covered, findings, the stability sweep and what was spent. ${STE}`,
    { label: 'qa run', phase: 'Run', model: 'sonnet', schema: RUN }
);
if (!run) return { status: 'blocked', ticket, report: 'BLOCKED: the QA agent returned no result.' };

// ---------- Report ----------
phase('Report');
const failed = run.cases.filter(c => c.result === 'FAIL');
const notRun = run.cases.filter(c => c.result === 'NOT RUN');
const verdict = failed.length
    ? `FAIL: ${failed.length} of ${run.cases.length} cases fail.`
    : notRun.length || run.notCovered.length
    ? `PASS with gaps: ${run.cases.length - notRun.length} cases pass, ${
          notRun.length + run.notCovered.length
      } not covered.`
    : `PASS: all ${run.cases.length} cases pass.`;
const cell = s =>
    String(s || '—')
        .replace(/\|/g, '\\|')
        .replace(/\n/g, ' ');
const ticketFindings = run.findings.filter(f => f.scope === 'ticket');
const adjacent = run.findings.filter(f => f.scope === 'adjacent');
const report = `# ${ticket} — QA report

## Verdict
**${verdict}**

## Environment
| Item | Value |
|---|---|
| PR | ${ctx.prUrl} |
| App | ${ctx.previewUrl} |
| Browser | Desktop Chrome (Playwright) |
| Wallets | A = multichain, B = legacy TON, C = empty battery (optional) |
| Runs | ${run.runs} |
| Spent | ${run.spent} |

## What was checked
| Case | Route | Expected | Interaction | Read back | Result | Video |
|---|---|---|---|---|---|---|
${run.cases
    .map(
        c =>
            `| ${cell(c.id)} ${cell(c.title)} | ${cell(c.route)} | ${cell(c.expected)} | ${cell(
                c.interaction
            )} | ${cell(c.readBack)} | **${c.result}** | ${cell(c.video || 'no recording')} |`
    )
    .join('\n')}

## Not covered
${
    run.notCovered.length
        ? run.notCovered
              .map(n => `- **${n.id}**: ${n.why}${n.byHand ? ` By hand: ${n.byHand}` : ''}`)
              .join('\n')
        : 'None.'
}

## Findings in the ticket
${
    ticketFindings.length
        ? ticketFindings
              .map(
                  f =>
                      `- ${f.kind.toUpperCase()}: ${f.text}${
                          f.evidence ? ` Evidence: ${f.evidence}` : ''
                      }`
              )
              .join('\n')
        : 'None.'
}

## Adjacent findings
${
    adjacent.length
        ? adjacent
              .map(
                  f =>
                      `- ${f.kind.toUpperCase()}: ${f.text}${
                          f.evidence ? ` Evidence: ${f.evidence}` : ''
                      }`
              )
              .join('\n')
        : 'None.'
}

## Stability
${run.stability}

## Next
${
    failed.length
        ? `Fix the failing cases, then run tk-verify ${ticket} with mode "run" again.`
        : `A human marks PR #${ctx.pr} ready and merges it.`
}`;

const saved = await agent(
    `1. Write the report below verbatim to ${qaHome}/out/${ticket}/REPORT.md.
2. In worktree ${wt}: commit ${run.specFile} (and the cases file if it changed) as \`test(qa): verify ${ticket}\` with the Co-Authored-By line, then \`git -C ${wt} push\`. Never force-push.
Return "ok" or the error.
---
${report}`,
    { label: 'save', phase: 'Report', model: 'haiku', effort: 'low' }
);

return {
    status: failed.length ? 'fail' : 'pass',
    ticket,
    pr: ctx.pr,
    reportFile: `${qaHome}/out/${ticket}/REPORT.md`,
    saved,
    report,
    linearComment: `${verdict}\n\nReport: ${qaHome}/out/${ticket}/REPORT.md\nPR: ${
        ctx.prUrl
    }\n\n${failed.map(c => `- FAIL ${c.id}: ${c.note || c.expected || ''}`).join('\n')}`
};
