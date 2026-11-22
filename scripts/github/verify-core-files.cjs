/**
 * ============================================================================
 * AhBiYout IpName2 - Core Files Verification & Staging Auditor (6-Stage Gate)
 * ============================================================================
 * Verifies that ONLY clean, secret-free, version-synchronized files required
 * to build, test, and package the project are staged for GitHub upload.
 *
 * Usage:
 *   node scripts/github/verify-core-files.cjs          (Audit only)
 *   node scripts/github/verify-core-files.cjs --clean  (Audit & purge scratch files)
 * ============================================================================
 */

const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..', '..');
const manifestPath = path.join(__dirname, 'core-manifest.json');
const autoClean = process.argv.includes('--clean');

if (!fs.existsSync(manifestPath)) {
  console.error('[ERROR] core-manifest.json not found at: ' + manifestPath);
  process.exit(1);
}

const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

console.log('======================================================================');
console.log(' AhBiYout IpName2 - GitHub Upload Hygiene & Integrity Auditor');
console.log('======================================================================');
console.log(`[INFO] Working Directory: ${rootDir}`);
console.log(`[INFO] Mode: ${autoClean ? 'Purge & Verify' : 'Read-Only Audit'}`);
console.log('----------------------------------------------------------------------');

let hardFailures = 0;

const ignoredScanDirs = new Set([
  '.git',
  'node_modules',
  'dist',
  'dist-ssr',
  'dist-installer',
  'build',
  'Output',
  'release',
  '.idea',
  '.vscode',
  '.fleet',
  '.claude',
  '.cursor',
  '.aistudio'
]);

const binaryExtensions = new Set([
  '.png', '.ico', '.icns', '.jpg', '.jpeg', '.webp', '.gif', '.bmp',
  '.exe', '.dll', '.lib', '.exp', '.pdb', '.obj', '.o', '.a', '.so',
  '.zip', '.7z', '.tar', '.gz', '.woff', '.woff2', '.ttf', '.eot'
]);

// ============================================================================
// STAGE 1: Required Core Files Verification
// ============================================================================
const missingRequired = [];
for (const relPath of manifest.requiredFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    missingRequired.push(relPath);
  }
}

if (missingRequired.length > 0) {
  console.error('[FAIL][Stage 1] The following REQUIRED core files are missing:');
  for (const f of missingRequired) {
    console.error(`  - ❌ ${f}`);
  }
  hardFailures++;
} else {
  console.log(`[OK][Stage 1] All ${manifest.requiredFiles.length} essential build-critical files verified.`);
}

// ============================================================================
// STAGE 2: Prohibited / Scratch Files Scan & Cleanup
// ============================================================================
const detectedProhibited = [];
const allScannedFiles = [];

function checkProhibited(relPath) {
  const filename = path.basename(relPath);
  const normalized = relPath.replace(/\\/g, '/');

  for (const pattern of manifest.prohibitedPatterns) {
    if (pattern.endsWith('*')) {
      const prefix = pattern.slice(0, -1);
      if (normalized.startsWith(prefix) || filename.startsWith(prefix)) {
        return true;
      }
    } else if (pattern.startsWith('*.')) {
      const ext = pattern.slice(1);
      if (filename.endsWith(ext)) {
        return true;
      }
    } else if (normalized === pattern || filename === pattern) {
      return true;
    }
  }

  if (filename.endsWith('.tmp') || filename.endsWith('.bak')) {
    return true;
  }

  return false;
}

function scanDir(currentDir) {
  const entries = fs.readdirSync(currentDir, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = path.join(currentDir, entry.name);
    const relPath = path.relative(rootDir, fullPath).replace(/\\/g, '/');

    if (entry.isDirectory()) {
      if (ignoredScanDirs.has(entry.name)) {
        continue;
      }
      if (relPath === 'src-tauri/target' || relPath.startsWith('src-tauri/target/')) {
        continue;
      }
      scanDir(fullPath);
    } else {
      if (checkProhibited(relPath)) {
        detectedProhibited.push({ fullPath, relPath });
      } else {
        allScannedFiles.push({ fullPath, relPath });
      }
    }
  }
}

