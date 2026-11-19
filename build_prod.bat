@echo off
cd /d "C:\CircuitLab-Edu"
echo.
echo ==========================================
echo  CircuitLab Edu - Building Production Version
echo ==========================================
echo.
echo Building...
echo.
npm run build
echo.
echo Build complete.
echo Output in dist/ folder.
pause