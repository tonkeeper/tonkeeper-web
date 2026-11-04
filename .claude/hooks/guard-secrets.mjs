#!/usr/bin/env node
// PreToolUse guard: keeps QA wallet seeds and the saved wallet profile out of the model's context.
// The test process reads them itself (dotenv / storageState); no agent ever needs to see them.
// This stops accidents, it is not a security boundary. Exit 2 blocks the call; any other failure
// would let it through, so the script uses Node only (no python3, no jq).

const chunks = [];
process.stdin.on('data', chunk => chunks.push(chunk));
process.stdin.on('end', () => {
    let input = {};
    try {
        input = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    } catch {
        block('the hook could not parse the tool call');
    }
    const tool = input.tool_name ?? '';
    const args = input.tool_input ?? {};
    const subject = ['command', 'file_path', 'path', 'pattern', 'glob']
        .map(key => (args[key] === undefined ? '' : String(args[key])))
        .join(' ');

    // Any `.env` file except `.env.example`, also when a command reaches it after `cd`.
    if (/(^|[\s/'"=<])\.env(?!\.example)(\b|$)/.test(subject)) {
        block('the QA secrets file');
    }
    if (/qa\/\.auth(\/|\b|$)/.test(subject)) {
        block('the saved wallet profile (encrypted seeds)');
    }
    if (
        tool === 'Bash' &&
        (/(^|[;&|\s])(printenv|env|set|export -p|declare -x)\s*($|[;&|])/.test(subject) ||
            /QA_WALLET_[A-Z_]*(MNEMONIC|PASSWORD)|TON_MNEMONIC/.test(subject))
    ) {
        block('printing environment variables that can hold seeds');
    }
    process.exit(0);
});

function block(what) {
    process.stderr.write(
        `Blocked by .claude/hooks/guard-secrets.mjs: ${what}. Seeds and the saved wallet profile ` +
            'stay out of agent context; run the QA scripts instead of reading them.\n'
    );
    process.exit(2);
}