scanDir(rootDir);

if (detectedProhibited.length > 0) {
  console.log('\n[WARNING][Stage 2] Detected scratch or prohibited files:');
  for (const item of detectedProhibited) {
    if (autoClean) {
      try {
        fs.unlinkSync(item.fullPath);
        console.log(`  - 🗑️ Deleted: ${item.relPath}`);
      } catch (err) {
        console.error(`  - ❌ Failed to delete ${item.relPath}: ${err.message}`);
        hardFailures++;
      }
    } else {
      console.log(`  - ⚠️ Non-essential file (pass --clean to purge): ${item.relPath}`);
    }
  }
} else {
  console.log('[OK][Stage 2] No prohibited scratch files or duplicate binaries found.');
}

// ============================================================================
// STAGE 3: Whitelist & Unlisted Extra File Audit
// ============================================================================
const allowedRootFiles = new Set([
  ...(manifest.coreRootFiles || []),
  ...(manifest.excludedFiles || [])
]);
const allowedTopDirs = new Set(
  (manifest.coreDirectories || []).map(d => d.split('/')[0])
);
const excludedSet = new Set(manifest.excludedFiles || []);

const unlistedWarnings = [];
const rootEntries = fs.readdirSync(rootDir, { withFileTypes: true });
for (const entry of rootEntries) {
  const name = entry.name;
  if (entry.isDirectory()) {
    if (!ignoredScanDirs.has(name) && !allowedTopDirs.has(name)) {
      unlistedWarnings.push(`Unlisted root directory: ${name}/`);
    }
  } else {
    if (!allowedRootFiles.has(name) && !checkProhibited(name)) {
      unlistedWarnings.push(`Unlisted root file: ${name}`);
    }
  }
}

// Inspect public/ for unexpected unreferenced assets (only favicon.ico expected)
const publicDir = path.join(rootDir, 'public');
if (fs.existsSync(publicDir)) {
  for (const entry of fs.readdirSync(publicDir, { withFileTypes: true })) {
    const rel = `public/${entry.name}`;
    if (entry.isFile() && entry.name !== 'favicon.ico' && !checkProhibited(rel)) {
      unlistedWarnings.push(`Unexpected asset in public/: ${rel}`);
    }
  }
}

if (unlistedWarnings.length > 0) {
  console.warn('\n[WARNING][Stage 3] Unlisted items detected outside core-manifest.json whitelist:');
  for (const w of unlistedWarnings) {
    console.warn(`  - ⚠️ ${w}`);
  }
} else {
  console.log('[OK][Stage 3] Workspace root and asset directories conform strictly to whitelist.');
}

// ============================================================================
// STAGE 4: Secret, Private Key & PII Leak Scanner
// ============================================================================
const secretFindings = [];
const secretRules = [
  { label: 'Google API Key', regex: new RegExp('AI' + 'za[0-9A-Za-z\\-_]{35}') },
  { label: 'AWS Access Key', regex: new RegExp('AK' + 'IA[0-9A-Z]{16}') },
  { label: 'GitHub PAT Token', regex: new RegExp('(?:gh' + 'p_|github_' + 'pat_)[0-9A-Za-z_]{20,}') },
  { label: 'Private Key Block', regex: new RegExp('-----BEGIN (?:RSA |EC |DSA |OPENSSH |)PRIVATE' + ' KEY-----') },
  { label: 'Personal Email Exposure', regex: new RegExp('ahbiyout' + '@gmail\\.com', 'i') }
];

for (const file of allScannedFiles) {
  const rel = file.relPath;
  if (excludedSet.has(rel) || rel === 'scripts/github/verify-core-files.cjs') {
    continue;
  }

  // Flag local secret .env files (excluding .env.example)
  const base = path.basename(rel);
  if ((base === '.env' || base.startsWith('.env.')) && base !== '.env.example') {
    secretFindings.push(`${rel}: Local .env file must not be staged for GitHub upload`);
    continue;
  }

  const ext = path.extname(rel).toLowerCase();
  if (binaryExtensions.has(ext) || rel === 'package-lock.json') {
    continue;
  }

  let content;
  try {
    const stat = fs.statSync(file.fullPath);
    if (stat.size > 1024 * 1024) continue;
    content = fs.readFileSync(file.fullPath, 'utf8');
  } catch {
    continue;
  }

  for (const rule of secretRules) {
    if (rule.regex.test(content)) {
      secretFindings.push(`${rel}: Detected ${rule.label}`);
    }
  }
}

