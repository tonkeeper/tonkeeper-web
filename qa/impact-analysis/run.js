#!/usr/bin/env node
/**
 * Impact Analysis — Web
 *
 * Usage:
 *   node qa/impact-analysis/run.js --base v4.6.1 --head main
 *   node qa/impact-analysis/run.js --base v4.6.1 --head main --checklist qa/master-checklist.csv
 *   node qa/impact-analysis/run.js --base v4.6.1 --head main --out qa/regression-out.md
 *
 * Options:
 *   --base        Base branch / tag / commit  (required)
 *   --head        Head branch / tag / commit  (default: HEAD)
 *   --checklist   Path to master CSV checklist (default: qa/master-checklist.csv)
 *   --out         Output markdown file (default: stdout)
 *   --csv-out     Output filtered CSV file (optional)
 *   --platform    Filter platforms: Web|Desktop|Extension|Mobile|TWA (comma-separated, default: all)
 *   --min-prio    Minimum priority to include: P0|P1|P2|P3 (default: P2)
 *   --diff-file   Read diff from file instead of git (for CI / pre-computed diffs)
 *   --verbose     Print debug info about file → module mapping
 */

'use strict';

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// ─── Parse args ──────────────────────────────────────────────────────────────

const args = process.argv.slice(2);
function getArg(name) {
  const i = args.indexOf(name);
  return i !== -1 ? args[i + 1] : null;
}
function hasFlag(name) {
  return args.includes(name);
}

const base = getArg('--base');
const head = getArg('--head') || 'HEAD';
const checklistPath = getArg('--checklist') || 'qa/master-checklist.csv';
const outFile = getArg('--out');
const csvOutFile = getArg('--csv-out');
const platformFilter = getArg('--platform') ? getArg('--platform').split(',').map(s => s.trim()) : null;
const minPrio = getArg('--min-prio') || 'P2';
const diffFile = getArg('--diff-file');
const verbose = hasFlag('--verbose');

if (!base) {
  console.error('Error: --base is required. Example: node run.js --base v4.6.1 --head main');
  process.exit(1);
}

const PRIO_ORDER = ['P0', 'P1', 'P2', 'P3'];
const minPrioIdx = PRIO_ORDER.indexOf(minPrio);

// ─── Load config ─────────────────────────────────────────────────────────────

const configPath = path.join(__dirname, 'areas.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// ─── Get diff ────────────────────────────────────────────────────────────────

let changedFiles;
if (diffFile) {
  changedFiles = fs.readFileSync(diffFile, 'utf8').split('\n').filter(Boolean);
} else {
  try {
    const raw = execSync(`git diff --name-only ${base}...${head}`, { encoding: 'utf8' });
    changedFiles = raw.split('\n').filter(Boolean);
  } catch (e) {
    console.error(`git diff failed: ${e.message}`);
    process.exit(1);
  }
}

if (verbose) {
  console.error(`[verbose] Changed files (${changedFiles.length}):`);
  changedFiles.forEach(f => console.error(`  ${f}`));
}

// ─── Map files → modules + collect device hints ──────────────────────────────

function matchesPattern(filePath, pattern) {
  // Convert glob pattern to regex: ** matches any path segment
  const escaped = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*\*/g, '__DOUBLE_STAR__')
    .replace(/\*/g, '[^/]*')
    .replace(/__DOUBLE_STAR__/g, '.*');
  return new RegExp(`^${escaped}$`).test(filePath);
}

const affectedModules = new Set();
const affectedScopes = new Set();
// deviceReasons: device → Set of reasons (pattern notes) why it's needed
const deviceReasons = {};
const fileToModules = {};
let fullRegressionTriggered = false;
const fullRegressionFiles = [];

function addDevice(device, reason) {
  if (!deviceReasons[device]) deviceReasons[device] = new Set();
  deviceReasons[device].add(reason);
}

const unmatchedFiles = [];

