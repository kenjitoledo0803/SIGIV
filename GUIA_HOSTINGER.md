# 🚀 Guía de Despliegue en Hostinger

Esta guía te ayudará a subir tu aplicación **Givaudan Import System** a Hostinger.

## 📋 Requisitos Previos
1.  Una cuenta activa en Hostinger.
2.  Acceso al **hPanel** (Panel de control).
3.  Los archivos de tu proyecto listos.

---

## 1️⃣ Preparar la Base de Datos

1.  Entra a tu hPanel de Hostinger.
2.  Ve a la sección **Bases de Datos** -> **Gestión de Bases de Datos**.
3.  Crea una nueva base de datos:
    *   **Nombre de la Base de Datos**: (Ej. `u123456_ims`)
    *   **Usuario de la Base de Datos**: (Ej. `u123456_admin`)
    *   **Contraseña**: (Crea una contraseña segura y **guárdala**)
4.  Haz clic en **Crear**.
5.  Una vez creada, haz clic en **Ingresar a phpMyAdmin**.
6.  En phpMyAdmin:
    *   Selecciona tu base de datos a la izquierda.
    *   Ve a la pestaña **Importar**.
    *   Selecciona el archivo `api/db_schema.sql` de tu carpeta de proyecto.
    *   Haz clic en **Continuar** (o Importar).
    *   *¡Listo! Tus tablas deberían aparecer.*

---

## 2️⃣ Configurar la Conexión

1.  En tu computadora, abre el archivo `api/db_config.php`.
2.  Edita las líneas con los datos que creaste en el paso 1:

```php
define('DB_HOST', 'localhost'); // En Hostinger suele ser 'localhost'
define('DB_NAME', 'u123456_ims'); // Tu nombre de BD real
define('DB_USER', 'u123456_admin'); // Tu usuario real
define('DB_PASS', 'TuContraseñaSegura'); // Tu contraseña real
```

3.  Guarda el archivo.

---

## 3️⃣ Subir los Archivos

1.  Ve al **Administrador de Archivos** en tu hPanel.
2.  Entra a la carpeta `public_html`.
    *   *Opción A (Raíz)*: Si quieres que tu app se vea en `tusitio.com`, borra el archivo `default.php` y sube todo aquí.
    *   *Opción B (Subcarpeta)*: Crea una carpeta llamada `sistema` (o lo que quieras) y entra en ella. Tu app se verá en `tusitio.com/sistema`.
3.  Sube **todo el contenido** de tu carpeta local (carpetas `api`, `css`, `js`, `index.html`, etc.).
    *   *Tip*: Puedes comprimir todo en un `.zip` en tu PC, subir el zip y luego dar clic derecho -> **Extract** en el Administrador de Archivos. Es más rápido.

---

## 4️⃣ Verificación Final

1.  Abre tu navegador y entra a tu dominio (ej. `www.tusitio.com` o `www.tusitio.com/sistema`).
2.  Deberías ver la pantalla de **Login**.
3.  **Usuario por defecto**: El sistema no crea un usuario admin por defecto en el SQL.
    *   **Solución**: Debes registrar el primer usuario manualmente o insertar uno en la base de datos.
    *   Ve a la URL de tu API para registrarte (truco rápido):
        *   Usa Postman o edita la base de datos en phpMyAdmin -> Tabla `users` -> Insertar.
        *   O simplemente usa el botón de "Registro" si lo habilitaste en el frontend (actualmente el frontend solo muestra Login).

    *   **Crear Usuario Admin en phpMyAdmin**:
        1.  Ve a la tabla `users`.
        2.  Insertar:
            *   id: `admin1`
            *   username: `admin`
            *   email: `admin@givaudan.com`
            *   password_hash: `$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi` (Esto es la contraseña "password")
            *   role: `ADMIN`

4.  Intenta iniciar sesión con `admin` / `password`.

---

## 🛡️ Notas de Seguridad Importantes

1.  **Archivo .htaccess**: He creado un archivo `api/.htaccess` que protege tu configuración. Asegúrate de subirlo (a veces los archivos que empiezan con `.` están ocultos, verifica que se suba).
2.  **Concurrencia**: Este sistema guarda **toda la base de datos** cada vez que alguien hace un cambio.
    *   ⚠️ **Riesgo**: Si dos personas editan al mismo tiempo, el último en guardar sobrescribirá los cambios del primero.
    *   **Recomendación**: Úsalo con precaución si hay múltiples usuarios editando a la vez.

## 🆘 Solución de Problemas

*   **Error 500**: Revisa que los datos en `db_config.php` sean exactos.
*   **Error 404 en API**: Verifica que la carpeta `api` se subió correctamente y tiene permisos (usualmente 755 para carpetas, 644 para archivos).
