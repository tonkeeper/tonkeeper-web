export const meta = {
    name: 'tk-implement',
    description:
        'Implement a Linear TK ticket: spec check, QA cases from the spec, code, tsc/eslint gate, cross-model review/fix loop, draft PR, CI',
    whenToUse:
        'The user asks to implement / run / take a Linear ticket (TK-1234) through the agent pipeline. args: {ticket, base?}',
    phases: [
        { title: 'Spec', detail: 'read the Linear ticket, check acceptance criteria and labels' },
        { title: 'Prepare', detail: 'agent worktree on the ticket branch' },
        { title: 'Cases', detail: 'QA cases from the spec only, no code' },
        { title: 'Implement', detail: 'coder + deterministic gate, max 3 attempts' },
        { title: 'Review', detail: 'tk-reviewer on a different model, max 2 fix rounds' },
        { title: 'Publish', detail: 'push, draft PR, wait for CI and the preview' }
    ]
};

// Attempt N uses CODER_MODELS[N]. The reviewer is always a different model than the last coder.
const CODER_MODELS = ['sonnet', 'sonnet', 'opus'];
const REVIEWER_FOR = { sonnet: 'opus', opus: 'sonnet' };
const MAX_FIX_ROUNDS = 2;

const ticket = String((args && args.ticket) || args || '')
    .trim()
    .toUpperCase();
if (!/^TK-\d+$/.test(ticket)) {
    throw new Error('Pass args: {"ticket": "TK-1234", "base": "main"}');
}
const base = (args && args.base) || 'main';
const STE =
    'Write every text field in STE (.claude/skills/ste-writing/SKILL.md): verdict first, short active sentences, exact names and values.';

const SPEC = {
    type: 'object',
    properties: {
        found: { type: 'boolean' },
        title: { type: 'string' },
        url: { type: 'string' },
        description: { type: 'string' },
        acceptanceCriteria: { type: 'array', items: { type: 'string' } },
        figmaLinks: { type: 'array', items: { type: 'string' } },
        risk: { type: 'string', enum: ['high', 'low', 'unset'] },
        visual: { type: 'boolean' },
        commitType: { type: 'string', enum: ['feat', 'fix', 'chore', 'refactor', 'docs'] },
        scope: { type: 'string' },
        slug: { type: 'string', description: 'kebab-case, max 5 words' },
        gaps: { type: 'array', items: { type: 'string' } }
    },
    required: [
        'found',
        'title',
        'acceptanceCriteria',
        'risk',
        'visual',
        'commitType',
        'scope',
        'slug',
        'gaps'
    ]
};
const PREP = {
    type: 'object',
    properties: {
        ok: { type: 'boolean' },
        problem: { type: 'string' },
        worktree: { type: 'string' },
        mainRepo: { type: 'string' },
        resumed: { type: 'boolean' }
    },
    required: ['ok', 'worktree', 'mainRepo', 'resumed']
};
const CASES = {
    type: 'object',
    properties: {
        file: { type: 'string' },
        cases: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    type: { type: 'string' },
                    title: { type: 'string' }
                },
                required: ['id', 'type', 'title']
            }
        }
    },
    required: ['file', 'cases']
};
const CODE = {
    type: 'object',
    properties: {
        summary: { type: 'string' },
        disputed: {
            type: 'array',
            items: {
                type: 'object',
                properties: { id: { type: 'string' }, reason: { type: 'string' } },
                required: ['id', 'reason']
            }
        }
    },
    required: ['summary']
};
const GATE = {
    type: 'object',
    properties: { pass: { type: 'boolean' }, output: { type: 'string' } },
    required: ['pass', 'output']
};
const FINDING = {
    type: 'object',
    properties: {
        id: { type: 'string' },
        category: {
            type: 'string',
            enum: ['correctness', 'money', 'keys', 'spec', 'rule', 'test']
        },
        file: { type: 'string' },
        line: { type: 'number' },
        failure_scenario: { type: 'string' },
        fix_hint: { type: 'string' }
    },
    required: ['id', 'category', 'file', 'failure_scenario']
};
const REVIEW = {
    type: 'object',
    properties: {
        summary: { type: 'string' },
        previous: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    id: { type: 'string' },
                    status: { type: 'string', enum: ['fixed', 'open'] },
                    evidence: { type: 'string' }
                },
                required: ['id', 'status']
            }
        },
        findings: {
            type: 'array',
            items: FINDING,
            description: 'open previous findings plus new ones'
        }
    },
    required: ['summary', 'findings']
};
const PUBLISH = {
    type: 'object',
    properties: {
        pushed: { type: 'boolean' },
        pr: { type: 'number' },
        url: { type: 'string' },
        problem: { type: 'string' }
    },
    required: ['pushed']
};
const CI = {
    type: 'object',
    properties: {
        pass: { type: 'boolean' },
        previewUrl: { type: 'string' },
        failures: {
            type: 'array',
            items: {
                type: 'object',
                properties: { check: { type: 'string' }, excerpt: { type: 'string' } },
                required: ['check', 'excerpt']
            }
        }
    },
    required: ['pass', 'failures']
};