for (const file of changedFiles) {
  let matched = false;
  for (const entry of config.patterns) {
    if (matchesPattern(file, entry.pattern)) {
      matched = true;
      if (entry.modules.includes('_FULL_REGRESSION_')) {
        fullRegressionTriggered = true;
        fullRegressionFiles.push({ file, reason: entry.note || entry.pattern });
        break;
      }
      if (entry.modules.includes('_IGNORE_')) {
        break; // known non-functional file — matched but no modules added
      }
      entry.modules.forEach(m => affectedModules.add(m));
      if (entry.platformScope) affectedScopes.add(entry.platformScope);
      if (entry.devices) {
        const reason = entry.note || entry.modules.join(', ');
        entry.devices.forEach(d => addDevice(d, reason));
      }
      if (verbose) {
        fileToModules[file] = fileToModules[file] || [];
        fileToModules[file].push({ modules: entry.modules, pattern: entry.pattern });
      }
      break; // first matching pattern wins
    }
  }
  if (!matched) unmatchedFiles.push(file);
}

if (fullRegressionTriggered) {
  config._fullRegressionModules.forEach(m => affectedModules.add(m));
  affectedScopes.add('Shared');
  // Full regression → require all platforms
  if (config._deviceMatrix) {
    for (const [platform, info] of Object.entries(config._deviceMatrix)) {
      if (!info || !Array.isArray(info.required)) continue;
      info.required.forEach(d => addDevice(d, `Full regression (${platform})`));
    }
  }
}

// Expand aliases
for (const [alias, targets] of Object.entries(config.moduleAliases || {})) {
  if (affectedModules.has(alias)) {
    targets.forEach(t => affectedModules.add(t));
  }
}

// Smoke is always included when there are any affected modules
if (affectedModules.size > 0) {
  affectedModules.add('Smoke');
}

if (verbose) {
  console.error('\n[verbose] File → Module mapping:');
  for (const [f, mappings] of Object.entries(fileToModules)) {
    console.error(`  ${f} → ${mappings.map(m => m.modules.join(',')).join(' | ')}`);
  }
  if (fullRegressionTriggered) {
    console.error('\n[verbose] Full regression triggered by:');
    fullRegressionFiles.forEach(({ file, reason }) => console.error(`  ${file} (${reason})`));
  }
}

// ─── Load checklist CSV ──────────────────────────────────────────────────────

function parseCsv(raw) {
  const lines = raw.split('\n').filter(Boolean);
  if (lines.length === 0) return { headers: [], rows: [] };
  const headers = splitCsvLine(lines[0]);
  const rows = lines.slice(1).map(line => {
    const values = splitCsvLine(line);
    const row = {};
    headers.forEach((h, i) => { row[h] = values[i] || ''; });
    return row;
  });
  return { headers, rows };
}

function splitCsvLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; }
      else { inQuotes = !inQuotes; }
    } else if (ch === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += ch;
    }
  }
  result.push(current.trim());
  return result;
}

