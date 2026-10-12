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

if ($Clean) {
    Write-Host "[1/5] Cleaning previous build..." -ForegroundColor Yellow
    if (Test-Path "dist") { Remove-Item -Recurse -Force "dist" }
    if (Test-Path "src-tauri/target") { Remove-Item -Recurse -Force "src-tauri/target" }
    if (Test-Path "src-tauri/Cargo.lock") { Remove-Item -Force "src-tauri/Cargo.lock" }
    Write-Host "[OK] Cleaned build outputs and Cargo.lock!" -ForegroundColor Green
} else {
    Write-Host "[1/5] Skipping clean..." -ForegroundColor DarkGray
}

if ($InstallDeps) {
    Write-Host "[2/5] Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "Error installing dependencies!" -ForegroundColor Red
        Read-Host "Press Enter to exit..."
        exit $LASTEXITCODE
    }
} else {
    Write-Host "[2/5] Skipping dependency installation..." -ForegroundColor DarkGray
}

if ($BuildIcons) {
    Write-Host "[3/5] Generating icons..." -ForegroundColor Yellow
    npm run build:icons
} else {
    Write-Host "[3/5] Skipping icon generation..." -ForegroundColor DarkGray
}

Write-Host "[4/6] Building React frontend (Vite) with custom Port: $PortInput..." -ForegroundColor Yellow
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
    Write-Host "[OK] Compiling Pure Custom Native DLL (ipname_core.dll)..." -ForegroundColor Yellow
    Push-Location "native\ipname_core"
    cmd.exe /c build.bat
    Pop-Location
}

Write-Host "[5/6] Building Tauri backend (Rust)..." -ForegroundColor Yellow
npm run tauri build
if ($LASTEXITCODE -ne 0) {
    Write-Host "Error building Tauri application!" -ForegroundColor Red
    Write-Host ""
    Write-Host "If you see 'error RC2176: old DIB in icon.ico', please run: .\build.ps1 -BuildIcons" -ForegroundColor Yellow
    Read-Host "Press Enter to exit..."
    exit $LASTEXITCODE
}

Write-Host ""
Write-Host "[6/6] Auto-Versioning Executable Output..." -ForegroundColor Yellow
node bin/postbuild-rename.cjs

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
