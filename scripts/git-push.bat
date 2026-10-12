@echo off
pushd "%~dp0\.."
call git-push.bat
popd
exit /b %errorlevel%
