@echo off
setlocal
cd /d %~dp0
if not exist package.json echo package.json tidak ditemukan & pause & exit /b 1
where node >nul 2>nul || (echo Node.js belum terpasang. & pause & exit /b 1)
where npm >nul 2>nul || (echo npm belum tersedia. & pause & exit /b 1)
call npm install || goto :error
call npm start || goto :error
exit /b 0
:error
echo.
echo Gagal menjalankan Solvox. Lihat pesan error di atas.
pause