function quoteCsv(val) {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

// ─── TestPad CSV parser ───────────────────────────────────────────────────────

function isTestpadFormat(raw) {
  const firstNonEmpty = raw.split('\n').find(l => l.trim() !== '');
  if (firstNonEmpty && firstNonEmpty.startsWith('v3,')) return true;
  // Also check for the data header anywhere in first 30 lines
  const lines30 = raw.split('\n').slice(0, 30);
  return lines30.some(l => l.trim() === 'number,indent,text,tags,notes');
}

function parseTestpadCsv(raw) {
  const allLines = raw.split('\n');
  // Find the data section starting at the header line
  const headerIdx = allLines.findIndex(l => l.trim() === 'number,indent,text,tags,notes');
  if (headerIdx === -1) return [];

  const dataLines = allLines.slice(headerIdx + 1);

  // Parse rows — rows can span multiple lines due to quoted fields with newlines
  const rows = [];
  let buffer = '';
  let inQuotes = false;
  for (const rawLine of dataLines) {
    if (buffer.length > 0) buffer += '\n';
    buffer += rawLine;
    // Count unescaped quotes
    for (let i = 0; i < rawLine.length; i++) {
      if (rawLine[i] === '"') {
        if (rawLine[i + 1] === '"') { i++; } // escaped quote
        else { inQuotes = !inQuotes; }
      }
    }
    if (!inQuotes) {
      if (buffer.trim() !== '') {
        const vals = splitCsvLine(buffer);
        rows.push(vals);
      }
      buffer = '';
    }
  }

  // Build structured items tracking hierarchy
  // sectionByDepth: depth (1-based) → section name
  const sectionByDepth = {};
  const items = [];

  for (const vals of rows) {
    const num = (vals[0] || '').trim();
    const indent = parseInt((vals[1] || '0').trim(), 10);
    const text = (vals[2] || '').trim();
    const tags = (vals[3] || '').trim();
    const notes = (vals[4] || '').trim();

    if (!num || isNaN(indent)) continue;

    // Update hierarchy: clear deeper levels
    for (const k of Object.keys(sectionByDepth)) {
      if (parseInt(k, 10) >= indent) delete sectionByDepth[k];
    }
    if (text) sectionByDepth[indent] = text;

    // Determine top-level section (indent=1 ancestor)
    const topSection = sectionByDepth[1] || '';

    // Determine modules from _testpadSectionModules
    // Support both exact match and prefix match (e.g. "Desktop App [DESKTOP ONLY]" → "Desktop App")
    const sectionMap = config._testpadSectionModules || {};
    let modules = sectionMap[topSection];
    if (!modules) {
      const matchKey = Object.keys(sectionMap).find(k => topSection.startsWith(k) || k.startsWith(topSection));
      modules = matchKey ? sectionMap[matchKey] : [];
    }

    // Determine platform from tags (format: platform:Web;Desktop)
    let platforms = [];
    const platformMatch = tags.match(/platform:([^,\s]+)/i);
    if (platformMatch) {
      platforms = platformMatch[1].split(';').map(s => s.trim()).filter(Boolean);
    }

    // Determine priority from tags (format: priority:P1)
    let priority = null;
    const prioMatch = tags.match(/priority:(P\d)/i);
    if (prioMatch) {
      priority = prioMatch[1].toUpperCase();
    }

    items.push({
      num: parseInt(num, 10),
      indent,
      text,
      tags,
      notes,
      topSection,
      modules,
      platforms,
      priority,
      sectionPath: { ...sectionByDepth },
    });
  }

  return items;
}

function assignTestpadPriority(items) {
  // Mark leaves: an item is a leaf (actual test case) if its next sibling has
  // indent <= this item's indent (i.e. no children follow it in the list).
  // Section headers (indent=1) and subsections (indent=2) are never leaves.
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const nextIndent = i + 1 < items.length ? items[i + 1].indent : 0;
    item.isLeaf = item.indent >= 3 && nextIndent <= item.indent;
  }

  const maxIndent = Math.max(...items.map(i => i.indent), 1);
  for (const item of items) {
    if (item.priority) continue; // already set via tag
    if (item.indent === 1) { item.priority = 'P0'; }
    else if (item.indent >= maxIndent) { item.priority = 'P2'; }
    else { item.priority = 'P1'; }
  }
}

// ─── Load checklist CSV ───────────────────────────────────────────────────────

let checklist = null;
let testpadItems = null;
let isTestpad = false;

if (fs.existsSync(checklistPath)) {
  const raw = fs.readFileSync(checklistPath, 'utf8');
  isTestpad = isTestpadFormat(raw);
  if (isTestpad) {
    testpadItems = parseTestpadCsv(raw);
    assignTestpadPriority(testpadItems);
  } else {
    checklist = parseCsv(raw);
  }
} else {
  console.error(`Warning: checklist not found at ${checklistPath}. Generating impact report only.`);
}

// ─── Filter test cases ───────────────────────────────────────────────────────

let filtered = [];
let filteredTestpad = [];

