# SportEvents

Plataforma web de gestión de torneos deportivos amateur. Permite a los usuarios inscribir equipos en torneos de fútbol, baloncesto y tenis, seguir la clasificación en tiempo real y consultar resultados de partidos.

## Stack tecnológico

- **Backend:** Node.js + Express
- **Vistas:** EJS (server-side rendering)
- **Base de datos:** MySQL 8
- **Estilos:** Bootstrap 5 + CSS propio

## Requisitos previos

- Node.js 20+
- MySQL 8

## Instalación

1. **Clonar el repositorio**

   ```bash
   git clone https://github.com/julianrm10/sportevents.git
   cd sportevents
   ```

2. **Instalar dependencias**

   ```bash
   npm install
   ```

3. **Configurar las variables de entorno**

   ```bash
   cp .env.example .env
   ```

   Edita el archivo `.env` con tus valores (ver sección [Variables de entorno](#variables-de-entorno)).

4. **Crear la base de datos e importar el esquema**

   ```bash
   mysql -u root -p -e "source database.sql"
   ```

5. **Crear el usuario administrador**

   ```bash
   node seed.js
   ```

   Esto crea el usuario administrador con las credenciales:
   - **Email:** admin@eventosport.com
   - **Contraseña:** admin123

6. **Arrancar el servidor**

   ```bash
   node app.js
   ```

7. **Acceder a la aplicación**

   Abre el navegador en [http://localhost:3000](http://localhost:3000)

## Variables de entorno

Copia `.env.example` a `.env` y ajusta los valores según tu entorno local. Consulta el archivo [.env.example](.env.example) para ver la descripción de cada variable.

## Autor

Julián Buitrago Jiménez — TFG DAW 2026
