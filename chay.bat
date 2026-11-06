@echo off
chcp 65001 >nul
cd /d "%~dp0"
where node >nul 2>nul
if errorlevel 1 goto missing
where npm >nul 2>nul
if errorlevel 1 goto missing
node -e "if(Number(process.versions.node.split('.')[0])<22)process.exit(1)"
if errorlevel 1 goto outdated
if not exist node_modules\three\package.json goto install
if not exist node_modules\express\package.json goto install
if not exist node_modules\ws\package.json goto install
if not exist node_modules\tiktok-live-connector\package.json goto install
goto run
:install
if not exist package-lock.json goto installWithoutLock
call npm ci
if errorlevel 1 goto failed
goto run
:installWithoutLock
call npm install
if errorlevel 1 goto failed
:run
node server.js --open
if errorlevel 1 goto failed
exit /b 0
:missing
echo Chưa tìm thấy Node.js hoặc npm. Hãy vào https://nodejs.org cài Node.js LTS rồi mở lại chay.bat.
pause
exit /b 1
:outdated
echo Node.js quá cũ. Hãy cài Node.js LTS phiên bản 22 trở lên từ https://nodejs.org rồi thử lại.
pause
exit /b 1
:failed
echo Không thể cài thư viện hoặc chạy máy chủ. Hãy đọc lỗi phía trên, kiểm tra mạng và cổng 3000.
pause
exit /b 1