const log_ = [];
const note = line => {
    log_.push(line);
    log(line);
};
const result = (status, extra) => ({ status, ticket, log: log_, ...extra });

// ---------- Spec ----------
phase('Spec');
const spec = await agent(
    `Read Linear issue ${ticket} with the Linear MCP tools (get_issue, list_comments). Do not change it.
Return: title, url, description (as written), acceptanceCriteria (one item per criterion; take them from an "Acceptance criteria" section or checklist; if none exist, return an empty list — do not invent them), figmaLinks, visual (true if the issue has the label "visual" or a Figma link), risk ("high" or "low" from a label risk:high / risk:low, else "unset"), commitType and scope (Conventional Commits scope from CLAUDE.md: desktop, extension, web, core, uikit, locales, mobile, twa), slug, and gaps: what is missing or ambiguous for an implementer. ${STE}`,
    { label: 'spec', phase: 'Spec', model: 'sonnet', effort: 'low', schema: SPEC }
);
if (!spec || !spec.found)
    return result('blocked-spec', { report: `BLOCKED: Linear issue ${ticket} was not found.` });
if (!spec.acceptanceCriteria.length) {
    return result('blocked-spec', {
        report: `BLOCKED: ${ticket} has no acceptance criteria.\n\nAdd an "Acceptance criteria" checklist to the issue, then run tk-implement again.\n\nOther gaps:\n${
            spec.gaps.map(g => `- ${g}`).join('\n') || 'None.'
        }`
    });
}
const risk = spec.risk === 'unset' ? 'high' : spec.risk;
note(
    `${ticket}: ${spec.acceptanceCriteria.length} acceptance criteria, risk ${risk}${
        spec.risk === 'unset' ? ' (no label, treated as high)' : ''
    }, visual ${spec.visual}.`
);
const branch = `feature/${ticket.toLowerCase()}-${spec.slug}`;
const specText = `Ticket ${ticket}: ${spec.title}
${spec.url || ''}
Acceptance criteria:
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}
Figma: ${(spec.figmaLinks || []).join(' ') || 'none'}
Description:
${spec.description || ''}`;

// ---------- Prepare ----------
phase('Prepare');
const prep = await agent(
    `Prepare the agent worktree for branch ${branch}. Never touch the main checkout's working tree or its current branch.
1. MAIN = output of \`git rev-parse --show-toplevel\`. WT = the absolute path of "$MAIN/../tonkeeper-web-agent".
2. Run \`git -C "$MAIN" fetch origin\`.
3. If WT does not exist: \`git -C "$MAIN" worktree add --detach "$WT" origin/${base}\`.
4. In WT, if \`git status --porcelain\` prints anything: stop, ok=false, problem = the first 10 lines.
5. If origin/${branch} exists: check it out as a tracking branch and fast-forward it; resumed=true.
   Else if a local branch ${branch} exists with commits that are not on origin: stop, ok=false.
   Else: \`git -C "$WT" checkout -b ${branch} origin/${base}\`; resumed=false.
6. In WT run \`yarn install --immutable\`. If it fails: ok=false, problem = the last 20 lines.
Return worktree=WT, mainRepo=MAIN.`,
    { label: 'worktree', phase: 'Prepare', model: 'haiku', effort: 'low', schema: PREP }
);
if (!prep || !prep.ok) {
    return result('handoff', {
        report: `HANDOFF: the agent worktree is not ready.\n\n${
            (prep && prep.problem) || 'The prepare agent returned no result.'
        }`
    });
}
const wt = prep.worktree;
const inWt = `Work only inside the git worktree ${wt} (branch ${branch}). Use \`cd ${wt} && …\` or absolute paths for every command and file.`;
const gatePrompt = `Run \`cd ${wt} && ${prep.mainRepo}/scripts/agent/gate.sh origin/${base}\`. Return pass (exit code 0) and output (the script's printed lines, verbatim). Do not fix anything.`;
const runGate = label =>
    agent(gatePrompt, { label, phase: 'Implement', model: 'haiku', effort: 'low', schema: GATE });

