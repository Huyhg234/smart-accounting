@echo off
cd /d "%~dp0"
echo ===================================================
echo   CAI DAT VA CHAY APP KE TOAN THONG MINH
echo ===================================================
echo.

if exist node_modules (
    echo [INFO] Thu muc node_modules da ton tai. Bo qua buoc cai dat.
) else (
    echo [INFO] Phat hien chay lan dau. Dang cai dat cac thu vien can thiet...
    echo        Vui long cho trong giay lat...
    call npm install
    if %errorlevel% neq 0 (
        echo [ERROR] Co loi xay ra khi cai dat thu vien.
        pause
        exit /b %errorlevel%
    )
    echo [OK] Da cai dat xong thu vien.
)

echo.
echo [INFO] Dang khoi dong server...
echo ---------------------------------------------------
echo Ung dung se som san sang tai: http://localhost:5173
echo (Nhan Ctrl+C de dung server)
echo ---------------------------------------------------
echo.

call npm run dev
pause