if (isTestpad && testpadItems) {
  // Only select leaf-level items (actual test cases, not section/subsection headers)
  const leafItems = testpadItems.filter(item => {
    // Must be a leaf (actual test case), have text, and skip blank separators
    if (!item.text) return false;
    if (!item.isLeaf) return false;

    // Module match — item must map to at least one affected module
    const hasModule = item.modules.some(m => affectedModules.has(m));
    if (!hasModule) return false;

    // Priority filter
    const prioIdx = PRIO_ORDER.indexOf(item.priority || 'P3');
    if (prioIdx === -1 || prioIdx > minPrioIdx) return false;

    // Platform filter
    if (platformFilter && item.platforms.length > 0) {
      const hasMatch = platformFilter.some(pf => item.platforms.includes(pf));
      if (!hasMatch) return false;
    }

    return true;
  });

  // Build a set of matched item numbers for ancestor lookup
  const matchedNums = new Set(leafItems.map(i => i.num));

  // Include ancestors (indent < leaf) for display context, tagged as structural
  const byNum = {};
  for (const item of testpadItems) byNum[item.num] = item;

  // Track which ancestors are needed
  const ancestorNums = new Set();
  const indentStack = {};
  for (const item of testpadItems) {
    indentStack[item.indent] = item.num;
    if (matchedNums.has(item.num)) {
      for (let lvl = 1; lvl < item.indent; lvl++) {
        if (indentStack[lvl] != null) ancestorNums.add(indentStack[lvl]);
      }
    }
  }

  // Combine: ancestors (structural) + leaf matches, in original order
  filteredTestpad = testpadItems.filter(item =>
    matchedNums.has(item.num) || ancestorNums.has(item.num)
  ).map(item => ({ ...item, _structural: !matchedNums.has(item.num) }));
} else if (checklist) {
  filtered = checklist.rows.filter(row => {
    // Module match
    const rowModule = (row['Module'] || row['Category'] || '').trim();
    if (!affectedModules.has(rowModule)) return false;

    // Priority filter
    const prio = (row['Priority'] || '').trim();
    const prioIdx = PRIO_ORDER.indexOf(prio);
    if (prioIdx === -1 || prioIdx > minPrioIdx) return false;

    // Platform filter
    if (platformFilter) {
      const rowPlatforms = (row['Platform'] || '').split(';').map(s => s.trim());
      const hasMatch = platformFilter.some(pf => rowPlatforms.includes(pf));
      if (!hasMatch) return false;
    }

    return true;
  });
}

// Unified count for summary — count only real test cases (leaf items), not structural ancestors
const totalFiltered = isTestpad
  ? filteredTestpad.filter(i => !i._structural).length
  : filtered.length;

// ─── Build output ────────────────────────────────────────────────────────────

const now = new Date().toISOString().slice(0, 10);
const lines = [];

lines.push(`# Impact Analysis: \`${base}\` → \`${head}\``);
lines.push(`_Generated: ${now}_`);
lines.push('');

// Summary
lines.push('## Summary');
lines.push('');
lines.push(`| | |`);
lines.push(`|---|---|`);
lines.push(`| Base | \`${base}\` |`);
lines.push(`| Head | \`${head}\` |`);
lines.push(`| Changed files | ${changedFiles.length} |`);
lines.push(`| Affected modules | ${[...affectedModules].filter(m => m !== 'Smoke').sort().join(', ') || '—'} |`);
lines.push(`| Platform scopes | ${[...affectedScopes].sort().join(', ') || '—'} |`);
lines.push(`| Test cases selected | ${totalFiltered} |`);
lines.push(`| Min priority | ${minPrio} |`);
if (platformFilter) lines.push(`| Platform filter | ${platformFilter.join(', ')} |`);
lines.push('');

if (fullRegressionTriggered) {
  lines.push('> **⚠ Full regression triggered** — generic `packages/core` or `packages/uikit` changes detected.');
  lines.push('> Review the file list below and narrow the scope if changes are isolated.');
  lines.push('');
}

// Changed files by area
lines.push('## Changed files');
lines.push('');

