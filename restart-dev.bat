@echo off
echo Clearing cache and restarting dev server...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
npm start