// ---------- Cases ----------
phase('Cases');
const casesFile = `tests/playwright/qa/cases/${ticket}.json`;
const cases = await agent(
    `You write the QA acceptance contract for a ticket. You see only the spec. Do not open application code under apps/ or packages/ — the cases must follow the spec, not the implementation.
${inWt}
${specText}

Read .claude/skills/tk-qa-verify-web/SKILL.md, section "Case format", and write ${wt}/${casesFile} in that format.
Cover, in this order: smoke (1–2), positive (every acceptance criterion), negative, edge/boundary values. Wallets: A = multichain, B = legacy TON. If the spec does not name one, cover both. Wallet C has an empty battery: use it only for cases about battery/gasless fallback, and never plan a battery charge for it.
Money: if a case must sign, describe the transaction in its "money" field as a round trip between A and B or to self, with the smallest amount that proves the criterion.
If ${casesFile} already exists on this branch, update it instead of starting over.
Commit it: \`test(qa): cases for ${ticket}\`. Return the file path and the case list.`,
    { label: 'cases', phase: 'Cases', model: 'sonnet', effort: 'low', schema: CASES }
);
note(`QA cases: ${cases ? cases.cases.length : 0} in ${casesFile}.`);

// ---------- Implement ----------
phase('Implement');
const coderPrompt = (failure, model) =>
    `You implement Linear ticket ${ticket}. ${inWt}
${specText}

The QA cases in ${wt}/${casesFile} are the acceptance contract. Implement so that each case passes.
Rules:
- Follow CLAUDE.md. Read only the files the change needs. Reuse existing primitives and components before writing new ones.
- If Figma links are given, load the figma:figma-design-to-code skill, then use the Figma MCP for the spec.
- Write the tests CLAUDE.md "Testing" requires (a *.ct.tsx for a new small/medium component, vitest for core logic). Do not run test suites. Do not start the app or a browser.
- New t() keys: all 20 locales in the same change, per CLAUDE.md.
- One pass. Implement the spec, nothing more.
- Commit on ${branch}: \`<type>(<scope>): <description> [${ticket}]\`, ending with the Co-Authored-By line from your instructions. Do not push.
${
    failure
        ? `\nThe previous attempt FAILED. Fix these problems in place; do not restart from scratch:\n${failure}\n`
        : ''
}
Return a summary of what you changed (max 8 lines). ${STE}`;

let lastModel = null;
let gate = null;
let attempts = 0;
let codeSummary = '';
let failure = null;
const resumedNote = prep.resumed
    ? ' The branch already has commits from an earlier run: continue from them.'
    : '';
while (attempts < CODER_MODELS.length) {
    const model = CODER_MODELS[attempts];
    const code = await agent(coderPrompt(failure, model) + resumedNote, {
        label: `code ${attempts + 1} (${model})`,
        phase: 'Implement',
        model,
        schema: CODE
    });
    attempts++;
    lastModel = model;
    codeSummary = (code && code.summary) || codeSummary;
    gate = await runGate(`gate ${attempts}`);
    if (gate && gate.pass) break;
    failure = (gate && gate.output) || 'The gate returned no output.';
    note(`Attempt ${attempts} (${model}) failed the gate.`);
}
if (!gate || !gate.pass) {
    return result('handoff', {
        attempts,
        report: `HANDOFF: ${ticket} failed the tsc/eslint gate ${attempts} times.\n\nBranch: ${branch} (worktree ${wt}, not pushed).\n\nLast gate output:\n\`\`\`\n${failure}\n\`\`\`\n\nNext: a human reads the errors and fixes the branch or the spec.`
    });
}
note(`Gate passed after ${attempts} attempt(s).`);