const byArea = {};
for (const file of changedFiles) {
  let matched = false;
  for (const entry of config.patterns) {
    if (matchesPattern(file, entry.pattern)) {
      const key = entry.modules.includes('_FULL_REGRESSION_')
        ? `⚠ Broad (${entry.note || entry.pattern})`
        : entry.modules.join(', ');
      byArea[key] = byArea[key] || [];
      byArea[key].push(file);
      matched = true;
      break;
    }
  }
  if (!matched) {
    byArea['Other / uncategorised'] = byArea['Other / uncategorised'] || [];
    byArea['Other / uncategorised'].push(file);
  }
}

for (const [area, files] of Object.entries(byArea).sort()) {
  lines.push(`<details><summary><strong>${area}</strong> (${files.length} files)</summary>`);
  lines.push('');
  files.forEach(f => lines.push(`- \`${f}\``));
  lines.push('');
  lines.push('</details>');
  lines.push('');
}

// Affected modules checklist
lines.push('## Affected modules');
lines.push('');
const sortedModules = [...affectedModules].filter(m => m !== 'Smoke').sort();
if (sortedModules.length === 0) {
  lines.push('No modules affected (no matched patterns).');
} else {
  sortedModules.forEach(m => lines.push(`- [ ] **${m}**`));
}
lines.push('');

// ── Platform & Device Matrix ─────────────────────────────────────────────────
{
  const deviceMatrix = config._deviceMatrix || {};

  // Determine which top-level platforms are touched by affected scopes / modules
  const platformTokens = new Set();

  if (affectedScopes.has('Shared') || affectedScopes.has('Desktop-layout') || fullRegressionTriggered) {
    platformTokens.add('Web');
    platformTokens.add('Desktop');
  }
  if (affectedScopes.has('Shared') || fullRegressionTriggered) {
    platformTokens.add('Web');
    platformTokens.add('Extension');
    platformTokens.add('Mobile');
    platformTokens.add('TWA');
  }
  if (affectedScopes.has('Extension-only')) platformTokens.add('Extension');
  if (affectedScopes.has('Mobile-only'))    platformTokens.add('Mobile');
  if (affectedScopes.has('TWA-limited'))    platformTokens.add('TWA');
  if (affectedScopes.has('Web-only'))       platformTokens.add('Web');
  if (affectedScopes.has('Desktop-layout')) platformTokens.add('Desktop');

  // Populate deviceReasons from _deviceMatrix for each touched platform
  for (const pt of platformTokens) {
    if (deviceMatrix[pt]) {
      deviceMatrix[pt].required.forEach(d => addDevice(d, `${pt} scope in diff`));
    }
  }

  const allDevices = Object.keys(deviceReasons).sort();

  if (allDevices.length > 0) {
    lines.push('## Platform & Device Matrix');
    lines.push('');
    lines.push('Devices that **must** be covered based on the diff. ✓ = required, ~ = recommended, — = not applicable.');
    lines.push('');

    // Group devices by platform
    const PLATFORM_ORDER = ['Web', 'Desktop', 'Extension', 'Mobile', 'TWA'];
    const devicesByPlatform = {};
    for (const pt of PLATFORM_ORDER) {
      if (!platformTokens.has(pt)) continue;
      const info = deviceMatrix[pt];
      if (!info) continue;
      devicesByPlatform[pt] = {
        required: info.required,
        recommended: info.recommended,
        note: info.note,
      };
    }

    for (const [platform, info] of Object.entries(devicesByPlatform)) {
      lines.push(`### ${platform}`);
      if (info.note) lines.push(`> ${info.note}`);
      lines.push('');
      info.required.forEach(d => {
        const reasons = deviceReasons[d] ? [...deviceReasons[d]] : [];
        const reasonStr = reasons.length ? ` — _${reasons.slice(0, 2).join('; ')}_` : '';
        lines.push(`- ✓ **${d}**${reasonStr}`);
      });
      info.recommended.forEach(d => {
        lines.push(`- ~ ${d}`);
      });
      lines.push('');
    }

    // Web-only cases callout (old format only)
    if (!isTestpad && checklist && filtered.length > 0 && platformTokens.has('Web')) {
      const webOnlyRows = filtered.filter(r => {
        const plats = (r['Platform'] || '').split(';').map(s => s.trim());
        return plats.length === 1 && plats[0] === 'Web';
      });
      if (webOnlyRows.length > 0) {
        lines.push('#### Web-only cases (cannot be covered on other platforms)');
        lines.push('');
        lines.push('| ID | Prio | Title |');
        lines.push('|---|---|---|');
        webOnlyRows.forEach(r => lines.push(`| ${r['ID']} | ${r['Priority']} | ${r['Title']} |`));
        lines.push('');
      }
    }

    // Mobile-exclusive cases callout (old format only)
    if (!isTestpad && checklist && filtered.length > 0 && platformTokens.has('Mobile')) {
      const mobileOnlyRows = filtered.filter(r => {
        const plats = (r['Platform'] || '').split(';').map(s => s.trim());
        const scope = (r['PlatformScope'] || '').trim();
        return scope === 'Mobile-only' || (plats.length === 1 && plats[0] === 'Mobile');
      });
      if (mobileOnlyRows.length > 0) {
        lines.push('#### Mobile-only cases');
        lines.push('');
        lines.push('| ID | Prio | Title |');
        lines.push('|---|---|---|');
        mobileOnlyRows.forEach(r => lines.push(`| ${r['ID']} | ${r['Priority']} | ${r['Title']} |`));
        lines.push('');
      }
    }

    // Desktop-layout cases callout (old format only)
    if (!isTestpad && checklist && filtered.length > 0 && platformTokens.has('Desktop')) {
      const desktopRows = filtered.filter(r => {
        const scope = (r['PlatformScope'] || '').trim();
        return scope === 'Desktop-layout';
      });
      if (desktopRows.length > 0) {
        lines.push('#### Desktop-layout cases (Web AppDesktop + Electron — test on macOS **and** Windows)');
        lines.push('');
        lines.push('| ID | Prio | Platform | Title |');
        lines.push('|---|---|---|---|');
        desktopRows.forEach(r => {
          const plat = (r['Platform'] || '').replace(/;/g, ', ');
          lines.push(`| ${r['ID']} | ${r['Priority']} | ${plat} | ${r['Title']} |`);
        });
        lines.push('');
      }
    }

    // Extension-only cases callout (old format only)
    if (!isTestpad && checklist && filtered.length > 0 && platformTokens.has('Extension')) {
      const extRows = filtered.filter(r => (r['PlatformScope'] || '').trim() === 'Extension-only');
      if (extRows.length > 0) {
        lines.push('#### Extension-only cases (test Chrome MV3 **and** Firefox MV2)');
        lines.push('');
        lines.push('| ID | Prio | Title |');
        lines.push('|---|---|---|');
        extRows.forEach(r => lines.push(`| ${r['ID']} | ${r['Priority']} | ${r['Title']} |`));
        lines.push('');
      }
    }
  }
}

