@echo off
setlocal enabledelayedexpansion

title AhBiYout IpName2 - Core Files Filter & GitHub Staging

echo ======================================================================
echo  AhBiYout IpName2 - Prepare & Verify Core Files for GitHub
echo ======================================================================
echo.

pushd "%~dp0\..\.."

:: 1. Run Node.js core files verification with auto-cleaning of scratch files
where node >nul 2>&1
if not errorlevel 1 (
    node scripts\github\verify-core-files.cjs --clean
    if errorlevel 1 (
        echo [ERROR] Core file verification failed. Please check missing files.
        popd
        pause
        exit /b 1
    )
) else (
    echo [WARNING] Node.js not detected in PATH. Skipping automated file audit.
)

:: 2. Show tracked git status if git is available
where git >nul 2>&1
if not errorlevel 1 (
    if exist ".git" (
        echo [INFO] Updating git index to reflect clean working tree...
        git add -u
        echo [OK] Git index updated.
    )
)

echo [OK] Core files verified. Ready for GitHub push.
echo.
popd
exit /b 0
