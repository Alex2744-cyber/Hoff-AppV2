# Script para probar el backend desde PowerShell
Write-Host "=== PROBANDO BACKEND ===" -ForegroundColor Cyan

Write-Host "`n1. Verificando conexión al backend..." -ForegroundColor Yellow
try {
    $response = Invoke-RestMethod -Uri "http://192.168.1.110:3000"
    Write-Host "✅ Backend accesible" -ForegroundColor Green
    Write-Host "   Version: $($response.version)" -ForegroundColor Gray
} catch {
    Write-Host "❌ Backend NO accesible" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit
}

Write-Host "`n2. Probando login de trabajador..." -ForegroundColor Yellow
try {
    $body = @{
        usuario = "jperez"
        password = "worker123"
    } | ConvertTo-Json

    $loginResponse = Invoke-RestMethod -Uri "http://192.168.1.110:3000/api/auth/login/trabajador" `
        -Method POST `
        -ContentType "application/json" `
        -Body $body

    if ($loginResponse.success) {
        Write-Host "✅ Login funcionando correctamente" -ForegroundColor Green
        Write-Host "   Usuario: $($loginResponse.user.nombre)" -ForegroundColor Gray
        Write-Host "   Tipo: $($loginResponse.user.tipo)" -ForegroundColor Gray
    } else {
        Write-Host "❌ Login falló" -ForegroundColor Red
    }
} catch {
    Write-Host "❌ Error en login" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host "`n3. Probando obtener tareas..." -ForegroundColor Yellow
try {
    $tareas = Invoke-RestMethod -Uri "http://192.168.1.110:3000/api/tareas"
    if ($tareas.success) {
        Write-Host "✅ Endpoint de tareas funcionando" -ForegroundColor Green
        Write-Host "   Total tareas: $($tareas.data.Count)" -ForegroundColor Gray
    }
} catch {
    Write-Host "❌ Error obteniendo tareas" -ForegroundColor Red
}

Write-Host "`n=== RESUMEN ===" -ForegroundColor Cyan
Write-Host "Backend URL: http://192.168.1.110:3000" -ForegroundColor White
Write-Host "`nSi todos los tests pasaron ✅, el backend funciona correctamente." -ForegroundColor Green
Write-Host "El problema está en la app React Native (caché o permisos)." -ForegroundColor Yellow
Write-Host "`nSolución: Detén Expo (Ctrl+C) y ejecuta:" -ForegroundColor White
Write-Host "  npx expo start --clear" -ForegroundColor Cyan










