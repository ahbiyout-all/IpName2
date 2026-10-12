@echo off
setlocal enabledelayedexpansion

echo ======================================================================
echo  IpName2 - Automated Build ^& Packaging Script
echo ======================================================================
echo.

:: STEP 0: Configure local server port
echo ======================================================================
echo  [STEP 0/6] Port Configuration
echo ======================================================================
echo Please enter the port number for Vite / local communication.
set /p PORT_INPUT="Enter Port Number (Default: 3030): "
if "%PORT_INPUT%"=="" (
    set PORT_INPUT=3030
)
echo [OK] Selected Port: %PORT_INPUT%
echo.

:: Parse command line arguments
set CLEAN=0
set ICONS=0

for %%A in (%*) do (
    if /I "%%A"=="--clean" set CLEAN=1
    if /I "%%A"=="--icons" set ICONS=1
)

:: STEP 1: Cleaning previous build output
echo ======================================================================
echo  [STEP 1/6] Cleaning Build Outputs
echo ======================================================================
if !CLEAN!==1 (
    echo Cleaning previous build outputs...
    if exist "dist" rmdir /s /q "dist"
    if exist "src-tauri\target\release\bundle" rmdir /s /q "src-tauri\target\release\bundle"
    if exist "src-tauri\Cargo.lock" del /f /q "src-tauri\Cargo.lock"
    echo [OK] Clean completed.
) else (
    echo Skipping clean step. Pass --clean flag to clean build caches.
)
echo.

:: STEP 2: Installing dependencies
echo ======================================================================
echo  [STEP 2/6] Dependencies Verification
echo ======================================================================
echo Verifying and installing npm packages...
call npm install
if %errorlevel% neq 0 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b %errorlevel%
)
echo [OK] Dependencies ready.
echo.

:: STEP 3: Icon generation
echo ======================================================================
echo  [STEP 3/6] Application Icon Pipeline
echo ======================================================================
if !ICONS!==1 (
    echo Generating application icons...
    call npm run build:icons
) else (
    echo Verifying standard BMP application icon...
    node fix-icon.cjs
)
echo [OK] Icons verified.
echo.

:: STEP 4: Build React Frontend
echo ======================================================================
echo  [STEP 4/6] Building React Frontend (Vite)
echo ======================================================================
set VITE_PORT=%PORT_INPUT%
call npm run build
if %errorlevel% neq 0 (
    echo [ERROR] React frontend build failed!
    pause
    exit /b %errorlevel%
)
echo [OK] Frontend build succeeded.
echo.

:: Build Pure Custom Native DLL (ipname_core.dll)
if not exist "native\ipname_core\build.bat" goto skip_native_dll
echo Compiling Pure Custom Native DLL (ipname_core.dll)...
pushd native\ipname_core
call build.bat
popd
echo [OK] Pure Custom Native DLL pipeline completed.
echo.
:skip_native_dll

:: STEP 5: Build Tauri Native Application
echo ======================================================================
echo  [STEP 5/6] Compiling Tauri Native Executable (Rust)
echo ======================================================================
call npm run tauri build
if %errorlevel% neq 0 (
    echo [ERROR] Tauri native application build failed!
    echo If you encounter icon resource errors, please run: build.bat --icons
    pause
    exit /b %errorlevel%
)
echo [OK] Native binary compiled successfully.
echo.

:: STEP 6: Apply Versioning from Patch Notes to Executable
echo ======================================================================
echo  [STEP 6/6] Auto-Versioning Executable Output
echo ======================================================================
node bin/postbuild-rename.cjs
if %errorlevel% neq 0 (
    echo [WARNING] Post-build version naming step encountered an issue.
)
echo.

echo ======================================================================
echo  BUILD COMPLETED SUCCESSFULLY!
echo ======================================================================
echo The versioned executable output has been generated in:
echo   - Workspace Root: (e.g. IpName2_v1.10.0.exe)
echo   - Release Directory: src-tauri\target\release\
echo ======================================================================
echo [OK] Opening build output folder...
if exist "src-tauri\target\release" (
    explorer "src-tauri\target\release"
) else if exist "dist" (
    explorer "dist"
)
echo.
pause
