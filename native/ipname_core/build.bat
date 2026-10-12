@echo off
setlocal

echo ======================================================================
echo  [IpNameCore DLL Builder] Compiling ipname_core.dll (Pure Custom Native DLL)
echo ======================================================================

set "COMPILED=0"

:: 1. Check for Microsoft Visual C++ Compiler (cl.exe)
where cl >nul 2>&1
if not errorlevel 1 (
    echo [OK] Microsoft Visual C++ compiler (cl.exe) found.
    cl /nologo /O2 /LD /DIPNAME_CORE_EXPORTS src\ipname_core.c /Fe:ipname_core.dll /link ws2_32.lib iphlpapi.lib
    if not errorlevel 1 (
        echo [OK] ipname_core.dll successfully created with MSVC.
        set "COMPILED=1"
    ) else (
        echo [WARNING] MSVC compilation failed. Rust native fallback will be used.
    )
)

:: 2. Check for MinGW GCC (gcc.exe) if not already compiled
if "%COMPILED%"=="0" (
    where gcc >nul 2>&1
    if not errorlevel 1 (
        echo [OK] MinGW GCC compiler (gcc.exe) found.
        gcc -O3 -shared -DIPNAME_CORE_EXPORTS -o ipname_core.dll src/ipname_core.c -lws2_32 -liphlpapi
        if not errorlevel 1 (
            echo [OK] ipname_core.dll successfully created with GCC.
            set "COMPILED=1"
        ) else (
            echo [WARNING] MinGW compilation failed. Rust native fallback will be used.
        )
    )
)

if "%COMPILED%"=="0" (
    echo [INFO] Neither cl.exe nor gcc.exe found in PATH.
    echo [INFO] IpName2 will use the built-in Rust native engine for full functionality.
)

:: 3. Copy compiled DLL to bin and release directories if it exists
if exist ipname_core.dll (
    if not exist "..\..\bin" mkdir "..\..\bin"
    copy /y ipname_core.dll "..\..\bin\ipname_core.dll" >nul
    if exist "..\..\src-tauri\target\release" (
        copy /y ipname_core.dll "..\..\src-tauri\target\release\ipname_core.dll" >nul
    )
    echo [OK] Copied ipname_core.dll to bin and release directories.
)

echo.
exit /b 0