// Test cases — TestPad format
if (isTestpad && filteredTestpad.length > 0) {
  const leafCount = filteredTestpad.filter(i => !i._structural).length;
  lines.push(`## Test cases (${leafCount} selected)`);
  lines.push('');

  // Stats per module — only count real test cases (not structural ancestors)
  const tpByModule = {};
  for (const item of filteredTestpad.filter(i => !i._structural)) {
    const mods = item.modules.length > 0 ? item.modules : ['Other'];
    for (const m of mods) {
      if (!affectedModules.has(m)) continue;
      tpByModule[m] = tpByModule[m] || [];
      tpByModule[m].push(item);
    }
  }

  lines.push('| Module | P0 | P1 | P2 | Total |');
  lines.push('|---|---|---|---|---|');
  for (const [mod, items] of Object.entries(tpByModule).sort()) {
    const p0 = items.filter(i => i.priority === 'P0').length;
    const p1 = items.filter(i => i.priority === 'P1').length;
    const p2 = items.filter(i => i.priority === 'P2').length;
    lines.push(`| ${mod} | ${p0} | ${p1} | ${p2} | ${items.length} |`);
  }
  lines.push('');

  // Hierarchical checklist per module (grouped by topSection)
  // Collect unique top sections that appear in filteredTestpad
  const filteredNums = new Set(filteredTestpad.map(i => i.num));
  const topSections = [...new Set(filteredTestpad.map(i => i.topSection))];

  for (const section of topSections) {
    const sectionItems = filteredTestpad.filter(i => i.topSection === section);
    if (sectionItems.length === 0) continue;

    // Find the min indent to determine nesting offset
    const minIndent = Math.min(...sectionItems.map(i => i.indent));

    lines.push(`### ${section}`);
    lines.push('');

    for (const item of sectionItems) {
      const depth = item.indent - minIndent; // 0 = top of this section's items
      const indent = '  '.repeat(depth);
      const prioStr = item.priority ? ` (${item.priority})` : '';
      lines.push(`${indent}- [ ] **${item.num}**${prioStr} ${item.text}`);
    }
    lines.push('');
  }
} else if (isTestpad) {
  lines.push('## Test cases');
  lines.push('');
  lines.push('_No test cases matched the affected modules and filters._');
  lines.push('');
}

