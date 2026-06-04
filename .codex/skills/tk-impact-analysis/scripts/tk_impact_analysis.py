#!/usr/bin/env python3
"""Local runner for the tk-impact-analysis skill (Tonkeeper Web)."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from dataclasses import dataclass
from datetime import date
from fnmatch import fnmatchcase
from pathlib import Path, PurePosixPath


SKILL_DIR = Path(__file__).resolve().parents[1]
REPORT_TEMPLATE = SKILL_DIR / "report.md"
TEST_COLLECTION_TEMPLATE = SKILL_DIR / "test-collection-template.txt"
EXCLUDED_QA_IMPACT_PATHS_FILE = SKILL_DIR / "references" / "excluded-qa-impact-paths.txt"
RELEASE_BRANCH_RE = re.compile(
    r"^release/"
    r"(?:"
    r"(?P<yy>\d{2})\.(?P<mm>\d{2})\.(?P<it>\d+)"  # YY.MM.Iterator (iOS/Android style)
    r"|"
    r"(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)"  # major.minor.patch (web style)
    r")"
    r"(?:-(?P<hotfix>\d+))?$"
)
# Matches release tags like v4.7.0 or v4.7.0-rc.1 (rc tags are excluded from auto-selection)
RELEASE_TAG_RE = re.compile(
    r"^v(?P<major>\d+)\.(?P<minor>\d+)\.(?P<patch>\d+)(?:-(?P<pre>.+))?$"
)

DEFAULTS = {
    "Web": {
        "regress": SKILL_DIR / "sources" / "Web" / "regress.txt",
    },
}

SECTION_ORDER = [
    "Scope",
    "Changed Areas",
    "Changed Files Without Known QA Area",
    "Run These Existing Regression Blocks",
    "Add These Missing Blocks",
    "Additional Checks",
    "Open Questions",
]

# Maps path keywords to QA area names, tuned for the tonkeeper-web monorepo structure.
PATH_CATEGORY_RULES = [
    # Onboarding / account creation
    ("onboard", "Onboarding and account creation"),
    ("create-wallet", "Onboarding and account creation"),
    ("import", "Wallet import and recovery phrase"),
    ("mnemonic", "Wallet import and recovery phrase"),
    ("backup", "Backup and recovery"),
    ("restore", "Backup and recovery"),
    # Account model
    ("account", "Account and wallet management"),
    ("wallet", "Account and wallet management"),
    ("keychain", "Account and wallet management"),
    ("keystore", "Account and wallet management"),
    ("ledger", "Ledger hardware wallet"),
    ("keystone", "Keystone hardware wallet"),
    ("multisig", "Multisig wallet"),
    ("watch", "Watch-only wallet"),
    # Migration / storage
    ("migrat", "Migration and storage upgrade"),
    ("storage", "Migration and storage upgrade"),
    ("AppKey", "Migration and storage upgrade"),
    # Send / receive
    ("send", "Send flow and confirmations"),
    ("transfer", "Send flow and confirmations"),
    ("receive", "Receive flow and address sharing"),
    ("address", "Receive flow and address sharing"),
    # Swap
    ("swap", "Swap flow"),
    # Staking
    ("stake", "Stake flow"),
    ("staking", "Stake flow"),
    # Browser / dApps / TonConnect
    ("browser", "Browser and connected dApps"),
    ("tonconnect", "Browser and connected dApps"),
    ("dapp", "Browser and connected dApps"),
    ("proof", "Signing and proof flows"),
    ("sign", "Signing and proof flows"),
    # NFT / jetton / token
    ("nft", "NFT and collectibles"),
    ("collectible", "NFT and collectibles"),
    ("jetton", "Jetton and token management"),
    ("token", "Jetton and token management"),
    # Battery
    ("battery", "Battery and charge"),
    # Notifications / activity
    ("notif", "Notifications and activity"),
    ("activity", "Notifications and activity"),
    ("history", "Notifications and activity"),
    # Settings
    ("setting", "Settings and toggles"),
    ("security", "Settings and toggles"),
    ("biometr", "Settings and toggles"),
    # Localization
    ("locale", "Localization"),
    ("locali", "Localization"),
    ("i18n", "Localization"),
    ("translation", "Localization"),
    ("/locales/", "Localization"),
    # Analytics
    ("analytic", "Analytics"),
    ("amplitude", "Analytics"),
    ("aptabase", "Analytics"),
    # Feature flags / config
    ("flag", "Feature flags and config"),
    ("feature", "Feature flags and config"),
    # Drag and drop / sortable
    ("dnd", "Drag and drop"),
    ("sortable", "Drag and drop"),
    ("draggable", "Drag and drop"),
    ("dragitem", "Drag and drop"),
    # Build / infra
    ("vite.config", "Build config and infrastructure"),
    ("webpack", "Build config and infrastructure"),
    ("electron", "Build config and infrastructure"),
    ("capacitor", "Build config and infrastructure"),
    ("manifest", "Build config and infrastructure"),
    ("package.json", "Build config and infrastructure"),
    ("turbo.json", "Build config and infrastructure"),
    ("forge.config", "Build config and infrastructure"),
    ("fastlane", "Build config and infrastructure"),
    ("fastfile", "Build config and infrastructure"),
    ("extension-builder", "Build config and infrastructure"),
    ("firefox", "Build config and infrastructure"),
    # TypeScript / compiler config — changes here can affect all platform targets
    ("tsconfig", "TypeScript compiler config"),
    # Platform SDK / app shell
    ("appsdk", "Platform SDK and app shell"),
    ("appcontent", "Platform SDK and app shell"),
    ("narrowcontent", "Platform SDK and app shell"),
    ("backgroundpopup", "Platform SDK and app shell"),
    # Crypto / password
    ("crypto", "Encryption and key management"),
    ("password", "Encryption and key management"),
    ("cipher", "Encryption and key management"),
    ("encrypt", "Encryption and key management"),
    ("decrypt", "Encryption and key management"),
    # API / backend config
    ("tonendpoint", "API and backend config"),
    ("tonkeeperapi", "API and backend config"),
    ("openapi", "API and backend config"),
    ("endpoint", "API and backend config"),
    # Dashboard / navigation / home
    ("dashboard", "Dashboard and navigation"),
    ("aside", "Dashboard and navigation"),
    ("categories", "Dashboard and navigation"),
    ("sidebar", "Dashboard and navigation"),
    ("balance", "Dashboard and navigation"),
    ("coin", "Dashboard and navigation"),
    ("home", "Dashboard and navigation"),
    # Shared UI primitives
    ("externallink", "Shared UI and links"),
    ("external-link", "Shared UI and links"),
    ("link", "Shared UI and links"),
    # State / folders
    ("folder", "Account and wallet management"),
    # Debugging
    ("debug", "Build config and infrastructure"),
    ("version", "Build config and infrastructure"),
    # Interaction hooks
    ("click", "Shared UI and links"),
    ("areaclick", "Shared UI and links"),
    # Build tooling scripts
    ("json-schema", "Build config and infrastructure"),
    ("prune-redundant", "Build config and infrastructure"),
    ("resource", "Build config and infrastructure"),
]

CATEGORY_KEYWORDS = {
    "Onboarding and account creation": {"onboard", "create", "new", "wallet", "setup"},
    "Wallet import and recovery phrase": {"import", "mnemonic", "phrase", "wallet", "secret", "seed", "recovery", "backup"},
    "Backup and recovery": {"backup", "recovery", "seed", "phrase", "wallet"},
    "Account and wallet management": {"account", "wallet", "address", "balance", "switch", "active"},
    "Ledger hardware wallet": {"ledger", "hardware", "wallet"},
    "Keystone hardware wallet": {"keystone", "hardware", "wallet"},
    "Multisig wallet": {"multisig", "multi", "sign", "wallet"},
    "Watch-only wallet": {"watch", "readonly", "address"},
    "Migration and storage upgrade": {"migration", "upgrade", "storage", "key", "version"},
    "Send flow and confirmations": {"send", "confirm", "history", "transaction", "comment", "address", "transfer"},
    "Receive flow and address sharing": {"receive", "address", "qr", "copy", "share"},
    "Swap flow": {"swap", "send", "receive", "token"},
    "Stake flow": {"stake", "staking", "pool", "balance"},
    "Browser and connected dApps": {"browser", "connected", "dapp", "tonconnect", "service"},
    "Signing and proof flows": {"sign", "signature", "proof", "confirm", "transaction", "browser"},
    "NFT and collectibles": {"nft", "collectible", "token"},
    "Jetton and token management": {"jetton", "token", "asset", "balance"},
    "Battery and charge": {"battery", "charge", "recharge"},
    "Notifications and activity": {"notification", "activity", "history", "event"},
    "Settings and toggles": {"settings", "toggle", "notification", "biometric", "security"},
    "Localization": {"language", "localization", "copy", "translation", "locale"},
    "Analytics": {"analytics", "metric", "event"},
    "Feature flags and config": {"flag", "config", "feature", "toggle"},
    "Build config and infrastructure": {"build", "config", "electron", "capacitor", "vite", "webpack"},
    "TypeScript compiler config": {"typescript", "compiler", "strict", "target", "lib", "module", "type", "build", "app"},
    "Drag and drop": {"drag", "dnd", "drop", "reorder", "sortable", "order", "touch", "cancel", "zone", "aside", "tabs"},
    "Platform SDK and app shell": {"sdk", "app", "platform", "shell", "popup", "background", "service", "worker", "content", "layout"},
    "Encryption and key management": {"password", "crypto", "encrypt", "decrypt", "key", "cipher", "hash"},
    "API and backend config": {"api", "endpoint", "backend", "config", "request", "response"},
    "Dashboard and navigation": {"dashboard", "aside", "sidebar", "navigation", "tab", "menu", "layout", "balance", "coin", "home"},
    "Shared UI and links": {"link", "button", "click", "external", "navigation", "open"},
}

MISSING_BLOCK_SUGGESTIONS = {
    "Wallet import and recovery phrase": [
        "Add a `mnemonic import compatibility` block",
        "Verify a previously importable phrase still completes import, unlock, and send paths",
    ],
    "Browser and connected dApps": [
        "Add a `browser empty-state and connected services` block",
        "Verify both empty and non-empty backend responses render correctly",
    ],
    "Localization": [
        "Add a `changed locale smoke` block",
        "Check one long-text locale on the changed screens for truncation and stale copy",
    ],
    "Build config and infrastructure": [
        "Add a `build and launch smoke` block",
        "Verify the release branch still builds and launches for all targets (web, extension, desktop, twa)",
    ],
    "TypeScript compiler config": [
        "Add a `TypeScript config smoke` block",
        "Verify all platform targets build without type errors after the tsconfig change",
        "Run a full regression smoke — compiler option changes (strict, target, lib) can affect any feature",
    ],
    "Migration and storage upgrade": [
        "Add an `upgrade path` block",
        "Verify existing wallets survive the storage migration without data loss",
    ],
    "Ledger hardware wallet": [
        "Add a `Ledger end-to-end` block",
        "Cover Ledger device connection, account listing, and signing a transfer",
    ],
    "Multisig wallet": [
        "Add a `multisig smoke` block",
        "Verify creating, proposing, and confirming a multisig order",
    ],
}

ADDITIONAL_CHECK_SUGGESTIONS = {
    "Wallet import and recovery phrase": [
        "Do one cold-start and unlock pass after importing a wallet",
        "Run one imported-wallet smoke on both mainnet and testnet if supported",
    ],
    "Browser and connected dApps": [
        "Exercise one connect plus one signing action from the in-app browser",
        "If available, include a proof-based auth flow rather than connection-only smoke",
    ],
    "Localization": [
        "Smoke one non-English locale on the touched screens and verify line wrapping",
    ],
    "Build config and infrastructure": [
        "Launch the app from a clean install on all affected targets (web, extension, desktop, twa)",
    ],
    "Migration and storage upgrade": [
        "Install an older build, add wallets, upgrade to the new build and verify all wallets survive",
    ],
    "Send flow and confirmations": [
        "Send TON with a comment, verify the history entry and recipient receive correctly",
        "Test sending with an insufficient balance to ensure the error state is correct",
    ],
    "Swap flow": [
        "Perform a swap and verify balances update correctly on the wallet screen",
        "Test the swap flow with the minimum and maximum amounts supported",
    ],
    "Stake flow": [
        "Stake and unstake a small amount, verify pool balance updates",
    ],
    "Battery and charge": [
        "Verify battery indicator reflects balance correctly after charging",
        "Test the battery-powered send flow without native TON balance",
    ],
}

GENERIC_SEGMENTS = {
    # Generic directory names in a TS/React monorepo
    "src",
    "lib",
    "libs",
    "utils",
    "util",
    "helpers",
    "helper",
    "hooks",
    "hook",
    "components",
    "component",
    "pages",
    "page",
    "views",
    "view",
    "store",
    "stores",
    "model",
    "models",
    "types",
    "type",
    "context",
    "contexts",
    "api",
    "service",
    "services",
    "config",
    "configuration",
    "feature",
    "features",
    "app",
    "apps",
    "package",
    "packages",
    "common",
    "shared",
    "core",
    "uikit",
    "ui",
    "index",
    "root",
    "base",
    "dist",
    "build",
    "tests",
    "test",
    "__tests__",
    "mocks",
    "mock",
}

MODULE_TERM_SYNONYMS = {
    "battery": {"battery", "батарейка"},
    "wallet": {"wallet", "кошелек", "кошелёк"},
    "send": {"send", "transfer", "перевод"},
    "receive": {"receive", "receipt", "получение"},
    "swap": {"swap", "обмен"},
    "stake": {"stake", "staking", "стейкинг"},
    "browser": {"browser", "браузер"},
    "account": {"account", "аккаунт"},
    "setting": {"setting", "settings", "настройки"},
    "nft": {"nft", "collectible", "коллекция"},
    "jetton": {"jetton", "token", "токен"},
    "notif": {"notification", "уведомление"},
    "multisig": {"multisig", "мультиподпись"},
    "ledger": {"ledger", "ledger"},
}

TRAILING_TYPE_SUFFIXES = (
    "Hook",
    "Store",
    "Context",
    "Provider",
    "Component",
    "Page",
    "View",
    "Modal",
    "Service",
    "Api",
    "Client",
    "Mapper",
    "Factory",
    "Utils",
    "Helper",
    "Type",
    "Types",
)


@dataclass
class DiffFile:
    status: str
    path: str


@dataclass
class RegressEntry:
    line_no: int
    text: str
    raw_line: str
    level: int
    chain: list[str]
    parent_line_nos: tuple[int, ...] = ()
    is_section: bool = False
    has_children: bool = False

    @property
    def display_text(self) -> str:
        return self.chain[-1] if self.chain else self.text

    @property
    def block_name(self) -> str:
        if len(self.chain) >= 2:
            return self.chain[-2]
        return self.display_text


@dataclass(frozen=True, order=True)
class ReleaseVersion:
    yy: int
    mm: int
    iterator: int
    hotfix: int


@dataclass(frozen=True)
class ComparisonPlan:
    current_branch: str
    compare_branch: str
    current_ref: str
    compare_ref: str
    latest_release: str
    comparison_reason: str


@dataclass(frozen=True)
class UnmatchedFileInsight:
    path: str
    modules: list[str]
    search_terms: list[str]
    coverage_note: str
    suggested_test: str


@dataclass(frozen=True)
class PathSignal:
    path: str
    modules: list[str]
    search_terms: list[str]
    focus: str


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Run TK impact analysis locally (Tonkeeper Web).")
    parser.add_argument("--platform", required=True, choices=sorted(DEFAULTS))
    parser.add_argument("--release-branch", help="Override the auto-selected release branch to compare against.")
    parser.add_argument("--base-branch", help="Override the source branch. Defaults to the current checked out branch.")
    parser.add_argument(
        "--repo-path",
        "--source-repository",
        dest="repo_path",
        help="Override the source repository used for git comparison.",
    )
    parser.add_argument("--regress-path")
    parser.add_argument("--report-path")
    parser.add_argument("--tests-collection-path")
    parser.add_argument("--date", default=str(date.today()))
    parser.add_argument("--write-raw", action="store_true", help="Write raw git data bundle next to the report.")
    return parser.parse_args()


def resolve_path(path_str: str | None, default: Path) -> Path:
    if not path_str:
        return default
    path = Path(path_str)
    if not path.is_absolute():
        path = (Path.cwd() / path).resolve()
    return path


def discover_source_repository(start: Path) -> Path | None:
    for candidate in [start, *start.parents]:
        if (candidate / ".git").exists():
            return candidate
    return None


def run_git(repo: Path, *args: str) -> str:
    proc = subprocess.run(
        ["git", "-C", str(repo), *args],
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        raise RuntimeError(proc.stderr.strip() or f"git {' '.join(args)} failed")
    return proc.stdout.rstrip()


def ensure_git_inputs(repo: Path, current_ref: str, compare_ref: str) -> tuple[str, str]:
    inside = run_git(repo, "rev-parse", "--is-inside-work-tree")
    if inside.strip() != "true":
        raise RuntimeError(f"`{repo}` is not a git worktree")
    current_sha = verify_ref(repo, current_ref)
    compare_sha = verify_ref(repo, compare_ref)
    return current_sha, compare_sha


def verify_ref(repo: Path, ref: str) -> str:
    _resolved, sha = resolve_ref(repo, ref)
    return sha


def resolve_ref(repo: Path, ref: str) -> tuple[str, str]:
    candidates = [ref, f"refs/remotes/origin/{ref}"]
    for candidate in candidates:
        proc = subprocess.run(
            ["git", "-C", str(repo), "rev-parse", "--verify", candidate],
            capture_output=True,
            text=True,
        )
        if proc.returncode == 0:
            return candidate, proc.stdout.strip()
    raise RuntimeError(f"Could not resolve branch or ref `{ref}` locally or under `origin/`")


def current_branch(repo: Path) -> str:
    branch = run_git(repo, "branch", "--show-current").strip()
    if branch:
        return branch
    raise RuntimeError("Could not detect the current branch. Check out a branch or pass `--base-branch` explicitly.")


def is_ssh_auth_error(stderr: str) -> bool:
    lowered = stderr.lower()
    needles = [
        "permission denied (publickey)",
        "sign_and_send_pubkey",
        "agent refused operation",
        "enter passphrase for key",
    ]
    return any(needle in lowered for needle in needles)


def manual_rerun_message(platform: str, execution_date: str) -> str:
    reports_dir = SKILL_DIR / "reports" / execution_date / platform
    command = f"python3 .codex/skills/tk-impact-analysis/scripts/tk_impact_analysis.py --platform {platform} --write-raw"
    return (
        "Failed to fetch release branches from `origin` because SSH authentication is required.\n"
        f"Run this command manually in your terminal and complete the SSH prompt:\n{command}\n"
        "After it finishes, tell Claude.\n"
        "Claude must verify that these files were updated recently before trusting the results:\n"
        f"- {reports_dir / 'raw-git-data.txt'}\n"
        f"- {reports_dir / 'report.md'}\n"
        f"- {reports_dir / 'test-collection.txt'}"
    )


def fetch_release_branches(repo: Path, platform: str, execution_date: str) -> str:
    proc = subprocess.run(
        ["git", "-C", str(repo), "fetch", "origin", "+refs/heads/release/*:refs/remotes/origin/release/*"],
        capture_output=True,
        text=True,
    )
    if proc.returncode != 0:
        stderr = proc.stderr.strip()
        if is_ssh_auth_error(stderr):
            raise RuntimeError(manual_rerun_message(platform, execution_date))
        if "No such remote" in stderr or "couldn't find remote ref" in stderr:
            raise RuntimeError(
                "Failed to fetch release branches from `origin`. "
                "Check that the repo has an `origin` remote and valid access."
            )
        raise RuntimeError(stderr or "Failed to fetch release branches from `origin`.")
    output = proc.stderr.strip() or proc.stdout.strip()
    return output or "Fetched remote release branches from `origin`"


def parse_release_branch(branch: str) -> ReleaseVersion | None:
    match = RELEASE_BRANCH_RE.fullmatch(branch)
    if not match:
        return None
    if match.group("yy") is not None:
        # YY.MM.Iterator style
        return ReleaseVersion(
            yy=int(match.group("yy")),
            mm=int(match.group("mm")),
            iterator=int(match.group("it")),
            hotfix=int(match.group("hotfix") or 0),
        )
    # major.minor.patch style — map to the same tuple so sorting works
    return ReleaseVersion(
        yy=int(match.group("major")),
        mm=int(match.group("minor")),
        iterator=int(match.group("patch")),
        hotfix=int(match.group("hotfix") or 0),
    )


def parse_release_tag(tag: str) -> ReleaseVersion | None:
    match = RELEASE_TAG_RE.fullmatch(tag)
    if not match:
        return None
    pre = match.group("pre")
    if pre:
        return None  # skip rc/alpha/beta tags in auto-selection
    return ReleaseVersion(
        yy=int(match.group("major")),
        mm=int(match.group("minor")),
        iterator=int(match.group("patch")),
        hotfix=0,
    )


def list_release_tags(repo: Path) -> list[str]:
    raw = run_git(repo, "tag", "--list")
    tags = []
    for line in raw.splitlines():
        tag = line.strip()
        if parse_release_tag(tag):
            tags.append(tag)
    return sorted(tags, key=lambda t: parse_release_tag(t))


def list_release_branches(repo: Path) -> list[str]:
    refs = set()
    for raw in [
        run_git(repo, "branch", "--format", "%(refname:short)"),
        run_git(repo, "branch", "-r", "--format", "%(refname:short)"),
    ]:
        for line in raw.splitlines():
            branch = line.strip()
            if not branch or "->" in branch:
                continue
            if branch.startswith("origin/"):
                branch = branch[len("origin/"):]
            if parse_release_branch(branch):
                refs.add(branch)
    return sorted(refs, key=lambda item: parse_release_branch(item))


def plan_comparison(repo: Path, explicit_current: str | None, explicit_compare: str | None) -> ComparisonPlan:
    source_branch = explicit_current or current_branch(repo)
    source_ref, _source_sha = resolve_ref(repo, source_branch)

    # Prefer release tags (v4.7.0 style), fall back to release branches
    release_tags = list_release_tags(repo)
    release_branches = list_release_branches(repo)
    releases = release_tags if release_tags else release_branches
    release_type = "tag" if release_tags else "branch"

    if not releases:
        raise RuntimeError(
            "No release tags (v4.7.0) or release branches (release/X.Y.Z) were found."
        )

    latest_release = releases[-1]
    if explicit_compare:
        compare_ref, _compare_sha = resolve_ref(repo, explicit_compare)
        return ComparisonPlan(
            current_branch=source_branch,
            compare_branch=explicit_compare,
            current_ref=source_ref,
            compare_ref=compare_ref,
            latest_release=latest_release,
            comparison_reason=f"Comparison ref was provided explicitly",
        )

    parsed_current = parse_release_tag(source_branch) or parse_release_branch(source_branch)
    if parsed_current and source_branch == latest_release:
        if len(releases) < 2:
            raise RuntimeError(
                f"The current {release_type} is the only known release, so there is no previous release to compare against."
            )
        compare_branch = releases[-2]
        reason = f"Current ref is the latest release {release_type}, compared with the previous one"
    else:
        compare_branch = latest_release
        if parsed_current:
            reason = f"Current ref is not the latest release {release_type}, compared with the latest ({latest_release})"
        else:
            reason = f"Current branch is not a release, compared with the latest release {release_type} ({latest_release})"

    return ComparisonPlan(
        current_branch=source_branch,
        compare_branch=compare_branch,
        current_ref=source_ref,
        compare_ref=resolve_ref(repo, compare_branch)[0],
        latest_release=latest_release,
        comparison_reason=reason,
    )


def read_excluded_qa_impact_paths(path: Path) -> list[str]:
    if not path.exists():
        return []
    excluded: list[str] = []
    with path.open("r", encoding="utf-8") as fh:
        for raw_line in fh:
            line = raw_line.strip()
            if not line or line.startswith("#"):
                continue
            excluded.append(line)
    return excluded


EXCLUDED_QA_IMPACT_PATHS = read_excluded_qa_impact_paths(EXCLUDED_QA_IMPACT_PATHS_FILE)


def is_excluded_qa_impact_path(path: str, patterns: list[str]) -> bool:
    normalized_path = path.replace("\\", "/")
    pure_path = PurePosixPath(normalized_path)
    for pattern in patterns:
        if pure_path.match(pattern) or fnmatchcase(normalized_path, pattern):
            return True
        if pattern.startswith("**/"):
            suffix_pattern = pattern[3:]
            if pure_path.match(suffix_pattern) or fnmatchcase(normalized_path, suffix_pattern):
                return True
        if pattern.endswith("/**"):
            prefix = pattern[:-3].rstrip("/")
            if normalized_path == prefix or normalized_path.startswith(prefix + "/"):
                return True
    return False


def read_diff_files(repo: Path, current_ref: str, compare_ref: str) -> list[DiffFile]:
    raw = run_git(repo, "diff", "--name-status", f"{current_ref}...{compare_ref}")
    files: list[DiffFile] = []
    for line in raw.splitlines():
        if not line.strip():
            continue
        parts = line.split("\t")
        status = parts[0]
        path = parts[-1]
        if is_excluded_qa_impact_path(path, EXCLUDED_QA_IMPACT_PATHS):
            continue
        files.append(DiffFile(status=status, path=path))
    return files


def read_regress_entries(regress_path: Path) -> list[RegressEntry]:
    stack: list[RegressEntry] = []
    entries: list[RegressEntry] = []
    with regress_path.open("r", encoding="utf-8") as fh:
        for index, raw_line in enumerate(fh, start=1):
            line = raw_line.rstrip("\n")
            if not line.strip():
                continue
            stripped_line = line.strip()
            if stripped_line.startswith("#") or stripped_line.startswith("[MODULE_GAP]"):
                continue
            spaces = len(line) - len(line.lstrip(" "))
            level = spaces // 4
            text = stripped_line
            while stack and stack[-1].level >= level:
                stack.pop()
            chain = [item.text for item in stack] + [text]
            entry = RegressEntry(
                line_no=index,
                text=text,
                raw_line=line,
                level=level,
                chain=chain,
                parent_line_nos=tuple(item.line_no for item in stack),
                is_section=text.startswith("[SECTION]"),
            )
            entries.append(entry)
            stack.append(entry)
    for current, next_entry in zip(entries, entries[1:]):
        if next_entry.level > current.level:
            current.has_children = True
    return entries


def normalize_words(text: str) -> set[str]:
    lowered = text.lower()
    return {
        word
        for word in re.findall(r"[a-z0-9а-яё]{3,}", lowered)
        if word not in {"with", "from", "that", "this", "have", "show", "when", "will", "there"}
    }


def split_identifier_words(text: str) -> list[str]:
    pieces = re.findall(r"[A-Z]+(?=[A-Z][a-z]|\d|$)|[A-Z]?[a-z]+|\d+", text)
    return [piece.lower() for piece in pieces if piece]


def trim_type_suffix(name: str) -> str:
    trimmed = name
    changed = True
    while changed:
        changed = False
        for suffix in TRAILING_TYPE_SUFFIXES:
            if trimmed.endswith(suffix) and len(trimmed) > len(suffix):
                trimmed = trimmed[: -len(suffix)]
                changed = True
                break
    return trimmed


def dedupe_keep_order(values: list[str]) -> list[str]:
    seen: set[str] = set()
    result: list[str] = []
    for value in values:
        if value not in seen:
            seen.add(value)
            result.append(value)
    return result


def humanize_identifier(name: str) -> str:
    words = split_identifier_words(name)
    if not words:
        return name
    return " ".join(word.upper() if len(word) <= 3 else word.capitalize() for word in words)


def display_modules(labels: list[str]) -> list[str]:
    filtered = [
        label
        for label in labels
        if split_identifier_words(label) and not set(split_identifier_words(label)).issubset(GENERIC_SEGMENTS)
    ]
    return filtered or labels[:1]


def module_terms_from_labels(labels: list[str]) -> list[str]:
    terms: list[str] = []
    for label in labels:
        terms.extend(term for term in split_identifier_words(label) if term not in GENERIC_SEGMENTS)
    if not terms:
        for label in labels:
            terms.extend(split_identifier_words(label))
    expanded: list[str] = []
    for term in terms:
        expanded.extend(sorted(MODULE_TERM_SYNONYMS.get(term, {term})))
    return dedupe_keep_order(expanded)


def build_path_signal(path: str) -> PathSignal:
    path_obj = Path(path)
    parts = list(path_obj.parts)
    labels: list[str] = []

    # Pick up package names like packages/uikit or apps/web
    for index, part in enumerate(parts):
        if part in ("packages", "apps") and index + 1 < len(parts):
            labels.append(parts[index + 1])

    stem = trim_type_suffix(path_obj.stem)
    parent_name = path_obj.parent.name
    if parent_name not in GENERIC_SEGMENTS and parent_name not in labels:
        parent_words = split_identifier_words(parent_name)
        if parent_words and not set(parent_words).issubset(GENERIC_SEGMENTS):
            labels.append(parent_name)
    if stem and stem not in labels:
        stem_words = split_identifier_words(stem)
        if stem_words and not set(stem_words).issubset(GENERIC_SEGMENTS):
            labels.append(stem)

    labels = dedupe_keep_order([label for label in labels if label])
    if not labels:
        labels = [path_obj.stem]

    search_terms = module_terms_from_labels(labels)
    focus = humanize_identifier(display_modules(labels)[0])
    return PathSignal(path=path, modules=labels, search_terms=search_terms, focus=focus)


def build_path_signals(files: list[DiffFile]) -> dict[str, PathSignal]:
    return {diff_file.path: build_path_signal(diff_file.path) for diff_file in files}


def categorize_files(files: list[DiffFile]) -> dict[str, list[str]]:
    categories: dict[str, list[str]] = {}
    for diff_file in files:
        lowered = diff_file.path.lower()
        matched = False
        for needle, category in PATH_CATEGORY_RULES:
            if needle in lowered:
                categories.setdefault(category, []).append(diff_file.path)
                matched = True
        if not matched:
            categories.setdefault("Shared infrastructure and uncategorized changes", []).append(diff_file.path)
    return {category: sorted(set(paths)) for category, paths in categories.items()}


def summarize_stats(files: list[DiffFile]) -> list[str]:
    counts: dict[str, int] = {}
    for diff_file in files:
        code = diff_file.status[0]
        counts[code] = counts.get(code, 0) + 1
    mapping = {"A": "added", "M": "modified", "D": "deleted", "R": "renamed", "C": "copied"}
    parts = []
    for code in ["M", "A", "R", "D", "C"]:
        if code in counts:
            parts.append(f"{counts[code]} {mapping.get(code, code.lower())}")
    return parts


def score_regress_entries(
    search_terms: set[str], regress_entries: list[RegressEntry]
) -> list[tuple[int, RegressEntry]]:
    scored: list[tuple[int, RegressEntry]] = []
    for entry in regress_entries:
        if entry.has_children:
            continue
        entry_words = normalize_words(" ".join(entry.chain))
        overlap = search_terms & entry_words
        if overlap:
            score = len(overlap) * 10 + min(len(entry.chain), 4) * 2 + min(len(entry.display_text), 80) // 20
            scored.append((score, entry))
    return sorted(scored, key=lambda item: (-item[0], item[1].line_no))


def category_search_terms(
    category: str, paths: list[str], path_signals: dict[str, PathSignal]
) -> set[str]:
    terms = set(CATEGORY_KEYWORDS.get(category, normalize_words(category)))
    for path in paths:
        terms.update(path_signals[path].search_terms)
    return terms


def select_regress_entries(
    categories: dict[str, list[str]],
    regress_entries: list[RegressEntry],
    path_signals: dict[str, PathSignal],
) -> list[tuple[str, RegressEntry]]:
    recommendations: list[tuple[str, RegressEntry, int]] = []
    seen: set[int] = set()
    for category, paths in categories.items():
        scored = score_regress_entries(
            category_search_terms(category, paths, path_signals), regress_entries
        )
        for score, entry in scored[:8]:
            if entry.line_no in seen:
                continue
            seen.add(entry.line_no)
            recommendations.append((category, entry, score))
    recommendations.sort(key=lambda item: item[1].line_no)
    return [(category, entry) for category, entry, _score in recommendations]


def render_selected_regress_rows(
    recommendations: list[tuple[str, RegressEntry]], regress_entries: list[RegressEntry]
) -> list[str]:
    selected_line_nos = {entry.line_no for _category, entry in recommendations}
    if not selected_line_nos:
        return []

    entries_by_line_no = {entry.line_no: entry for entry in regress_entries}
    included_section_line_nos: set[int] = set()
    for entry in regress_entries:
        if entry.line_no in selected_line_nos:
            included_section_line_nos.update(entry.parent_line_nos)

    rendered_lines: list[str] = []
    for entry in regress_entries:
        if entry.line_no in included_section_line_nos:
            rendered_lines.append(entry.raw_line)
        elif entry.line_no in selected_line_nos:
            indent = " " * (entry.level * 4)
            rendered_lines.append(f"{indent}{entry.display_text} [regress: {entry.line_no}]")
    return rendered_lines


def build_scope_section(
    platform: str,
    repo_path: Path,
    regress_path: Path,
    current_branch_name: str,
    compare_branch_name: str,
    current_sha: str,
    compare_sha: str,
    latest_release: str,
    tests_collection_path: Path,
    execution_date: str,
    assumptions: list[str],
) -> list[str]:
    return [
        f"- Platform: `{platform}`",
        f"- Repo path: `{repo_path}`",
        f"- Regress path: `{regress_path}`",
        f"- Current branch: `{current_branch_name}` at `{current_sha}`",
        f"- Compared against release branch: `{compare_branch_name}` at `{compare_sha}`",
        f"- Latest discovered release branch: `{latest_release}`",
        f"- Generated test collection path: `{tests_collection_path}`",
        f"- Execution date: `{execution_date}`",
        "- Assumptions:",
        *[f"- {item}" for item in assumptions],
    ]


def build_changed_areas(
    categories: dict[str, list[str]],
    path_signals: dict[str, PathSignal],
    diff_files: list[DiffFile],
    diff_stat: str,
    log_lines: list[str],
) -> list[str]:
    bullets: list[str] = []
    stats = ", ".join(summarize_stats(diff_files)) or "0 changed files"
    bullets.append(f"- Branch delta includes {len(diff_files)} changed files: {stats}")
    if diff_stat.strip():
        first_stat_line = diff_stat.splitlines()[-1]
        bullets.append(f"- Git diff summary: `{first_stat_line}`")
    if log_lines:
        bullets.append(f"- Unique branch commits in the comparison window: `{len(log_lines)}`")
    for category, paths in categories.items():
        sample = ", ".join(f"`{Path(path).name}`" for path in paths[:4])
        suffix = "" if len(paths) <= 4 else f", and {len(paths) - 4} more"
        bullets.append(f"- {category} changed in {len(paths)} file(s): {sample}{suffix}")
        modules = dedupe_keep_order(
            [module for path in paths for module in display_modules(path_signals[path].modules)]
        )
        if modules:
            bullets.append(
                f"- Highlighted modules/features: {', '.join(f'`{module}`' for module in modules[:6])}"
            )
    return bullets


def explain_unmatched_file(
    path: str, regress_entries: list[RegressEntry], path_signals: dict[str, PathSignal]
) -> UnmatchedFileInsight:
    signal = path_signals[path]
    matched_entries = score_regress_entries(set(signal.search_terms), regress_entries)
    if matched_entries:
        matched_lines = ", ".join(f"`{entry.line_no}`" for _score, entry in matched_entries[:3])
        coverage_note = (
            f"Search terms {', '.join(f'`{term}`' for term in signal.search_terms[:6])} "
            f"matched regress rows {matched_lines}."
        )
    else:
        coverage_note = (
            f"No regress rows matched {', '.join(f'`{term}`' for term in signal.search_terms[:6])}. "
            f"Treat `{signal.focus}` as new or uncovered functionality and add focused coverage."
        )
    suggested_test = (
        f"Exercise the `{signal.focus}` flow end to end: happy path, validation, backend/network failure, "
        "and the post-action state shown to the user."
    )
    return UnmatchedFileInsight(
        path=path,
        modules=signal.modules,
        search_terms=signal.search_terms,
        coverage_note=coverage_note,
        suggested_test=suggested_test,
    )


def build_unmatched_files_section(
    categories: dict[str, list[str]],
    regress_entries: list[RegressEntry],
    path_signals: dict[str, PathSignal],
) -> list[str]:
    unmatched_paths = categories.get("Shared infrastructure and uncategorized changes", [])
    if not unmatched_paths:
        return ["- All changed files matched at least one known QA area"]
    bullets = [f"- {len(unmatched_paths)} file(s) did not match a known QA area and need explicit review"]
    for path in unmatched_paths[:12]:
        insight = explain_unmatched_file(path, regress_entries, path_signals)
        bullets.append(f"- `{path}`")
        bullets.append(
            f"- Highlighted module(s): {', '.join(f'`{module}`' for module in display_modules(insight.modules)[:4])}"
        )
        bullets.append(f"- Regress search terms: {', '.join(f'`{term}`' for term in insight.search_terms[:6])}")
        bullets.append(f"- Coverage note: {insight.coverage_note}")
        bullets.append(f"- Suggested test: {insight.suggested_test}")
    if len(unmatched_paths) > 12:
        bullets.append(f"- {len(unmatched_paths) - 12} more unmatched file(s) remain for manual triage")
    return bullets


def build_existing_blocks(
    recommendations: list[tuple[str, RegressEntry]],
    categories: dict[str, list[str]],
    path_signals: dict[str, PathSignal],
) -> list[str]:
    if not recommendations:
        return ["- No confident existing `regress.txt` matches were found from simple keyword heuristics"]
    bullets: list[str] = []
    for category, entry in recommendations:
        modules = dedupe_keep_order(
            [module for path in categories.get(category, []) for module in display_modules(path_signals[path].modules)]
        )
        reason_target = ", ".join(f"`{module}`" for module in modules[:3]) if modules else f"`{category}`"
        bullets.append(f"- `{entry.line_no}`: {entry.display_text}")
        bullets.append(f"- Why: matched the updated area {reason_target}")
    return bullets


def build_missing_blocks(
    categories: dict[str, list[str]],
    regress_entries: list[RegressEntry],
    path_signals: dict[str, PathSignal],
) -> list[str]:
    bullets: list[str] = []
    seen = set()
    for category in categories:
        for item in MISSING_BLOCK_SUGGESTIONS.get(category, []):
            if item not in seen:
                seen.add(item)
                bullets.append(f"- {item}")
    unmatched_paths = categories.get("Shared infrastructure and uncategorized changes", [])
    for path in unmatched_paths:
        signal = path_signals[path]
        if score_regress_entries(set(signal.search_terms), regress_entries):
            continue
        module_names = ", ".join(f"`{module}`" for module in display_modules(signal.modules)[:3])
        search_terms = ", ".join(f'`{term}`' for term in signal.search_terms[:6])
        block = f"- Add a dedicated regression block for {module_names} using search terms {search_terms}"
        if block not in seen:
            seen.add(block)
            bullets.append(block)
    if not bullets:
        bullets.append("- No obvious missing regression blocks were inferred from the changed files alone")
    return bullets


def build_additional_checks(categories: dict[str, list[str]]) -> list[str]:
    bullets: list[str] = []
    seen = set()
    for category in categories:
        for item in ADDITIONAL_CHECK_SUGGESTIONS.get(category, []):
            if item not in seen:
                seen.add(item)
                bullets.append(f"- {item}")
    if "Localization" not in categories:
        bullets.append("- Smoke one default-locale flow after the release build is installed")
    # Always suggest cross-target smoke for web projects
    bullets.append("- Smoke the changed flows on all affected targets: web, extension, desktop, twa")
    return bullets


def build_open_questions(
    categories: dict[str, list[str]], recommendations: list[tuple[str, RegressEntry]]
) -> list[str]:
    bullets = [
        "- This local runner uses heuristics for mapping changed files to regress coverage; review the recommended rows before execution",
    ]
    if not recommendations:
        bullets.append("- No strong `regress.txt` matches were found, so the report likely needs manual QA curation")
    if "Shared infrastructure and uncategorized changes" in categories:
        bullets.append("- Some files did not match a known QA area and may need manual triage")
    return bullets


def bullet_payload(line: str) -> str:
    return line[2:] if line.startswith("- ") else line


def replace_or_append_sections(existing: str, sections: dict[str, list[str]]) -> str:
    if not existing.strip():
        lines = ["# TK Impact Analysis Report", ""]
        for name in SECTION_ORDER:
            lines.extend([f"## {name}", "", *sections[name], ""])
        return "\n".join(lines).rstrip() + "\n"

    rendered = existing
    for index, name in enumerate(SECTION_ORDER):
        next_name = SECTION_ORDER[index + 1] if index + 1 < len(SECTION_ORDER) else None
        body = "\n".join(sections[name]).rstrip()
        replacement = f"## {name}\n\n{body}\n"
        pattern = (
            rf"## {re.escape(name)}\n.*?(?=\n## {re.escape(next_name)}\n|\Z)"
            if next_name
            else rf"## {re.escape(name)}\n.*\Z"
        )
        if re.search(pattern, rendered, flags=re.S):
            rendered = re.sub(pattern, replacement, rendered, count=1, flags=re.S)
        else:
            rendered = rendered.rstrip() + f"\n\n{replacement}"
    return rendered.rstrip() + "\n"


def build_test_collection(
    platform: str,
    current_branch_name: str,
    compare_branch_name: str,
    recommendations: list[tuple[str, RegressEntry]],
    categories: dict[str, list[str]],
    regress_entries: list[RegressEntry],
    path_signals: dict[str, PathSignal],
    missing_blocks: list[str],
    additional_checks: list[str],
) -> str:
    lines = [f"{platform} {current_branch_name} vs {compare_branch_name} impact suite"]
    selected_regress_lines = render_selected_regress_rows(recommendations, regress_entries)
    lines.extend(selected_regress_lines)
    unmatched_paths = categories.get("Shared infrastructure and uncategorized changes", [])
    if unmatched_paths:
        lines.append("    Changed files without known QA area")
        for path in unmatched_paths[:12]:
            insight = explain_unmatched_file(path, regress_entries, path_signals)
            lines.append(f"        Review `{path}` [reason: unmatched file]")
            lines.append(
                f"        Search {', '.join(f'`{term}`' for term in insight.search_terms[:6])} in regress "
                "[reason: module-aware lookup]"
            )
            lines.append(f"        {insight.suggested_test} [reason: uncovered module flow]")
    if missing_blocks:
        lines.append("    Missing Blocks to add")
        for item in missing_blocks:
            lines.append(f"        {bullet_payload(item)} [reason: missing block]")
    if additional_checks:
        lines.append("    Additional checks")
        for item in additional_checks:
            lines.append(f"        {bullet_payload(item)} [reason: additional check]")
    if len(lines) == 1:
        lines.extend(
            [
                "    Impact block",
                "        Review recommended tests manually [reason: no confident matches found]",
            ]
        )
    return "\n".join(lines) + "\n"


def write_text(path: Path, content: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(content, encoding="utf-8")


def render_console_summary(
    report_path: Path,
    tests_collection_path: Path,
    categories: dict[str, list[str]],
    recommendations: list[tuple[str, RegressEntry]],
) -> str:
    lines = [
        f"Report written to: {report_path}",
        f"Test collection written to: {tests_collection_path}",
        f"Changed QA areas: {', '.join(categories) if categories else 'none'}",
        f"Recommended existing regress rows: {len(recommendations)}",
    ]
    return "\n".join(lines)


def main() -> int:
    args = parse_args()
    defaults = DEFAULTS[args.platform]
    default_repo_path = discover_source_repository(SKILL_DIR)
    if default_repo_path is None:
        print(
            "Missing required path: source repository was not detected automatically. "
            "Place the skill inside a git repository or pass `--repo-path/--source-repository`.",
            file=sys.stderr,
        )
        return 1

    repo_path = resolve_path(args.repo_path, default_repo_path)
    regress_path = resolve_path(args.regress_path, defaults["regress"])
    report_path = resolve_path(
        args.report_path,
        SKILL_DIR / "reports" / args.date / args.platform / "report.md",
    )
    tests_collection_path = resolve_path(
        args.tests_collection_path,
        SKILL_DIR / "reports" / args.date / args.platform / "test-collection.txt",
    )

    missing = [str(path) for path in [repo_path, regress_path] if not path.exists()]
    if missing:
        for path in missing:
            print(f"Missing required path: {path}", file=sys.stderr)
        return 1

    try:
        fetch_summary = fetch_release_branches(repo_path, args.platform, args.date)
        comparison = plan_comparison(repo_path, args.base_branch, args.release_branch)
        current_sha, compare_sha = ensure_git_inputs(repo_path, comparison.current_ref, comparison.compare_ref)
        diff_files = read_diff_files(repo_path, comparison.current_ref, comparison.compare_ref)
        diff_stat = run_git(
            repo_path, "diff", "--stat", f"{comparison.current_ref}...{comparison.compare_ref}"
        )
        log_output = run_git(
            repo_path,
            "log",
            "--left-right",
            "--cherry-pick",
            "--oneline",
            f"{comparison.current_ref}...{comparison.compare_ref}",
        )
    except RuntimeError as exc:
        print(str(exc), file=sys.stderr)
        return 1

    regress_entries = read_regress_entries(regress_path)
    categories = categorize_files(diff_files)
    path_signals = build_path_signals(diff_files)
    recommendations = select_regress_entries(categories, regress_entries, path_signals)

    assumptions = [
        f"Comparison uses `{comparison.current_branch}...{comparison.compare_branch}`",
        comparison.comparison_reason,
        "Coverage mapping is heuristic and should be reviewed before execution",
    ]
    if fetch_summary:
        assumptions.append("Release refs were refreshed from `origin` before branch selection")
    if not args.repo_path:
        assumptions.append("Source repository was auto-detected from the nearest parent git repository")

    missing_blocks = build_missing_blocks(categories, regress_entries, path_signals)
    additional_checks = build_additional_checks(categories)

    sections = {
        "Scope": build_scope_section(
            platform=args.platform,
            repo_path=repo_path,
            regress_path=regress_path,
            current_branch_name=comparison.current_branch,
            compare_branch_name=comparison.compare_branch,
            current_sha=current_sha,
            compare_sha=compare_sha,
            latest_release=comparison.latest_release,
            tests_collection_path=tests_collection_path,
            execution_date=args.date,
            assumptions=assumptions,
        ),
        "Changed Areas": build_changed_areas(
            categories=categories,
            path_signals=path_signals,
            diff_files=diff_files,
            diff_stat=diff_stat,
            log_lines=[line for line in log_output.splitlines() if line.strip()],
        ),
        "Changed Files Without Known QA Area": build_unmatched_files_section(
            categories, regress_entries, path_signals
        ),
        "Run These Existing Regression Blocks": build_existing_blocks(recommendations, categories, path_signals),
        "Add These Missing Blocks": missing_blocks,
        "Additional Checks": additional_checks,
        "Open Questions": build_open_questions(categories, recommendations),
    }

    if report_path.exists():
        existing_report = report_path.read_text(encoding="utf-8")
    else:
        existing_report = REPORT_TEMPLATE.read_text(encoding="utf-8")
    report_body = replace_or_append_sections(existing_report, sections)
    write_text(report_path, report_body)

    test_collection_body = build_test_collection(
        platform=args.platform,
        current_branch_name=comparison.current_branch,
        compare_branch_name=comparison.compare_branch,
        recommendations=recommendations,
        categories=categories,
        regress_entries=regress_entries,
        path_signals=path_signals,
        missing_blocks=missing_blocks,
        additional_checks=additional_checks,
    )
    write_text(tests_collection_path, test_collection_body)

    if args.write_raw:
        raw_bundle = "\n\n".join(
            [
                "# git diff --name-status",
                "\n".join(f"{item.status}\t{item.path}" for item in diff_files),
                "# git diff --stat",
                diff_stat,
                "# git log --left-right --cherry-pick --oneline",
                log_output,
            ]
        ).rstrip() + "\n"
        write_text(report_path.with_name("raw-git-data.txt"), raw_bundle)

    print(render_console_summary(report_path, tests_collection_path, categories, recommendations))
    return 0


if __name__ == "__main__":
    sys.exit(main())
