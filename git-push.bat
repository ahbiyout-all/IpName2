@echo off
setlocal enabledelayedexpansion

title AhBiYout IpName2 - Automated GitHub Push & Release Pipeline

echo ======================================================================
echo  AhBiYout IpName2 - Dynamic Version GitHub Push Pipeline
echo ======================================================================
echo.

set "REPO_NAME=IpName2"
set "GITHUB_USER=AhBiYout-all"
set "DEFAULT_REMOTE_URL=https://github.com/%GITHUB_USER%/%REPO_NAME%.git"
set "APP_VER=1.10.0"

:: --------------------------------------------------------------------
:: STEP 1: Dynamic Version Extraction
:: --------------------------------------------------------------------
if exist package.json (
    for /f "usebackq delims=" %%V in (`node -e "try { const p = require('./package.json'); if (p.version) console.log(p.version); } catch(e){}" 2^>nul`) do (
        set "APP_VER=%%V"
    )
)

echo [OK] Dynamic Version Extracted: v%APP_VER%
echo [OK] Target Repository: %DEFAULT_REMOTE_URL%
echo.

:: --------------------------------------------------------------------
:: STEP 2: Git Repository Check & Setup
:: --------------------------------------------------------------------
where git >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git is not installed or not in system PATH.
    pause
    exit /b 1
)

if not exist ".git" (
    echo [INFO] Initializing new Git repository...
    git init
    git branch -M main
)

git remote get-url origin >nul 2>&1
if errorlevel 1 (
    echo [INFO] Setting remote origin...
    git remote add origin %DEFAULT_REMOTE_URL%
) else (
    echo [OK] Remote origin confirmed.
)

:: --------------------------------------------------------------------
:: STEP 3: Core Files Verification & Purge Scratch Files
:: --------------------------------------------------------------------
if exist scripts\github\verify-core-files.cjs (
    echo [INFO] Running core files audit and purging unneeded files...
    node scripts\github\verify-core-files.cjs --clean
)

:: --------------------------------------------------------------------
:: STEP 4: Stage Files
:: --------------------------------------------------------------------
echo [INFO] Staging project files...
git add .

:: --------------------------------------------------------------------
:: STEP 5: Dynamic Version Commit
:: --------------------------------------------------------------------
set "COMMIT_MSG=chore-release-v%APP_VER%"
echo [INFO] Creating commit for v%APP_VER%...
git commit -m "%COMMIT_MSG%" >nul 2>&1
if errorlevel 1 (
    echo [INFO] No new changes to commit or working tree clean.
) else (
    echo [OK] Successfully committed changes for v%APP_VER%.
)

:: --------------------------------------------------------------------
:: STEP 6: Tagging & Push
:: --------------------------------------------------------------------
set "TAG_NAME=v%APP_VER%"
echo [INFO] Applying Git release tag: %TAG_NAME%
git tag -a "%TAG_NAME%" -m "Release-%TAG_NAME%" -f

echo.
echo ======================================================================
echo  Pushing to GitHub...
echo ======================================================================
git push -u origin main
if errorlevel 1 (
    echo [WARNING] Standard push failed, attempting force push...
    git push origin main --force
)

git push origin "%TAG_NAME%" --force

echo.
echo ======================================================================
echo  GITHUB PUSH PIPELINE COMPLETED SUCCESSFULLY!
echo ======================================================================
echo Repository: %DEFAULT_REMOTE_URL%
echo Version Tag: %TAG_NAME%
echo.
pause
exit /b 0