if (secretFindings.length > 0) {
  console.error('\n[FAIL][Stage 4] Potential secret or PII leak detected in staged repository files:');
  for (const finding of secretFindings) {
    console.error(`  - ❌ ${finding}`);
  }
  hardFailures++;
} else {
  console.log('[OK][Stage 4] Secret, key, token, and personal email scan passed (0 leaks).');
}

// ============================================================================
// STAGE 5: Multi-Tier Version Lockstep Parity Check
// ============================================================================
function readUtf8(relPath) {
  const full = path.join(rootDir, relPath);
  return fs.existsSync(full) ? fs.readFileSync(full, 'utf8') : null;
}

const pkgJson = JSON.parse(readUtf8('package.json'));
const expectedVersion = pkgJson.version;
const lockstepMismatches = [];

const checkEq = (label, actual) => {
  if (actual !== expectedVersion) {
    lockstepMismatches.push(`${label}: expected "${expectedVersion}", found "${actual ?? 'MISSING'}"`);
  }
};

// package-lock.json
const pkgLockRaw = readUtf8('package-lock.json');
if (pkgLockRaw) {
  const pkgLock = JSON.parse(pkgLockRaw);
  checkEq('package-lock.json (version)', pkgLock.version);
  if (pkgLock.packages && pkgLock.packages['']) {
    checkEq('package-lock.json (packages[""].version)', pkgLock.packages[''].version);
  }
}

// core-manifest.json
checkEq('scripts/github/core-manifest.json', manifest.version);

// src-tauri/tauri.conf.json
const tauriConfRaw = readUtf8('src-tauri/tauri.conf.json');
if (tauriConfRaw) {
  const tauriConf = JSON.parse(tauriConfRaw);
  checkEq('src-tauri/tauri.conf.json (version)', tauriConf.version);
  checkEq('src-tauri/tauri.conf.json (productName)', tauriConf.productName === `IpName2 v${expectedVersion}` ? expectedVersion : tauriConf.productName);
  const winTitle = tauriConf.app?.windows?.[0]?.title;
  checkEq('src-tauri/tauri.conf.json (window.title)', winTitle === `IpName2 v${expectedVersion}` ? expectedVersion : winTitle);
}

// src-tauri/Cargo.toml
const cargoToml = readUtf8('src-tauri/Cargo.toml');
if (cargoToml) {
  const m = cargoToml.match(/^version\s*=\s*"([^"]+)"/m);
  checkEq('src-tauri/Cargo.toml', m ? m[1] : null);
}

// src/hooks/useGitHubUpdate.ts
const ghUpdateTs = readUtf8('src/hooks/useGitHubUpdate.ts');
if (ghUpdateTs) {
  const m = ghUpdateTs.match(/CURRENT_VERSION\s*=\s*'([^']+)'/);
  checkEq('src/hooks/useGitHubUpdate.ts', m ? m[1] : null);
}

