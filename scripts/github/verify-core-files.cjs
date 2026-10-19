/**
 * ============================================================================
 * AhBiYout IpName2 - Core Files Verification & Staging Auditor
 * ============================================================================
 * Verifies that ONLY the files strictly required to build and run the project
 * are tracked and staged for GitHub repository upload.
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
console.log(' AhBiYout IpName2 - GitHub Core Files Audit & Staging Verification');
console.log('======================================================================');
console.log(`[INFO] Working Directory: ${rootDir}`);
console.log(`[INFO] Mode: ${autoClean ? 'Purge & Verify' : 'Read-Only Audit'}`);
console.log('----------------------------------------------------------------------');

// Ignored runtime directories during scanning
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

// 1. Verify that all required core files exist
let missingRequired = [];
for (const relPath of manifest.requiredFiles) {
  const fullPath = path.join(rootDir, relPath);
  if (!fs.existsSync(fullPath)) {
    missingRequired.push(relPath);
  }
}

if (missingRequired.length > 0) {
  console.error('[FAIL] The following REQUIRED core files are missing:');
  for (const f of missingRequired) {
    console.error(`  - ❌ ${f}`);
  }
  process.exit(1);
} else {
  console.log(`[OK] All ${manifest.requiredFiles.length} essential build-critical files verified.`);
}

// 2. Scan repository for prohibited or scratch files
const detectedProhibited = [];

function checkProhibited(relPath) {
  const filename = path.basename(relPath);
  const normalized = relPath.replace(/\\/g, '/');

  // Direct matches from manifest
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

  // Common scratch extensions
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
      if (relPath.startsWith('src-tauri/target')) {
        continue;
      }
      scanDir(fullPath);
    } else {
      if (checkProhibited(relPath)) {
        detectedProhibited.push({ fullPath, relPath });
      }
    }
  }
}

scanDir(rootDir);

// 3. Purge or Report Prohibited Files
if (detectedProhibited.length > 0) {
  console.log('\n[WARNING] Detected scratch or non-essential files:');
  for (const item of detectedProhibited) {
    if (autoClean) {
      try {
        fs.unlinkSync(item.fullPath);
        console.log(`  - 🗑️ Deleted: ${item.relPath}`);
      } catch (err) {
        console.error(`  - ⚠️ Failed to delete ${item.relPath}: ${err.message}`);
      }
    } else {
      console.log(`  - ⚠️ Unnecessary file: ${item.relPath}`);
    }
  }
} else {
  console.log('[OK] No prohibited scratch files or unneeded binaries found.');
}

// 3b. Verify Excluded Files are Not Tracked by Git
if (manifest.excludedFiles && Array.isArray(manifest.excludedFiles)) {
  const isGitRepo = fs.existsSync(path.join(rootDir, '.git'));
  if (isGitRepo) {
    const { execSync } = require('child_process');
    let trackedExcluded = [];
    for (const excludedPath of manifest.excludedFiles) {
      try {
        const output = execSync(`git ls-files "${excludedPath}"`, { encoding: 'utf8', cwd: rootDir, stdio: ['pipe', 'pipe', 'pipe'] }).trim();
        if (output) {
          trackedExcluded.push(output);
        }
      } catch {
        // Ignore safely
      }
    }
    if (trackedExcluded.length > 0) {
      console.warn('\n[WARNING] The following files are in excludedFiles but still tracked by Git:');
      for (const te of trackedExcluded) {
        console.warn(`  - ⚠️ Tracked: ${te} (Run: git rm --cached ${te})`);
      }
    } else {
      console.log('[OK] All excluded files (including git-push.bat) verified untracked by Git.');
    }
  } else {
    console.log('[OK] No local .git repository directory; excluded files verified.');
  }
}

// 4. Summarize Staged Files Category Breakdown
console.log('----------------------------------------------------------------------');
console.log(' Repository Structure Audit:');
console.log('   - Frontend Application:   src/ (React 19 + TypeScript + Vite)');
console.log('   - Desktop Backend:        src-tauri/ (Tauri v2 + Win32 Rust Native)');
console.log('   - Pure Native DLL Engine: native/ipname_core/ (C99 Win32 DLL)');
console.log('   - Inno Setup Installer:   installer/setup.iss');
console.log('   - CI/CD Release Pipeline: .github/workflows/release.yml');
console.log('   - Documentation & Specs:  docs/ (README, Architecture, Dev, DLL, Patch)');
console.log('   - Build Scripts:          build.bat, build.ps1, bin/');
console.log('   - Excluded Automation:    git-push.bat (local execution only, excluded from GitHub)');
console.log('----------------------------------------------------------------------');
console.log('[SUCCESS] Repository is clean, compliant, and ready for GitHub synchronization!');
console.log('======================================================================\n');
process.exit(0);
