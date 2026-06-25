@echo off
echo Running schema migration consolidation...
node scripts/merge_migrations.js
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to merge migrations!
    pause
    exit /b %ERRORLEVEL%
)

echo Committing and pushing changes to GitHub...
git add .
git commit -m "Consolidate June 9 - June 13 migrations into setup files and fix u.full_name references"
git pull origin main
git push origin main
echo Done!
pause
