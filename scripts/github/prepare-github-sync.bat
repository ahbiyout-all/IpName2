@echo off
setlocal enabledelayedexpansion

title AhBiYout IpName2 - GitHub Sync ^& Core Staging Pipeline

echo ======================================================================
echo  AhBiYout IpName2 - Prepare ^& Sync Core Files for GitHub
echo ======================================================================
echo.

pushd "%~dp0\..\.."

:: --------------------------------------------------------------------
:: 1. Run Node.js core files verification with auto-cleaning of scratch files
:: --------------------------------------------------------------------
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

:: --------------------------------------------------------------------
:: 2. Check and stage verified core files
:: --------------------------------------------------------------------
where git >nul 2>&1
if errorlevel 1 (
    echo [WARNING] Git not found in system PATH.
    echo [OK] Core files cleaned and verified.
    popd
    pause
    exit /b 0
)

if not exist ".git" (
    echo [INFO] Initializing Git repository...
    git init
    git branch -M main
)

git branch -M main >nul 2>&1

:: Untrack excluded push scripts
git rm --cached git-push.bat >nul 2>&1
git rm --cached scripts\git-push.bat >nul 2>&1

echo [INFO] Staging clean core files...
git add .
echo [OK] Core files staged for GitHub sync.
echo.

:: --------------------------------------------------------------------
:: 3. Prompt or proceed to push
:: --------------------------------------------------------------------
echo ======================================================================
echo  Core files are verified and ready for GitHub.
echo ======================================================================
echo.
set /p "DO_PUSH=Do you want to proceed with Git commit and push to GitHub now? (Y/N, default=Y): "
if /i "%DO_PUSH%"=="" set "DO_PUSH=Y"
if /i "%DO_PUSH%"=="Y" (
    echo [INFO] Executing git-push.bat...
    if exist git-push.bat (
        call git-push.bat
    ) else (
        echo [ERROR] git-push.bat not found in project root.
    )
) else (
    echo [INFO] Sync preparation completed without pushing.
)

popd
exit /b 0