// Test cases — old column-based format
if (!isTestpad && checklist && filtered.length > 0) {
  const byModule = {};
  filtered.forEach(row => {
    const mod = row['Module'] || row['Category'] || 'Other';
    byModule[mod] = byModule[mod] || [];
    byModule[mod].push(row);
  });

  lines.push(`## Test cases (${filtered.length} selected)`);
  lines.push('');

  // Stats per module
  lines.push('| Module | P0 | P1 | P2 | Total |');
  lines.push('|---|---|---|---|---|');
  for (const [mod, rows] of Object.entries(byModule).sort()) {
    const p0 = rows.filter(r => r['Priority'] === 'P0').length;
    const p1 = rows.filter(r => r['Priority'] === 'P1').length;
    const p2 = rows.filter(r => r['Priority'] === 'P2').length;
    lines.push(`| ${mod} | ${p0} | ${p1} | ${p2} | ${rows.length} |`);
  }
  lines.push('');

  // Detailed tables per module
  for (const [mod, rows] of Object.entries(byModule).sort()) {
    lines.push(`### ${mod}`);
    lines.push('');
    lines.push('| ID | Prio | Platform | Title | Steps | Expected |');
    lines.push('|---|---|---|---|---|---|');
    rows.forEach(row => {
      const id = row['ID'] || '';
      const prio = row['Priority'] || '';
      const plat = (row['Platform'] || '').replace(/;/g, ', ');
      const title = row['Title'] || '';
      const steps = (row['Steps'] || '').replace(/\n/g, ' ');
      const expected = (row['Expected'] || '').replace(/\n/g, ' ');
      lines.push(`| ${id} | ${prio} | ${plat} | ${title} | ${steps} | ${expected} |`);
    });
    lines.push('');
  }
} else if (!isTestpad && checklist) {
  lines.push('## Test cases');
  lines.push('');
  lines.push('_No test cases matched the affected modules and filters._');
  lines.push('');
} else if (!isTestpad) {
  lines.push('## Test cases');
  lines.push('');
  lines.push(`_No checklist found at \`${checklistPath}\`. Run with an existing CSV to get filtered test cases._`);
  lines.push('');
}

const output = lines.join('\n');

// ─── Write output ─────────────────────────────────────────────────────────────

if (outFile) {
  fs.writeFileSync(outFile, output, 'utf8');
  console.log(`Impact report written to: ${outFile}`);
} else {
  console.log(output);
}

