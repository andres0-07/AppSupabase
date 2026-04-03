# BioTechK + Supabase

Migración del prototipo React + Vite hacia el ecosistema de Supabase.

## Incluye

- Supabase Auth por email/password
- Perfil por rol en tabla `profiles`
- Dashboard del CEO con validación o rechazo de evidencias
- Dashboard del líder con tareas asignadas y formulario para subir archivos
- Supabase Storage con bucket privado y Signed URLs
- Esquema SQL completo en `supabase_schema.sql`
- Políticas RLS para restringir lectura y escritura por usuario/rol

## Variables de entorno

Crea un archivo `.env` con:

```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## Instalación

```bash
npm install
npm run dev
```

## Flujo esperado

1. Crear proyecto en Supabase.
2. Ejecutar `supabase_schema.sql` en el SQL Editor.
3. Crear usuarios en Supabase Auth con metadata:
   - `full_name`
   - `role`
4. Iniciar sesión en la app.
5. El CEO ve todas las tareas y puede validar/rechazar evidencias.
6. Cada líder solo ve sus tareas y puede subir evidencias privadas.

## Estructura nueva

- `src/lib/supabase.ts`: cliente unificado
- `src/services/authService.ts`: login/logout y perfil actual
- `src/services/taskService.ts`: tareas y validación de evidencias
- `src/services/evidenceService.ts`: subida a Storage y Signed URLs
- `src/contexts/AuthContext.tsx`: sesión y perfil
- `src/app/pages/*`: vistas CEO, líder y login

## Notas

- El bucket esperado es `evidence`.
- Los archivos se guardan privados.
- Las URLs se abren usando Signed URLs temporales.
- RLS impide que un líder vea o edite tareas de otro usuario.
