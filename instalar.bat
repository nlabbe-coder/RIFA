@echo off
echo ========================================
echo   RifaBolivia - Instalacion
echo ========================================
echo.
echo Instalando dependencias...
npm install
echo.
echo Configurando base de datos...
npx prisma db push
echo.
echo Cargando datos iniciales...
npx tsx prisma/seed.ts
echo.
echo ========================================
echo   LISTO! Ejecuta: npm run dev
echo   Abre: http://localhost:3000
echo   Admin: http://localhost:3000/admin
echo   Email: admin@rifabolivia.com
echo   Pass:  admin123
echo ========================================
pause