if (csvOutFile) {
  if (isTestpad && testpadItems) {
    // ── iOS-style indented TXT export ──────────────────────────────────────
    // Format mirrors tk-impact-analysis iOS/Android tool:
    //   Web v4.6.1 vs v4.7.0 impact suite
    //       Section name
    //           Test item text [regress: NNN]
    //       Changed files without known QA area
    //           Review `path/to/file` [reason: unmatched file]
    //       Additional checks
    //           ...

    const leafItems = filteredTestpad.filter(i => !i._structural);
    const leafCount = leafItems.length;

    const txtLines = [];
    txtLines.push(`Web ${base} vs ${head} impact suite`);

    // Render the full section hierarchy for all leaf items.
    // We walk items in original checklist order (filteredTestpad is already sorted).
    // Track the last-printed label at each depth so we only emit a header once.
    // Depth mapping: indent=1 → depth 1 (4 spaces), indent=2 → depth 2 (8 spaces), etc.
    // Leaf test cases get an extra level of indentation beyond their indent.
    const INDENT = '    '; // 4 spaces per level
    const lastPrinted = {}; // indent level → last label printed at that level

    for (const item of filteredTestpad) {
      if (item._structural) {
        // Structural ancestor — print as section header if not already printed
        const pad = INDENT.repeat(item.indent);
        const key = `${item.indent}:${item.text}`;
        if (lastPrinted[item.indent] !== key) {
          lastPrinted[item.indent] = key;
          // Clear all deeper levels so children re-print when encountered
          for (const k of Object.keys(lastPrinted)) {
            if (parseInt(k) > item.indent) delete lastPrinted[k];
          }
          txtLines.push(`${pad}${item.text}`);
        }
      } else {
        // Leaf test case — print with indentation one level deeper than its indent
        const pad = INDENT.repeat(item.indent);
        txtLines.push(`${pad}${item.text} [regress: ${item.num}]`);
      }
    }

    // Changed files without known QA area
    if (unmatchedFiles.length > 0) {
      txtLines.push('    Changed files without known QA area');
      for (const f of unmatchedFiles) {
        const parts = f.split('/');
        const name = parts[parts.length - 1].replace(/\.[^.]+$/, '');
        const keywords = name
          .replace(/([A-Z])/g, ' $1').toLowerCase()
          .split(/[\s_\-\.]+/).filter(w => w.length > 2).slice(0, 4).join(', ');
        txtLines.push(`        Review \`${f}\` [reason: unmatched file]`);
        if (keywords) txtLines.push(`        Search ${keywords} in regress [reason: module-aware lookup]`);
      }
    }

    // Additional checks — standard exploratory checks based on affected modules
    const additionalChecks = [];
    if (affectedModules.has('Analytics')) {
      additionalChecks.push('Verify analytics events on staging for all affected flows (send, swap, TC connect)');
    }
    if (affectedModules.has('Ton Connect')) {
      additionalChecks.push('Exercise one connect plus one signing action from a production dApp');
    }
    if (affectedModules.has('Send') || affectedModules.has('Swap')) {
      additionalChecks.push('Smoke one locale (non-English if available) on touched send/swap screens for truncation');
    }
    if (affectedModules.has('Extension')) {
      additionalChecks.push('Verify Extension analytics events arrive on staging from background service worker');
    }
    if (affectedModules.has('Desktop')) {
      additionalChecks.push('Verify Desktop IPC bridge is intact: open settings and perform a send on both macOS and Windows');
    }
    if (affectedModules.has('Mobile') || affectedModules.has('Mobile Dapp Browser')) {
      additionalChecks.push('Smoke dApp browser flow on Mobile: open tab, connect, close tab — no crash');
    }
    if (additionalChecks.length > 0) {
      txtLines.push('    Additional checks');
      for (const check of additionalChecks) {
        txtLines.push(`        ${check} [reason: additional check]`);
      }
    }

    fs.writeFileSync(csvOutFile, txtLines.join('\n') + '\n', 'utf8');
    console.error(`Test collection written to: ${csvOutFile} (${leafCount} test cases, ${unmatchedFiles.length} unmatched files)`);

  } else if (!isTestpad && checklist && filtered.length > 0) {
    // ── Old column-based CSV export ─────────────────────────────────────────
    const headers = checklist.headers;
    const csvLines = [
      headers.map(quoteCsv).join(','),
      ...filtered.map(row => headers.map(h => quoteCsv(row[h] || '')).join(','))
    ];
    fs.writeFileSync(csvOutFile, csvLines.join('\n'), 'utf8');
    console.error(`Filtered CSV written to: ${csvOutFile}`);
  }
}