// native/ipname_core/src/ipname_core.c
const coreC = readUtf8('native/ipname_core/src/ipname_core.c');
if (coreC) {
  const m = coreC.match(/#define\s+IPNAME_VERSION\s+"([^"]+)"/);
  checkEq('native/ipname_core/src/ipname_core.c', m ? m[1] : null);
}

// installer/setup.iss
const setupIss = readUtf8('installer/setup.iss');
if (setupIss) {
  const m = setupIss.match(/#define\s+MyAppVersion\s+"([^"]+)"/);
  checkEq('installer/setup.iss', m ? m[1] : null);
}

// index.html
const indexHtml = readUtf8('index.html');
if (indexHtml) {
  const titleMatch = indexHtml.match(/<title>AhBiYout IpName2 v([^<]+)<\/title>/);
  const ogMatch = indexHtml.match(/<meta\s+property="og:title"\s+content="IpName2 v([^"]+)"\s*\/?>/);
  checkEq('index.html (<title>)', titleMatch ? titleMatch[1] : null);
  checkEq('index.html (og:title)', ogMatch ? ogMatch[1] : null);
}

// docs/PATCH_NOTES.md
const patchNotes = readUtf8('docs/PATCH_NOTES.md');
if (patchNotes) {
  const m = patchNotes.match(/^##\s*\[v([0-9]+\.[0-9]+\.[0-9]+)\]/m);
  checkEq('docs/PATCH_NOTES.md (latest heading)', m ? m[1] : null);
}

if (lockstepMismatches.length > 0) {
  console.error(`\n[FAIL][Stage 5] Version lockstep mismatches (reference package.json = v${expectedVersion}):`);
  for (const mm of lockstepMismatches) {
    console.error(`  - ❌ ${mm}`);
  }
  hardFailures++;
} else {
  console.log(`[OK][Stage 5] Multi-tier Triple Lockstep version v${expectedVersion} verified across all 10 targets.`);
}

// ============================================================================
// STAGE 6: Excluded Local Automation Isolation Check
// ============================================================================
const gitignoreRaw = readUtf8('.gitignore') || '';
for (const excludedPath of (manifest.excludedFiles || [])) {
  if (!gitignoreRaw.includes(excludedPath)) {
    console.error(`[FAIL][Stage 6] Excluded file "${excludedPath}" is missing from .gitignore!`);
    hardFailures++;
  }
}

if (manifest.excludedFiles && Array.isArray(manifest.excludedFiles)) {
  const isGitRepo = fs.existsSync(path.join(rootDir, '.git'));
  if (isGitRepo) {
    const { execSync } = require('child_process');
    const trackedExcluded = [];
    for (const excludedPath of manifest.excludedFiles) {
      try {
        const output = execSync(`git ls-files "${excludedPath}"`, {
          encoding: 'utf8',
          cwd: rootDir,
          stdio: ['pipe', 'pipe', 'pipe']
        }).trim();
        if (output) {
          trackedExcluded.push(output);
        }
      } catch {
        // Ignore safely
      }
    }
    if (trackedExcluded.length > 0) {
      console.error('\n[FAIL][Stage 6] Excluded local scripts are currently tracked by Git:');
      for (const te of trackedExcluded) {
        console.error(`  - ❌ Tracked: ${te} (Run: git rm --cached ${te})`);
      }
      hardFailures++;
    } else {
      console.log('[OK][Stage 6] All excluded files (including git-push.bat) verified untracked by Git.');
    }
  } else {
    console.log('[OK][Stage 6] .gitignore isolation rules verified (no local .git repository initialized).');
  }
}

// ============================================================================
// Summary Output
// ============================================================================
console.log('----------------------------------------------------------------------');
console.log(' Repository Structure Audit:');
console.log('   - Frontend Application:   src/ (React 19 + TypeScript + Vite)');
console.log('   - Desktop Backend:        src-tauri/ (Tauri v2 + Win32 Rust Native)');
console.log('   - Pure Native DLL Engine: native/ipname_core/ (C99 Win32 DLL)');
console.log('   - Inno Setup Installer:   installer/setup.iss');
console.log('   - CI/CD Release Pipeline: .github/workflows/release.yml');
console.log('   - Documentation & Specs:  docs/ (11 Official Specs & Patch Notes)');
console.log('   - Build Scripts:          build.bat, build.ps1, bin/');
console.log('   - Excluded Automation:    git-push.bat (local execution only, excluded from GitHub)');
console.log('----------------------------------------------------------------------');

if (hardFailures > 0) {
  console.error(`[FAILED] Audit completed with ${hardFailures} blocking error(s). Please resolve before pushing.\n`);
  process.exit(1);
}

console.log(`[SUCCESS] Repository v${expectedVersion} passed all 6 hygiene, security, and lockstep checks!\n`);
process.exit(0);
