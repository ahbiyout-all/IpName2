const fs = require('fs');
const path = require('path');

function getPackageInfo() {
  const pkgPath = path.join(__dirname, '..', 'package.json');
  if (fs.existsSync(pkgPath)) {
    try {
      return JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    } catch (e) {
      console.error('Error reading package.json:', e);
    }
  }
  return {};
}

function getLatestVersion() {
  const pkg = getPackageInfo();
  if (pkg.version) {
    return pkg.version;
  }

  const patchNotesPath = path.join(__dirname, '..', 'docs', 'PATCH_NOTES.md');
  if (fs.existsSync(patchNotesPath)) {
    const content = fs.readFileSync(patchNotesPath, 'utf8');
    const match = content.match(/##\s*\[v?([0-9]+\.[0-9]+(?:\.[0-9]+)?)\]/i);
    if (match && match[1]) {
      return match[1];
    }
  }

  return '1.13.7';
}

function getTauriProductName() {
  const tauriConfPath = path.join(__dirname, '..', 'src-tauri', 'tauri.conf.json');
  if (fs.existsSync(tauriConfPath)) {
    try {
      const conf = JSON.parse(fs.readFileSync(tauriConfPath, 'utf8'));
      if (conf.productName) return conf.productName;
    } catch {}
  }
  return null;
}

function processExecutable() {
  const version = getLatestVersion();
  const formattedVersion = version.startsWith('v') ? version : `v${version}`;
  const productName = getTauriProductName();
  console.log(`[Post-Build] Detected application version: ${formattedVersion}`);

  const releaseDir = path.join(__dirname, '..', 'src-tauri', 'target', 'release');
  if (!fs.existsSync(releaseDir)) {
    console.warn(`[Post-Build] Release directory not found at: ${releaseDir}`);
    return;
  }

  // Prioritize active Cargo/Tauri output binary names before any generic fallback
  const candidates = [
    'ipname2.exe',
    'IpName2.exe',
    ...(productName ? [`${productName}.exe`] : []),
    `IpName2 ${formattedVersion}.exe`,
    `IpName2_${formattedVersion}.exe`,
    'app.exe',
    'AhBiYout IpName2.exe'
  ];

  let sourceExePath = null;
  for (const candidate of candidates) {
    const candidatePath = path.join(releaseDir, candidate);
    if (fs.existsSync(candidatePath)) {
      sourceExePath = candidatePath;
      break;
    }
  }

  // Fallback: look for any non-setup .exe in release dir
  if (!sourceExePath) {
    const files = fs.readdirSync(releaseDir);
    for (const file of files) {
      if (file.endsWith('.exe') && !file.includes('-setup') && !file.includes('installer')) {
        sourceExePath = path.join(releaseDir, file);
        break;
      }
    }
  }

  if (!sourceExePath) {
    console.error('[Post-Build] ERROR: No standalone executable found in release directory.');
    process.exitCode = 1;
    return;
  }

  console.log(`[Post-Build] Source executable resolved: ${path.basename(sourceExePath)}`);

  const canonicalExePath = path.join(releaseDir, 'IpName2.exe');
  const targetExeName = `IpName2_${formattedVersion}.exe`;
  const targetExePath = path.join(releaseDir, targetExeName);

  try {
    if (path.resolve(sourceExePath) !== path.resolve(canonicalExePath)) {
      fs.copyFileSync(sourceExePath, canonicalExePath);
      console.log(`[Post-Build] SUCCESS: Canonical binary staged at: ${canonicalExePath}`);
    }

    if (path.resolve(sourceExePath) !== path.resolve(targetExePath)) {
      fs.copyFileSync(sourceExePath, targetExePath);
    }
    console.log(`[Post-Build] SUCCESS: Versioned executable generated at: ${targetExePath}`);

    // Also copy to project root for easy portable access
    const rootTargetExePath = path.join(__dirname, '..', targetExeName);
    fs.copyFileSync(sourceExePath, rootTargetExePath);
    console.log(`[Post-Build] SUCCESS: Copied to root workspace: ${targetExeName}`);
  } catch (err) {
    console.error(`[Post-Build] ERROR copying versioned executable:`, err);
    process.exitCode = 1;
  }
}

processExecutable();
