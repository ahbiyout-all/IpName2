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
echo  [STEP 0/7] Port Configuration
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
:: STEP 1: Process .gitkeep-ignore to Purge Non-Essential / Scratch Files
:: ----------------------------------------------------------------------
echo ======================================================================
echo  [STEP 1/7] Processing .gitkeep-ignore ^& Cleaning Non-Essential Files
echo ======================================================================
if exist ".gitkeep-ignore" (
    echo [INFO] Found .gitkeep-ignore. Purging ignored scratch and transient files...
    for /f "usebackq eol=# tokens=*" %%L in (".gitkeep-ignore") do (
        set "ITEM=%%~L"
        if defined ITEM (
            :: Handle directory paths ending with slash
            if "!ITEM:~-1!"=="/" (
                set "DIRPATH=!ITEM:~0,-1!"
                set "DIRPATH=!DIRPATH:/=\!"
                if exist "!DIRPATH!" (
                    echo   - Removing ignored directory: "!DIRPATH!"
                    rmdir /s /q "!DIRPATH!" 2>nul
                )
            ) else (
                :: Handle wildcard files or specific files
                set "FILEPATH=!ITEM:/=\!"
                if not "!FILEPATH:~0,1!"=="!" (
                    if exist "!FILEPATH!" (
                        echo   - Removing ignored file pattern: "!FILEPATH!"
                        del /f /q /a "!FILEPATH!" 2>nul
                    )
                )
            )
        )
    )
    echo [OK] .gitkeep-ignore processing completed.
) else (
    echo [INFO] No .gitkeep-ignore file found. Skipping pattern-based purge.
)
echo.

:: ----------------------------------------------------------------------
:: STEP 2: Cleaning previous build output
:: ----------------------------------------------------------------------
echo ======================================================================
echo  [STEP 2/7] Cleaning Build Outputs
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
echo  [STEP 3/7] Dependencies Verification
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
echo  [STEP 4/7] Application Icon Pipeline
echo ======================================================================
if "%ICONS%"=="1" (
    echo Generating application icons...
    call npm run build:icons
) else (
    echo Verifying standard BMP application icon...
    node fix-icon.cjs
)
echo [OK] Icons verified.
echo.

:: ----------------------------------------------------------------------
:: STEP 5: Build React Frontend (Vite)
:: ----------------------------------------------------------------------
echo ======================================================================
echo  [STEP 5/7] Building React Frontend (Vite)
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
if exist "native\ipname_core\build.bat" (
    echo Compiling Pure Custom Native DLL [ipname_core.dll]...
    pushd "native\ipname_core"
    call build.bat
    popd
    echo [OK] Pure Custom Native DLL pipeline completed.
    echo.
)

:: ----------------------------------------------------------------------
:: STEP 7: Build Tauri Native Application
:: ----------------------------------------------------------------------
echo ======================================================================
echo  [STEP 6/7] Compiling Tauri Native Executable (Rust)
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
echo  [STEP 7/7] Auto-Versioning Executable Output
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
echo   - Workspace Root: [e.g. IpName2 v1.10.2.exe]
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
