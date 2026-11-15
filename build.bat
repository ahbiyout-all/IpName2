@echo off
setlocal enabledelayedexpansion

title AhBiYout IpName2 - Automated Build ^& Packaging Script

echo ======================================================================
echo  IpName2 - Automated Build ^& Packaging Script
echo ======================================================================
echo.

:: ----------------------------------------------------------------------
:: STEP 0: Configure local server port
:: ----------------------------------------------------------------------
echo ======================================================================
echo  [STEP 0/8] Port Configuration
echo ======================================================================
echo Please enter the port number for Vite / local communication.
set "PORT_INPUT="
set /p "PORT_INPUT=Enter Port Number (Default: 3030): "
if not defined PORT_INPUT set "PORT_INPUT=3030"
if "%PORT_INPUT%"=="" set "PORT_INPUT=3030"
echo [OK] Selected Port: "%PORT_INPUT%"
echo.

:: ----------------------------------------------------------------------
:: Parse command line arguments safely
:: ----------------------------------------------------------------------
set "CLEAN=0"
set "ICONS=0"

for %%A in (%*) do (
    if /I "%%~A"=="--clean" set "CLEAN=1"
    if /I "%%~A"=="--icons" set "ICONS=1"
)

:: ----------------------------------------------------------------------
:: STEP 1: Clean Transient Scratch Files via Core-Manifest Auditor
:: ----------------------------------------------------------------------
echo ======================================================================
echo  [STEP 1/8] Cleaning Transient Scratch ^& Non-Essential Files
echo ======================================================================
if exist "scripts\github\verify-core-files.cjs" (
    node scripts\github\verify-core-files.cjs --clean
)
if exist ".aistudio" rmdir /s /q ".aistudio" 2>nul
if exist "public\assets\aistudio" rmdir /s /q "public\assets\aistudio" 2>nul
if exist "bun.lock" del /f /q "bun.lock" 2>nul
if exist "bun.lockb" del /f /q "bun.lockb" 2>nul
if exist "yarn.lock" del /f /q "yarn.lock" 2>nul
if exist "pnpm-lock.yaml" del /f /q "pnpm-lock.yaml" 2>nul
echo [OK] Workspace scratch cleanup completed.
echo.

:: ----------------------------------------------------------------------
:: STEP 2: Cleaning previous build output
:: ----------------------------------------------------------------------
echo ======================================================================
echo  [STEP 2/8] Cleaning Build Outputs
echo ======================================================================
if "%CLEAN%"=="1" (
    echo Cleaning previous build outputs...
    if exist "dist" rmdir /s /q "dist"
    if exist "src-tauri\target\release\bundle" rmdir /s /q "src-tauri\target\release\bundle"
    if exist "src-tauri\Cargo.lock" del /f /q "src-tauri\Cargo.lock"
    echo [OK] Clean completed.
) else (
    echo Skipping clean step. Pass --clean flag to clean build caches.
)
echo.

:: ----------------------------------------------------------------------
:: STEP 3: Dependencies Verification
:: ----------------------------------------------------------------------
echo ======================================================================
echo  [STEP 3/8] Dependencies Verification
echo ======================================================================
echo Verifying and installing npm packages...
call npm install
if errorlevel 1 (
    echo [ERROR] Failed to install dependencies.
    pause
    exit /b 1
)
echo [OK] Dependencies ready.
echo.

:: ----------------------------------------------------------------------
:: STEP 4: Application Icon Pipeline
:: ----------------------------------------------------------------------
echo ======================================================================
echo  [STEP 4/8] Application Icon Pipeline
echo ======================================================================
if "%ICONS%"=="1" (
    echo Generating application icons...
    call npm run build:icons
) else (
    echo Verifying standard BMP application icon...
    node fix-icon.cjs
)
if errorlevel 1 (
    echo [ERROR] Icon verification/generation failed!
    pause
    exit /b 1
)
echo [OK] Icons verified.
echo.

:: ----------------------------------------------------------------------
:: STEP 5: Build React Frontend (Vite)
:: ----------------------------------------------------------------------
echo ======================================================================
echo  [STEP 5/8] Building React Frontend (Vite)
echo ======================================================================
set "VITE_PORT=%PORT_INPUT%"
call npm run build
if errorlevel 1 (
    echo [ERROR] React frontend build failed!
    pause
    exit /b 1
)
echo [OK] Frontend build succeeded.
echo.

:: ----------------------------------------------------------------------
:: STEP 6: Build Pure Custom Native DLL (ipname_core.dll)
:: ----------------------------------------------------------------------
echo ======================================================================
echo  [STEP 6/8] Compiling Pure Custom Native DLL (ipname_core.dll)
echo ======================================================================
if exist "native\ipname_core\build.bat" (
    pushd "native\ipname_core"
    call build.bat
    if errorlevel 1 (
        echo [WARNING] Pure Custom Native DLL compilation returned an error. Using Rust native engine.
    )
    popd
    echo [OK] Pure Custom Native DLL pipeline completed.
    echo.
)

:: ----------------------------------------------------------------------
:: STEP 7: Build Tauri Native Application
:: ----------------------------------------------------------------------
echo ======================================================================
echo  [STEP 7/8] Compiling Tauri Native Executable (Rust)
echo ======================================================================
call npm run tauri build
if errorlevel 1 (
    echo [ERROR] Tauri native application build failed!
    echo If you encounter icon resource errors, please run: build.bat --icons
    pause
    exit /b 1
)
echo [OK] Native binary compiled successfully.
echo.

:: ----------------------------------------------------------------------
:: Auto-Versioning Executable Output
:: ----------------------------------------------------------------------
echo ======================================================================
echo  [STEP 8/8] Auto-Versioning Executable Output
echo ======================================================================
node bin\postbuild-rename.cjs
if errorlevel 1 (
    echo [WARNING] Post-build version naming step encountered an issue.
)
echo.

:: Re-apply .gitkeep-ignore cleanup to ensure only versioned essentials remain
if exist ".gitkeep-ignore" (
    echo [INFO] Finalizing workspace cleanliness using .gitkeep-ignore...
    if exist "bun.lock" del /f /q "bun.lock" 2>nul
)

echo ======================================================================
echo  BUILD COMPLETED SUCCESSFULLY!
echo ======================================================================
echo The versioned executable output has been generated in:
echo   - Workspace Root: [e.g. IpName2_v1.13.2.exe]
echo   - Release Directory: src-tauri\target\release\
echo ======================================================================
echo [OK] Opening build output folder...
if exist "src-tauri\target\release" (
    explorer "src-tauri\target\release"
) else (
    if exist "dist" (
        explorer "dist"
    )
)
echo.
pause
exit /b 0
