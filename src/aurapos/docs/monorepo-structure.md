const fs = require('fs');
const path = require('path');
const glob = require('glob');

function main() {
  const pkgPath = path.resolve(process.cwd(), 'package.json');
  let pkg;
  try {
    pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
  } catch (e) {
    console.error('Failed to read package.json:', e);
    process.exit(1);
  }

  const rawWorkspaces = pkg.workspaces || [];
  const workspaceEntries = Array.isArray(rawWorkspaces) ? rawWorkspaces : Object.keys(rawWorkspaces || {});

  const lines = ['# Monorepo Structure', '', 'This document is auto-generated. Do not edit manually.', ''];
  let found = false;

  for (const entry of workspaceEntries) {
    let pattern;
    if (typeof entry === 'string') {
      pattern = entry;
    } else if (entry && typeof entry === 'object' && entry.pattern) {
      pattern = entry.pattern;
    } else {
      continue;
    }

    const matches = glob.sync(pattern, { cwd: process.cwd(), onlyDirectories: true });
    if (matches.length === 0) continue;
    found = true;
    for (const dir of matches) {
      const wsPkgPath = path.join(process.cwd(), dir, 'package.json');
      let name = dir, version = '';
      try {
        const wsPkg = JSON.parse(fs.readFileSync(wsPkgPath, 'utf8'));
        name = wsPkg.name || dir;
        version = wsPkg.version || '';
      } catch (_) {
        // keep dir as name
      }
      lines.push(`| ${name} | ${dir} |`);
    }
  }

  if (!found) {
    lines.push('No workspaces defined.');
  }

  const outDir = path.join(process.cwd(), 'docs');
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }
  const outPath = path.join(outDir, 'monorepo-structure.md');
  fs.writeFileSync(outPath, lines.join('\n'), 'utf8');
  console.log(`Generated ${outPath}`);
}

main();