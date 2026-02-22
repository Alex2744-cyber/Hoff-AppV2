# 🔐 Sistema de Login - Cleaning App

Sistema de autenticación completo integrado con el backend API.

## ✅ Lo que se ha Creado

### 📁 Estructura de Archivos

```
cleaning-app/
├── services/
│   └── api.ts                    ✅ Servicio API completo
├── contexts/
│   └── AuthContext.tsx           ✅ Context de autenticación
├── app/
│   ├── index.tsx                 ✅ Redirección inicial
│   ├── _layout.tsx               ✅ Navegación actualizada
│   ├── auth/
│   │   └── login.tsx             ✅ Pantalla de login
│   ├── admin/
│   │   └── dashboard.tsx         ✅ Dashboard de administrador
│   └── worker/
│       └── dashboard.tsx         ✅ Dashboard de trabajador
```

## 🚀 Cómo Usar

### 1. Asegúrate de que el backend esté corriendo

```bash
cd C:\Users\Sebas\Desktop\cleaning-app-backend
npm start
```

Debería estar en: `http://localhost:3000`

### 2. Inicia la app React Native

```bash
cd C:\Users\Sebas\Desktop\HoffApp\cleaning-app
npm start
```

O para ejecutar directamente:
```bash
# En iOS
npm run ios

# En Android
npm run android

# En Web
npm run web
```

### 3. Credenciales de Prueba

**Administrador:**
- Usuario: `admin`
- Contraseña: `admin123`

**Trabajador:**
- Usuario: `jperez`
- Contraseña: `worker123`

Otros trabajadores disponibles:
- `alopez` / `worker123`
- `mgarcia` / `worker123`
- `lmartinez` / `worker123`
- `rdiaz` / `worker123`

## 📱 Flujo de la Aplicación

### Inicio de Sesión
1. La app abre en `/auth/login`
2. Selecciona tipo de usuario (Trabajador o Administrador)
3. Ingresa credenciales
4. Se conecta al backend en `http://localhost:3000/api`
5. Redirige automáticamente según el tipo de usuario

### Dashboard de Administrador
El admin ve:
- 📊 Estadísticas generales (tareas, trabajadores, clientes)
- 📋 Lista de todas las tareas con detalles
- 👷 Trabajadores activos
- 👥 Clientes recientes
- 🔄 Pull to refresh

### Dashboard de Trabajador
El trabajador ve:
- 📊 Sus estadísticas personales
- 📋 Solo sus tareas asignadas
- ✅ Tareas completadas
- ⏱️ Horas trabajadas
- 🔄 Pull to refresh

## 🔄 Funcionalidades Implementadas

✅ **Autenticación:**
- Login separado para admin y trabajador
- Sesión persistente con AsyncStorage
- Logout con confirmación
- Redirección automática según tipo de usuario

✅ **Dashboards Diferenciados:**
- Admin: Vista completa del sistema
- Trabajador: Vista personal de tareas

✅ **Conexión con Backend:**
- Todas las peticiones al backend funcionando
- Manejo de errores
- Estados de carga
- Pull to refresh

✅ **Navegación Protegida:**
- Redirección automática si no está autenticado
- Prevención de acceso entre roles
- Persistencia de sesión al cerrar y abrir la app

## 🎨 Características Visuales

- ✨ Diseño moderno y limpio
- 🎨 Colores diferenciados por rol (Admin: azul, Trabajador: verde)
- 📱 Responsive
- 🔄 Indicadores de carga
- ⚡ Animaciones suaves
- 📊 Tarjetas de estadísticas coloridas

## 🔧 Configuración de API

El servicio API se configura automáticamente según la plataforma:

```typescript
// En Android Emulator
'http://10.0.2.2:3000/api'

// En iOS Simulator
'http://localhost:3000/api'

// En dispositivo físico (necesitas cambiar a tu IP)
'http://192.168.1.XXX:3000/api'
```

## 📝 Datos Mostrados

### Admin Dashboard:
- Total de tareas (pendientes, asignadas, completadas)
- Número de trabajadores activos
- Número de clientes
- Detalles de cada tarea:
  - Cliente
  - Dirección
  - Fecha
  - Trabajadores asignados
  - Valor del servicio
  - Estado

### Worker Dashboard:
- Tareas asignadas al trabajador
- Tareas completadas
- Horas trabajadas total
- Detalles de cada tarea:
  - Cliente
  - Dirección
  - Fecha
  - Horas estimadas
  - Valor del servicio

## 🐛 Solución de Problemas

### Error: Cannot connect to server

1. Verifica que el backend esté corriendo:
```bash
curl http://localhost:3000
```

2. Si estás en Android Emulator, asegúrate de usar `10.0.2.2` en lugar de `localhost`

3. Si estás en dispositivo físico, cambia la IP en `services/api.ts`

### Error: Network request failed

1. Verifica que MySQL esté corriendo
2. Verifica que el backend se haya iniciado correctamente
3. En Android, asegúrate de tener permisos de internet

### La app no redirige después del login

1. Verifica las credenciales
2. Revisa la consola de React Native para errores
3. Asegúrate de que el backend retorne el formato correcto

## 🎯 Próximos Pasos

La estructura está lista para agregar:
- ✨ Pantallas de detalles de tareas
- ✨ Formularios para crear/editar tareas
- ✨ Registro de horas trabajadas
- ✨ Upload de fotos
- ✨ Notificaciones push
- ✨ Búsqueda y filtros

## 📚 Archivos Clave

- `services/api.ts` - Todas las llamadas al backend
- `contexts/AuthContext.tsx` - Manejo de autenticación
- `app/_layout.tsx` - Navegación y protección de rutas
- `app/auth/login.tsx` - Pantalla de login
- `app/admin/dashboard.tsx` - Dashboard admin
- `app/worker/dashboard.tsx` - Dashboard trabajador

---

¡El sistema de login está completamente funcional y listo para usar! 🎉

