@echo off
echo Committing and pushing changes to GitHub...
git add .
git commit -m "Fix TypeScript error in teacher canteen page allergens processing"
git pull origin main
git push origin main
echo Done!
pause