// ---------- Review ----------
phase('Review');
let findings = [];
let reviewSummary = '';
let disputed = [];
let fixRound = 0;
while (true) {
    const reviewer = REVIEWER_FOR[lastModel] || 'opus';
    const previous = findings.length
        ? `\nPrevious findings (mark each fixed or open):\n${JSON.stringify(
              findings,
              null,
              2
          )}\nThe coder disputes these (decide: keep it open only if the failure scenario still holds):\n${JSON.stringify(
              disputed,
              null,
              2
          )}`
        : '';
    const review = await agent(
        `Review branch ${branch} in worktree ${wt} against base origin/${base}.
${specText}
${previous}
Risk: ${risk}.${risk === 'high' ? ' Look hardest at the money and keys categories.' : ''}`,
        {
            label: `review ${fixRound + 1} (${reviewer})`,
            phase: 'Review',
            agentType: 'tk-reviewer',
            model: reviewer,
            schema: REVIEW
        }
    );
    if (!review) {
        return result('handoff', {
            attempts,
            report: `HANDOFF: the reviewer returned no result. Branch ${branch} is gated but not reviewed.`
        });
    }
    findings = review.findings;
    reviewSummary = review.summary;
    note(`Review ${fixRound + 1}: ${findings.length} blocking finding(s).`);
    if (!findings.length) break;
    if (fixRound >= MAX_FIX_ROUNDS) {
        return result('handoff', {
            attempts,
            findings,
            report: `HANDOFF: ${
                findings.length
            } blocking finding(s) are still open after ${MAX_FIX_ROUNDS} fix rounds.\n\n${findings
                .map(
                    f =>
                        `- **${f.category}** ${f.file}${f.line ? `:${f.line}` : ''} — ${
                            f.failure_scenario
                        }`
                )
                .join(
                    '\n'
                )}\n\nBranch: ${branch} (not pushed). Next: a human decides on each finding.`
        });
    }
    fixRound++;
    const fix = await agent(
        `Fix the review findings on branch ${branch}. ${inWt}
${specText}
Findings:
${JSON.stringify(findings, null, 2)}
For each finding: fix it, or — only if the failure scenario is wrong — leave the code and list it in "disputed" with the reason.
Commit: \`fix(<scope>): address review [${ticket}]\` with the Co-Authored-By line. Do not push. Do not run test suites. ${STE}`,
        { label: `fix ${fixRound} (${lastModel})`, phase: 'Review', model: lastModel, schema: CODE }
    );
    disputed = (fix && fix.disputed) || [];
    gate = await runGate(`gate after fix ${fixRound}`);
    if (!gate || !gate.pass) {
        return result('handoff', {
            attempts,
            report: `HANDOFF: the review fix broke the gate.\n\n\`\`\`\n${
                (gate && gate.output) || ''
            }\n\`\`\`\n\nBranch: ${branch} (not pushed).`
        });
    }
}

// ---------- Publish ----------
phase('Publish');
const prBody = `## Verdict
Agent pipeline: gate PASS, review PASS (${
    REVIEWER_FOR[lastModel]
} reviewed ${lastModel} code). CI and human visual check follow.

## Ticket
${ticket}: ${spec.title}
${spec.url || ''}

## Acceptance criteria
${spec.acceptanceCriteria.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Change
${codeSummary}

## Review
${reviewSummary || 'No blocking findings.'}

## QA cases
${casesFile} — ${
    cases ? cases.cases.length : 0
} cases. They run in tk-verify after the visual check.

## Not verified
- Test suites: CI runs them.
- The app was not started. Visual result: ${
    spec.visual ? 'a human checks the preview against Figma.' : 'no visual change expected.'
}

## Pipeline
Attempts: ${attempts}. Fix rounds: ${fixRound}. Risk: ${risk}.

🤖 Generated with [Claude Code](https://claude.com/claude-code)`;

