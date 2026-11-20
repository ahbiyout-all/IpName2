<#
.SYNOPSIS
    Automated build script for AhBiYout IpName2
.DESCRIPTION
    This script installs Node.js dependencies, builds the Vite React frontend,
    and then compiles the Tauri Rust backend into a standalone Windows executable.
#>

param (
    [switch]$InstallDeps = $true,
    [switch]$Clean = $false,
    [switch]$BuildIcons = $false
)

Write-Host "======================================" -ForegroundColor Cyan
Write-Host " AhBiYout IpName2 - Auto Build Script" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host ""

# STEP 0: Configure port setting (Interactive custom port input)
Write-Host "======================================" -ForegroundColor Cyan
Write-Host " STEP 0: Configure local server / communication port" -ForegroundColor Cyan
Write-Host "======================================" -ForegroundColor Cyan
Write-Host "Please enter the port number you want to use for the Vite server / local communication."
$PortInput = Read-Host "Enter Port Number (Default: 3030)"
if ([string]::IsNullOrWhiteSpace($PortInput)) {
    $PortInput = "3030"
}
Write-Host "[OK] Custom port selected of: $PortInput" -ForegroundColor Green
Write-Host ""

Write-Host "[1/8] Cleaning transient scratch files via Core-Manifest Auditor..." -ForegroundColor Yellow
if (Test-Path "scripts/github/verify-core-files.cjs") {
    node scripts/github/verify-core-files.cjs --clean
}

if ($Clean) {
    Write-Host "[2/8] Cleaning previous build outputs..." -ForegroundColor Yellow
    if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
    if (Test-Path "src-tauri/target/release/bundle") { Remove-Item -Recurse -Force "src-tauri/target/release/bundle" }
    if (Test-Path "src-tauri/Cargo.lock") { Remove-Item -Force "src-tauri/Cargo.lock" }
    Write-Host "[OK] Cleaned build outputs and Cargo.lock!" -ForegroundColor Green
} else {
    Write-Host "[2/8] Skipping clean..." -ForegroundColor DarkGray
}

if ($InstallDeps) {
    Write-Host "[3/8] Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error installing dependencies!" -ForegroundColor Red
        Read-Host "Press Enter to exit..."
        exit $LASTEXITCODE
    }
} else {
    Write-Host "[3/8] Skipping dependency installation..." -ForegroundColor DarkGray
}

if ($BuildIcons) {
    Write-Host "[4/8] Generating icons..." -ForegroundColor Yellow
    npm run build:icons
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error generating icons!" -ForegroundColor Red
        Read-Host "Press Enter to exit..."
        exit $LASTEXITCODE
    }
} else {
    Write-Host "[4/8] Verifying standard BMP application icon..." -ForegroundColor Yellow
    node fix-icon.cjs
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error verifying icon!" -ForegroundColor Red
        Read-Host "Press Enter to exit..."
        exit $LASTEXITCODE
    }
}

Write-Host "[5/8] Building React frontend (Vite) with custom Port: $PortInput..." -ForegroundColor Yellow
$env:VITE_PORT = $PortInput
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error building frontend!" -ForegroundColor Red
    Read-Host "Press Enter to exit..."
    exit $LASTEXITCODE
}

# Compile Pure Custom Native DLL (ipname_core.dll) if batch builder exists
$DllBuildBat = Join-Path $PSScriptRoot "native\ipname_core\build.bat"
if (Test-Path $DllBuildBat) {
    Write-Host "[6/8] Compiling Pure Custom Native DLL (ipname_core.dll)..." -ForegroundColor Yellow
    Push-Location "native\ipname_core"
    cmd.exe /c build.bat
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[WARNING] Pure Custom Native DLL compilation returned an error. Using Rust native engine." -ForegroundColor Yellow
    }
    Pop-Location
} else {
    Write-Host "[6/8] Native DLL builder not found. Using Rust native engine." -ForegroundColor DarkGray
}

Write-Host "[7/8] Building Tauri backend (Rust)..." -ForegroundColor Yellow
npm run tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error building Tauri application!" -ForegroundColor Red
    Write-Host ""
    Write-Host "If you see 'error RC2176: old DIB in icon.ico', please run: .\build.ps1 -BuildIcons" -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[8/8] Auto-Versioning Executable Output..." -ForegroundColor Yellow
node bin/postbuild-rename.cjs
if ($LASTEXITCODE -ne 0) {
    Write-Host "[WARNING] Post-build version naming step encountered an issue." -ForegroundColor Yellow
}

if (Test-Path "bun.lock") { Remove-Item -Force "bun.lock" -ErrorAction SilentlyContinue }

Write-Host ""
Write-Host "======================================" -ForegroundColor Green
Write-Host " Build Completed Successfully!" -ForegroundColor Green
Write-Host "======================================" -ForegroundColor Green
Write-Host "The executable can be found in: src-tauri\target\release\"

# Open build output folder in Windows File Explorer
$ReleaseDir = Join-Path $PSScriptRoot "src-tauri\target\release"
if (Test-Path $ReleaseDir) {
    Write-Host "[OK] Opening build output folder in Explorer..." -ForegroundColor Yellow
    Start-Process "explorer.exe" -ArgumentList "`"$ReleaseDir`""
} elseif (Test-Path (Join-Path $PSScriptRoot "dist")) {
    $DistDir = Join-Path $PSScriptRoot "dist"
    Write-Host "[OK] Opening dist output folder in Explorer..." -ForegroundColor Yellow
    Start-Process "explorer.exe" -ArgumentList "`"$DistDir`""
}

Write-Host ""
Read-Host "Press Enter to exit..."
