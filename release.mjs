import { execSync } from 'child_process';
import { readFileSync, writeFileSync } from 'fs';

const run = (cmd) => execSync(cmd, { stdio: 'inherit' });

// Read current version
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));
const [major, minor, patch] = pkg.version.split('.').map(Number);

// Determine bump type (default: patch)
const bump = process.argv[2] || 'patch';
let next;
switch (bump) {
  case 'major': next = `${major + 1}.0.0`; break;
  case 'minor': next = `${major}.${minor + 1}.0`; break;
  case 'patch': next = `${major}.${minor}.${patch + 1}`; break;
  default:
    console.error(`Unknown bump type: ${bump}. Use patch, minor, or major.`);
    process.exit(1);
}

const tag = `v${next}`;
console.log(`\n  ${pkg.version} → ${next}\n`);

// Update package.json version
pkg.version = next;
writeFileSync('package.json', JSON.stringify(pkg, null, 2) + '\n');

// Build
console.log('Building...');
run('node build.mjs');

// Generate type declarations
console.log('Generating declarations...');
run('npx tsc --emitDeclarationOnly');

// Git: stage, commit, tag, push
console.log('Committing and tagging...');
run('git add -A');
run(`git commit -m "release ${tag}"`);
run(`git tag ${tag}`);
run(`git push && git push origin ${tag}`);

console.log(`\n  Released ${tag}`);
console.log(`  https://cdn.jsdelivr.net/gh/AMoreaux/addmore-cookies@${tag}/dist/cookie-consent.min.js\n`);