const pub = await agent(
    `Publish branch ${branch} from worktree ${wt}.
1. \`git -C ${wt} push -u origin ${branch}\`. Never force-push.
2. If a PR for ${branch} exists (\`gh pr view ${branch} --json number,url\`), keep it and update its body. Else create a draft PR:
   \`gh pr create --draft --base ${base} --head ${branch} --title "${spec.commitType}(${
        spec.scope
    }): ${spec.title.replace(/"/g, "'")} [${ticket}]" --body-file <file>\`.
   Write the body below to a temp file in your scratchpad first, verbatim:
---
${prBody}
---
Return pushed, pr (number), url.`,
    { label: 'publish', phase: 'Publish', model: 'haiku', effort: 'low', schema: PUBLISH }
);
if (!pub || !pub.pushed || !pub.pr) {
    return result('handoff', {
        attempts,
        report: `HANDOFF: push or PR creation failed. ${
            (pub && pub.problem) || ''
        }\nBranch: ${branch}.`
    });
}
note(`Draft PR #${pub.pr}: ${pub.url}`);

const ciPrompt = `Wait for the CI checks of PR #${pub.pr} to finish: repeat \`gh pr checks ${pub.pr} --watch --interval 60\` until no check is pending (each call can run up to 10 minutes).
Then:
- pass = every required check passed.
- For each failed check: find its run with \`gh pr checks ${pub.pr} --json name,state,link\`, then take the relevant lines from \`gh run view <run-id> --log-failed | tail -n 120\`: failing test names, file:line, the assertion or error. Max 30 lines per check.
- previewUrl = the latest Cloudflare preview URL from the PR comments (\`gh pr view ${pub.pr} --json comments\`), if any.`;

let ci = await agent(ciPrompt, {
    label: 'ci',
    phase: 'Publish',
    model: 'haiku',
    effort: 'low',
    schema: CI
});
if (ci && !ci.pass && attempts < CODER_MODELS.length) {
    const model = CODER_MODELS[CODER_MODELS.length - 1];
    note(`CI failed (${ci.failures.map(f => f.check).join(', ')}). One fix attempt with ${model}.`);
    await agent(
        coderPrompt(ci.failures.map(f => `[${f.check}]\n${f.excerpt}`).join('\n\n'), model) +
            `\nAfter the commit, run \`cd ${wt} && ${prep.mainRepo}/scripts/agent/gate.sh origin/${base}\` and fix until it passes, then \`git -C ${wt} push\`.`,
        { label: `ci fix (${model})`, phase: 'Publish', model, schema: CODE }
    );
    attempts++;
    ci = await agent(ciPrompt, {
        label: 'ci again',
        phase: 'Publish',
        model: 'haiku',
        effort: 'low',
        schema: CI
    });
}
if (!ci || !ci.pass) {
    return result('handoff', {
        attempts,
        pr: pub.pr,
        prUrl: pub.url,
        report: `HANDOFF: CI fails on PR #${pub.pr}.\n\n${((ci && ci.failures) || [])
            .map(f => `**${f.check}**\n\`\`\`\n${f.excerpt}\n\`\`\``)
            .join('\n\n')}\n\nNext: a human fixes CI or the spec.`
    });
}

const next = spec.visual
    ? `Next: a human opens the preview, compares it with Figma, and adds the PR label \`visual-ok\` (or comments what is wrong). Then run tk-verify ${ticket}.`
    : `Next: run tk-verify ${ticket}${risk === 'high' ? '' : ' (optional for risk:low)'}.`;
const report = `READY: ${ticket} passed gate, review and CI.

| Item | Value |
|---|---|
| PR | ${pub.url} (draft) |
| Preview | ${ci.previewUrl || 'not found in PR comments'} |
| Attempts | ${attempts} (models: ${CODER_MODELS.slice(0, attempts).join(', ')}) |
| Review | ${fixRound} fix round(s), reviewer ${REVIEWER_FOR[lastModel]} |
| QA cases | ${cases ? cases.cases.length : 0} in ${casesFile} |
| Risk / visual | ${risk} / ${spec.visual} |

${next}`;

return result(spec.visual ? 'ready-for-visual' : 'ready-for-verify', {
    attempts,
    pr: pub.pr,
    prUrl: pub.url,
    previewUrl: ci.previewUrl,
    branch,
    worktree: wt,
    report,
    linearComment: report
});
