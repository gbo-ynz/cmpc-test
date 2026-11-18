# Especificación funcional y trazabilidad

Fuente: enunciado _Prueba Técnica Full Stack — CMPC Libros_. Este documento traduce cada requisito a
**criterios de aceptación verificables** y los vincula con el **test que los comprueba**.

## Cómo usar este documento

- Es la referencia contra la que se valida cualquier cambio: si un cambio altera un comportamiento descrito
  aquí, se actualizan en el mismo commit el criterio, el código y el test.
- Un requisito nuevo entra primero como criterio de aceptación (con su ID) y luego como test que falla.
- Un criterio sin test automatizado se marca ⚠️ y se registra como brecha; no se oculta. Las brechas ya
  cerradas, y cómo se verificó cada cierre, están al final.

### Convenciones

| Prefijo  | Ámbito                                   |
| -------- | ---------------------------------------- |
| `RF-xx`  | Requisito funcional del frontend         |
| `RB-xx`  | Requisito funcional del backend          |
| `BD-xx`  | Base de datos                            |
| `RA-xx`  | Requerimientos adicionales del enunciado |
| `RNF-xx` | Requisitos no funcionales                |

Referencias a tests (se indica el archivo y el nombre del test):

| Suite   | Archivos                        | Herramienta                           | Comando            |
| ------- | ------------------------------- | ------------------------------------- | ------------------ |
| **API** | `apps/api/src/**/*.spec.ts`     | Jest (unitarios y HTTP en proceso)    | `npm test`         |
| **INT** | `apps/api/src/**/*.int-spec.ts` | Jest + Testcontainers (PostgreSQL 16) | `npm run test:int` |
| **WEB** | `apps/web/src/**/*.test.ts(x)`  | Vitest + Testing Library              | `npm test`         |
| **E2E** | `apps/e2e/tests/*.ts`           | Playwright contra el stack de Docker  | `npm run test:e2e` |

Estado: ✅ cubierto por tests automatizados · ⚠️ verificado parcialmente o de forma manual. Hoy todos los
criterios están en ✅ (ver [Brechas cerradas](#brechas-cerradas)).

## Modelo del dominio

Un **libro** tiene: título, autor, editorial, género, precio y disponibilidad (enunciado), más imagen de
portada opcional y fechas de alta, actualización y eliminación lógica.

| Campo        | Regla                                                                         |
| ------------ | ----------------------------------------------------------------------------- |
| Título       | Obligatorio, 1–255 caracteres (se recortan espacios)                          |
| Autor        | Obligatorio, 1–160 caracteres; se normaliza en `authors`                      |
| Editorial    | Obligatoria, 1–160 caracteres; se normaliza en `publishers`                   |
| Género       | Obligatorio, 1–80 caracteres; se normaliza en `genres`                        |
| Precio (CLP) | 0 a 9.999.999.999,99; máximo 2 decimales; sin flotantes (`Price` en centavos) |
| Disponible   | Booleano                                                                      |
| Portada      | Opcional; JPEG, PNG o WEBP; máximo 2 MB                                       |

---

## Frontend (React + TypeScript)

### RF-01 · Login de autenticación ✅

| CA  | Criterio de aceptación                                                                                                 | Verificado por                                                                                                                                                           |
| --- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Un correo con formato inválido o una contraseña de menos de 8 caracteres muestran el error sin llamar a la API         | WEB `auth.test.tsx` › "validates email format and password length", "shows reactive validation errors"; E2E `auth.spec.ts` › "validates the form before calling the API" |
| 2   | Con credenciales inválidas se muestra "Correo electrónico o contraseña incorrectos." y el usuario sigue en `/login`    | WEB `auth.test.tsx` › "shows the server error on invalid credentials"; E2E `auth.spec.ts` › "rejects wrong credentials with a friendly message"                          |
| 3   | Sin sesión, una ruta protegida redirige a `/login`; tras autenticarse vuelve a la ruta solicitada                      | WEB `auth.test.tsx` › "sends anonymous users to the login page"; E2E `auth.spec.ts` › "redirects anonymous users…", `auth.setup.ts`                                      |
| 4   | Un usuario autenticado que entra a `/login` va directo al inventario                                                   | WEB `auth.test.tsx` › "redirects already authenticated users"                                                                                                            |
| 5   | "Cerrar sesión" borra la sesión y las rutas protegidas dejan de ser accesibles                                         | WEB `auth.test.tsx` › "logs out, clears the cache and goes to login"; E2E `auth.spec.ts` › "signs out and protected pages are no longer reachable"                       |
| 6   | El login admite como máximo 5 intentos por minuto por IP; el sexto responde 429 y la UI muestra "Demasiados intentos…" | API `http-security.spec.ts` › "allows 5 login attempts per minute and rejects the next one with 429"; WEB `api.test.ts` › "maps %s" (caso `TOO_MANY_REQUESTS`)           |
| 7   | Cualquier respuesta 401 de la API cierra la sesión y lleva al login                                                    | WEB `api.test.ts` › "ends the session on 401"; `auth.test.tsx` › "logs out when the HTTP client reports an expired session"                                              |

### RF-02 · Filtrado avanzado ✅

| CA  | Criterio de aceptación                                                                                  | Verificado por                                                                                                                                                                                                                                                                                                                                                                     |
| --- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Se puede filtrar por género, editorial, autor y disponibilidad, y los filtros se combinan (AND)         | API `persistence.spec.ts` › "always excludes soft-deleted rows and ignores absent filters"; E2E `book-list.spec.ts` › "filters combine: genre + availability"                                                                                                                                                                                                                      |
| 2   | Las opciones de cada filtro provienen del catálogo y solo incluyen valores con al menos un libro activo | INT `prisma-catalog.repository.int-spec.ts` › "lists only authors, publishers and genres that still have an active book", "lists a value again, sorted by name, as soon as it has an active book"; WEB `components.test.tsx` › "fills selects from the catalog and reports changes"; E2E `book-lifecycle.spec.ts` › paso "its genre, now without active books, leaves the filters" |
| 3   | Cambiar un filtro, el orden o el tamaño de página vuelve a la página 1                                  | WEB `application.test.tsx` › "goes back to page 1 whenever filters, sort or page size change"                                                                                                                                                                                                                                                                                      |
| 4   | "Limpiar filtros" restablece búsqueda, filtros y orden                                                  | WEB `application.test.tsx` › "resets filters and sort"                                                                                                                                                                                                                                                                                                                             |
| 5   | Sin resultados se muestra "No se encontraron libros"                                                    | WEB `components.test.tsx` › "shows loading and empty states"; E2E `book-lifecycle.spec.ts`                                                                                                                                                                                                                                                                                         |

### RF-03 · Ordenamiento dinámico por múltiples campos ✅

| CA  | Criterio de aceptación                                                                                    | Verificado por                                                                                                                                                                                            |
| --- | --------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Un clic en un encabezado alterna ascendente → descendente → sin orden                                     | WEB `domain.test.ts` › "cycles a column through asc → desc → none"                                                                                                                                        |
| 2   | Varias columnas ordenan en conjunto; la prioridad es el orden de los clics y se muestra junto a la flecha | WEB `domain.test.ts` › "appends new columns so click order defines priority"; `components.test.tsx` › "exposes sort state and priority on headers"; E2E `book-list.spec.ts` › "sorts by several columns…" |
| 3   | El orden se resuelve en el servidor, incluso por campos de relaciones (autor, editorial, género)          | API `persistence.spec.ts` › "supports multi-field sorting including relations"                                                                                                                            |
| 4   | La API solo acepta campos permitidos; cualquier otro responde 400                                         | API `book-query.mapper.spec.ts` › "parses multiple whitelisted fields", "rejects %p"                                                                                                                      |
| 5   | Sin orden explícito, los libros más nuevos van primero, con desempate determinista (paginación estable)   | API `persistence.spec.ts` › "defaults to newest first with a deterministic tie-breaker"                                                                                                                   |

### RF-04 · Paginación del lado del servidor ✅

| CA  | Criterio de aceptación                                                                                | Verificado por                                                                                                                                       |
| --- | ----------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | La API recibe `page` y `limit` (1–100) y devuelve `meta` con `total`, `page`, `limit` y `totalPages`  | API `pagination.spec.ts` (3 tests); `book-queries.spec.ts` › "returns a page of views with metadata"                                                 |
| 2   | La UI ofrece tamaños de 10, 20 y 50, y los botones Anterior/Siguiente se deshabilitan en los extremos | WEB `ui.test.tsx` › "navigates between pages and changes the page size", "disables both directions on a single page"                                 |
| 3   | Cambiar de página pide solo esa página al servidor                                                    | WEB `infrastructure.test.ts` › "adds pagination for list requests"; E2E `book-list.spec.ts` › "sorts by several columns and paginates on the server" |

### RF-05 · Búsqueda en tiempo real con debounce ✅

| CA  | Criterio de aceptación                                                                               | Verificado por                                                                                                                                                                                            |
| --- | ---------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | La búsqueda se envía 400 ms después de la última tecla: escribir una palabra genera **una** petición | WEB `shared.test.ts` › "only emits the value after the delay"; `application.test.tsx` › "debounces the search…"; E2E `book-list.spec.ts` › "search is debounced: one request after the user stops typing" |
| 2   | Busca en título, autor y editorial, sin distinguir mayúsculas                                        | API `persistence.spec.ts` › "searches case-insensitively in title, author and publisher"                                                                                                                  |
| 3   | Mientras llega la respuesta, la tabla anterior sigue visible (sin parpadeo)                          | WEB `application.test.tsx` › "keeps the previous page visible while the next one loads (no table flicker)"                                                                                                |

### RF-06 · Formulario de alta y edición con validación reactiva ✅

| CA  | Criterio de aceptación                                                                                                                                                                                                      | Verificado por                                                                                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Los errores aparecen mientras se escribe, según las reglas del [modelo](#modelo-del-dominio)                                                                                                                                | WEB `BookForm.test.tsx` › "validates reactively while the user types"; E2E `book-lifecycle.spec.ts` › paso "reactive validation…"                                                                                                                                       |
| 2   | El botón de guardar se habilita solo si el formulario es válido y, al editar, si hay cambios                                                                                                                                | WEB `BookForm.test.tsx` › "keeps the edit form disabled until something changes"                                                                                                                                                                                        |
| 3   | Autor, editorial y género sugieren los nombres existentes; un nombre nuevo se crea al guardar                                                                                                                               | WEB `BookForm.test.tsx` › "offers every existing record of each catalog"; API `persistence.spec.ts` › "maps the aggregate to a write model that only connects existing catalog records"                                                                                 |
| 4   | Al crear se navega al detalle; si falla el guardado, el usuario permanece en el formulario con el error                                                                                                                     | WEB `pages.test.tsx` › "creates the book and opens its detail", "keeps the user on the form when saving fails"                                                                                                                                                          |
| 5   | La edición precarga los datos actuales; al guardar, el usuario **permanece en "Editar libro"**, ve "Los cambios se guardaron correctamente." (desplazado a la vista) y el formulario queda limpio con los valores guardados | WEB `pages.test.tsx` › "pre-fills the form, saves and stays on the edit page with a confirmation"; `ui.test.tsx` › "SuccessBanner announces itself and scrolls into view…"; E2E `book-edit.spec.ts` › "from the list, \"Editar\" opens the form and saving stays on it" |
| 6   | Desde la edición, el enlace superior siempre es "← Volver al inventario", se llegue desde el listado o desde el detalle                                                                                                     | WEB `pages.test.tsx` › "always offers a way back to the inventory"; E2E `book-edit.spec.ts` › "from the detail, saving stays on the form and the top link goes back to the inventory"                                                                                   |
| 7   | La API aplica las mismas reglas (no confía en el cliente) y responde 400 con el detalle                                                                                                                                     | API `book-commands.spec.ts` › "does not persist nor audit invalid books"; `error-resolver.spec.ts` › "exposes class-validator messages as details"; `price.spec.ts` (4 tests)                                                                                           |

### RF-07 · Carga de una imagen por libro ✅

| CA  | Criterio de aceptación                                                                                   | Verificado por                                                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Se aceptan JPEG, PNG y WEBP de hasta 2 MB, con vista previa; otros archivos muestran un error            | WEB `domain.test.ts` › "accepts supported images up to 2MB", "rejects other types and big files"; `components.test.tsx` › "previews a valid image…", "rejects unsupported files" |
| 2   | La API valida tamaño, tipo y **contenido real** (magic bytes), no solo el MIME declarado                 | API `image-file.pipe.spec.ts` (4 tests)                                                                                                                                          |
| 3   | El archivo se guarda con nombre aleatorio y no es posible borrar archivos fuera de la carpeta de uploads | API `local-image-storage.spec.ts` › "writes the file with a random name…", "cannot be tricked into deleting files outside the uploads dir"                                       |
| 4   | Una portada nueva reemplaza la anterior y borra su archivo                                               | API `upload-book-image.use-case.spec.ts` › "removes the previous image when replacing it"                                                                                        |
| 5   | Si falla la base de datos, el archivo recién subido se elimina (sin huérfanos)                           | API `upload-book-image.use-case.spec.ts` › "compensates by deleting the new file when persistence fails"                                                                         |
| 6   | La portada subida se ve en el detalle                                                                    | E2E `book-lifecycle.spec.ts` › paso "creates the book with a cover image"                                                                                                        |

### RF-08 · Visualizar los datos de un libro ✅

| CA  | Criterio de aceptación                                                          | Verificado por                                                                                                                             |
| --- | ------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | El detalle muestra todos los atributos, la portada (o un marcador) y las fechas | WEB `components.test.tsx` › "shows every book attribute and the cover", "shows a placeholder without cover"                                |
| 2   | Un libro inexistente o eliminado responde 404 y la UI muestra el error          | API `book-queries.spec.ts` › "throws when the book does not exist"; WEB `pages.test.tsx` › "shows an error when the book cannot be loaded" |

---

## Backend (NestJS + TypeScript)

### RB-01 · Arquitectura modular y escalable (SOLID) ✅

| CA  | Criterio de aceptación                                                                         | Verificado por                                             |
| --- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| 1   | Un módulo por bounded context; capas `domain`, `application`, `infrastructure`, `presentation` | Estructura de carpetas; [ARCHITECTURE.md](ARCHITECTURE.md) |
| 2   | Los casos de uso dependen de puertos (`abstract class`), nunca de Prisma                       | Tests de casos de uso con fakes en memoria (`test-utils/`) |
| 3   | Ningún archivo supera 60 líneas                                                                | ESLint `max-lines` en el pre-commit (`npm run lint`)       |

### RB-02 · Autenticación JWT ✅

| CA  | Criterio de aceptación                                                                               | Verificado por                                                                                                                                        |
| --- | ---------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Todas las rutas exigen un JWT, salvo las marcadas con `@Public()` (login y health)                   | API `auth-infrastructure.spec.ts` › "lets public routes through without a token", "delegates protected routes to passport"                            |
| 2   | El login devuelve un token firmado y el perfil público (sin el hash de la contraseña)                | API `login.use-case.spec.ts` › "returns a token and the public user profile…"; `auth-infrastructure.spec.ts` › "signs the identity claims"            |
| 3   | La verificación de la contraseña tarda lo mismo exista o no el usuario (sin enumeración de usuarios) | API `login.use-case.spec.ts` › "still verifies a password when the user does not exist (timing safe)"                                                 |
| 4   | Un token válido de un usuario que ya no existe responde 401; el rol se lee de la base, no del token  | API `auth-infrastructure.spec.ts` › "rejects a valid token whose user no longer exists", "resolves the user from the database, with its current role" |
| 5   | El token expira (por defecto, 1 hora)                                                                | Configuración validada al iniciar: API `env.validation.spec.ts` › "applies defaults…"                                                                 |

### RB-03 · Endpoints RESTful para el CRUD de libros ✅

| CA  | Criterio de aceptación                                                                                   | Verificado por                                                                                                                                                            |
| --- | -------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `POST /books` 201, `GET /books`, `GET /books/:id`, `PATCH /books/:id` (parcial), `DELETE /books/:id` 204 | API `controllers.spec.ts` (3 tests); `book-commands.spec.ts`; `book-queries.spec.ts`                                                                                      |
| 2   | `PATCH` aplica solo los campos enviados                                                                  | API `book-commands.spec.ts` › "applies partial changes: with no stock the book is no longer available"; `book.spec.ts` › "updates immutably, ignoring undefined fields"   |
| 3   | Operar sobre un libro inexistente responde 404                                                           | API `book-commands.spec.ts` › "fails for unknown books"                                                                                                                   |
| 4   | Los cuerpos con campos no declarados o inválidos se rechazan con 400                                     | `ValidationPipe` global con `whitelist` y `forbidNonWhitelisted` (`bootstrap/app.setup.ts`); API `error-resolver.spec.ts` › "exposes class-validator messages as details" |

### RB-04 · Exportación de datos en CSV ✅

| CA  | Criterio de aceptación                                                                                                    | Verificado por                                                                                                                                                                                                                    |
| --- | ------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `GET /books/export` aplica los mismos filtros y orden que el listado, sin paginar                                         | E2E `book-export.spec.ts` › "exports exactly the filtered rows as CSV"                                                                                                                                                            |
| 2   | UTF-8 con BOM, encabezados en español, fin de línea CRLF, nombre `libros-AAAA-MM-DD.csv`                                  | API `book-queries.spec.ts` › "streams a BOM, the header and one line per book…"; `book-csv.serializer.spec.ts` › "writes the header in column order"; WEB `shared.test.ts` › "builds dated file names"; E2E `book-export.spec.ts` |
| 3   | Las celdas que empiezan con `=`, `+`, `-`, `@` se neutralizan (inyección de fórmulas) y se escapan comillas y separadores | API `book-csv.serializer.spec.ts` › "neutralizes CSV injection and escapes %p", "quotes values containing separators or quotes"                                                                                                   |
| 4   | Se genera en streaming (memoria constante) y se registra en auditoría (`EXPORT`)                                          | API `controllers.spec.ts` › "streams the CSV export as a file"; `book-queries.spec.ts` (auditoría)                                                                                                                                |

### RB-05 · Soft delete ✅

| CA  | Criterio de aceptación                                                                       | Verificado por                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Eliminar marca `deleted_at`; la fila se conserva                                             | API `book-commands.spec.ts` › "soft deletes: the row stays but is no longer found"                                               |
| 2   | Todas las consultas excluyen los libros eliminados (listado, detalle, exportación, catálogo) | API `persistence.spec.ts` › "always excludes soft-deleted rows…"; E2E `book-lifecycle.spec.ts` (búsqueda y filtro tras eliminar) |
| 3   | Un libro eliminado no admite más cambios                                                     | API `book.spec.ts` › "soft deletes and then refuses further changes"                                                             |
| 4   | La UI pide confirmación en la misma pantalla y permite cancelar                              | WEB `components.test.tsx` › "asks for confirmation, can be cancelled, then deletes"                                              |

### RB-06 · Logging para auditoría de operaciones ✅

| CA  | Criterio de aceptación                                                                                               | Verificado por                                                                                                                  |
| --- | -------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Se auditan `LOGIN`, `CREATE`, `UPDATE`, `DELETE`, `UPLOAD_IMAGE` y `EXPORT`, con usuario, entidad, metadatos y fecha | API `login.use-case.spec.ts`, `book-commands.spec.ts`, `upload-book-image.use-case.spec.ts`, `book-queries.spec.ts`             |
| 2   | La auditoría de un cambio se escribe en la misma transacción: no hay cambio sin registro ni registro sin cambio      | API `book-commands.spec.ts` › "persists the book and audits inside one transaction", "does not persist nor audit invalid books" |
| 3   | Cada petición HTTP se registra con método, ruta, estado y latencia                                                   | API `request-logging.interceptor.spec.ts` (3 tests)                                                                             |
| 4   | Los errores 5xx se registran con su stack trace                                                                      | API `all-exceptions.filter.spec.ts` › "logs server errors with their stack trace"                                               |

---

## Base de datos (PostgreSQL + Prisma)

### BD-01 · Prisma: esquema declarativo, migraciones y cliente tipado ✅

| CA  | Criterio de aceptación                                                              | Verificado por                                                                |
| --- | ----------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 1   | El modelo está en `schema.prisma` y los cambios se versionan como migraciones SQL   | `apps/api/prisma/schema.prisma`, `apps/api/prisma/migrations/`                |
| 2   | Las migraciones se aplican solas al iniciar el contenedor (`prisma migrate deploy`) | `apps/api/docker-entrypoint.sh`; ejercitado por cada corrida E2E sobre Docker |

### BD-02 · Modelo normalizado con relaciones ✅

| CA  | Criterio de aceptación                                                                                 | Verificado por                                                                                                                            |
| --- | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Autores, editoriales y géneros viven en tablas propias con nombre único; `books` los referencia por FK | API `persistence.spec.ts` › "maps the aggregate to a write model that only connects existing catalog records"; [DATABASE.md](DATABASE.md) |
| 2   | `audit_logs` referencia al usuario que ejecutó la operación                                            | `schema.prisma`; RB-02 CA-4 impide escribir auditoría con un usuario inexistente                                                          |

### BD-03 · Índices para consultas frecuentes ✅

| CA  | Criterio de aceptación                                                                                    | Verificado por                                                                                                           |
| --- | --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| 1   | La migración crea los índices compuestos `(deleted_at, <fk>)`, el de precio y el trigram (GIN) del título | INT `database-indexes.int-spec.ts` › "creates every index the frequent queries rely on"                                  |
| 2   | La búsqueda de texto sin distinguir mayúsculas (`ILIKE`) usa el índice trigram                            | INT `database-indexes.int-spec.ts` › "serves the case-insensitive title search with the trigram index"                   |
| 3   | "Libros activos de un género" (filtros y catálogo) usa el índice compuesto `(deleted_at, genre_id)`       | INT `database-indexes.int-spec.ts` › "serves \"active books of a genre\" (filters and catalog) with the composite index" |

Los planes se verifican sobre 2.000 libros con `ANALYZE`: en una tabla vacía la elección de índice del
planificador es arbitraria y el test no probaría nada. Justificación de cada índice en [DATABASE.md](DATABASE.md).

### BD-04 · Transacciones en operaciones críticas ✅

| CA  | Criterio de aceptación                                                                       | Verificado por                                                                                 |
| --- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| 1   | Libro, referencias (autor, editorial, género) y auditoría se confirman o se revierten juntos | API `book-commands.spec.ts` › "persists the book and audits inside one transaction"            |
| 2   | Una transacción anidada se une a la externa en lugar de abrir otra                           | API `prisma.service.spec.ts` › "joins the outer transaction instead of nesting"                |
| 3   | Los repositorios usan la transacción activa sin recibirla por parámetro                      | API `prisma.service.spec.ts` › "routes `db` to the transaction client inside runInTransaction" |

### BD-05 · Datos de ejemplo ✅

| CA  | Criterio de aceptación                                                          | Verificado por                                                                                     |
| --- | ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- |
| 1   | Con la base vacía, el seed crea el usuario administrador, 23 libros y 8 géneros | INT `seed.int-spec.ts` › "loads one user per role and the demo catalog into an empty database"     |
| 2   | El seed es idempotente: ejecutarlo de nuevo no duplica ni modifica datos        | INT `seed.int-spec.ts` › "is idempotent: running it again changes nothing"                         |
| 3   | Si la base ya tiene libros, el seed no los toca                                 | INT `seed.int-spec.ts` › "never overwrites existing data: a database with books is left untouched" |

---

## Requerimientos adicionales

### RA-01 · Manejo de errores en el frontend ✅

| CA  | Criterio de aceptación                                                                               | Verificado por                                                                                                                                          |
| --- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Cada código de error de la API se traduce a un mensaje en español; nunca se muestran textos técnicos | WEB `api.test.ts` › "translates the backend error code…", "maps %s", "never shows technical messages to the user"                                       |
| 2   | Sin conexión con el servidor se muestra un mensaje específico                                        | WEB `api.test.ts` › "explains network failures"                                                                                                         |
| 3   | Los errores de carga y guardado se muestran en un banner sin perder lo escrito                       | WEB `pages.test.tsx` › "shows API errors", "shows save errors", "shows load errors"; `ui.test.tsx` › "ErrorBanner shows message and validation details" |
| 4   | Un error inesperado de una ruta muestra una pantalla de error, no una página en blanco               | WEB `ui.test.tsx` › "RouteError renders thrown errors"                                                                                                  |

### RA-02 · Manejo de errores en el backend ✅

| CA  | Criterio de aceptación                                                                               | Verificado por                                                                        |
| --- | ---------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | Todos los errores responden con `{ success: false, data: null, error: { code, message, details? } }` | API `all-exceptions.filter.spec.ts` › "renders domain errors with the error envelope" |
| 2   | Los errores de validación incluyen el detalle por campo                                              | API `error-resolver.spec.ts` › "exposes class-validator messages as details"          |
| 3   | Los errores inesperados (5xx) nunca exponen detalles internos al cliente                             | API `error-resolver.spec.ts` › "hides internals of unexpected errors"                 |

### RA-03 · Interceptores para transformar respuestas ✅

| CA  | Criterio de aceptación                                                               | Verificado por                                                                                         |
| --- | ------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| 1   | Toda respuesta exitosa se envuelve en `{ success: true, data, meta? }`               | API `response-envelope.interceptor.spec.ts` › "wraps plain payloads into the success envelope"         |
| 2   | La metadata de paginación sube a `meta`; un cuerpo vacío se normaliza a `data: null` | API `response-envelope.interceptor.spec.ts` › "lifts pagination metadata…", "normalizes empty bodies…" |
| 3   | Las descargas de archivos (CSV) no se envuelven                                      | API `response-envelope.interceptor.spec.ts` › "leaves file streams untouched"                          |

---

## Requisitos no funcionales

| ID     | Requisito                                                                                                                                                                    | Verificado por                                                                                                                                                                   |
| ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RNF-01 | Cobertura de al menos 80% en API y web                                                                                                                                       | ✅ Umbrales en `jest` (API) y `vite.config.ts` (web); `npm run test:cov` falla por debajo del 80%                                                                                |
| RNF-02 | Archivos de 60 líneas como máximo; lint, formato y tests antes de commitear y pushear                                                                                        | ✅ ESLint `max-lines`; Husky `pre-commit`, `commit-msg`, `pre-push`                                                                                                              |
| RNF-03 | La API no arranca con configuración inválida (por ejemplo, `JWT_SECRET` de menos de 32 caracteres)                                                                           | ✅ API `env.validation.spec.ts` (4 tests)                                                                                                                                        |
| RNF-04 | Headers de seguridad (`helmet`) y rate limiting global (120 peticiones por minuto); el healthcheck queda fuera del límite para que Docker no marque el contenedor como caído | ✅ API `http-security.spec.ts` › "limits authenticated routes to 120 requests per minute", "never throttles the health probe…", "sends security headers and hides the framework" |
| RNF-05 | Todo el stack se levanta con `docker compose up --build`, con healthchecks                                                                                                   | ✅ API `health.controller.spec.ts` (2 tests); cada corrida E2E usa el stack de Docker                                                                                            |
| RNF-06 | Documentación: README, Swagger, diagrama de arquitectura y modelo relacional                                                                                                 | ✅ `README.md`, `/api/docs`, [ARCHITECTURE.md](ARCHITECTURE.md), [DATABASE.md](DATABASE.md), `database.dbml`                                                                     |

## Ampliación: administración y perfiles

Requisitos agregados después del enunciado (no forman parte de la prueba original). Avance: fases 1 y 2 ✅ (perfiles, catálogos y stock), detalles del autor ✅ (RF-18) país de la editorial ✅ (RF-19) descripción del género ✅ (RF-20) exportación de catálogos ✅ (RF-21) administración de usuarios ✅ (RF-10) y ventas ✅ (RF-16 y RF-17); dashboard 🛠 (fases 4 y 5).

### Perfiles y permisos

| Capacidad                                          | Administrador (`ADMIN`) | Usuario (`USER`) |
| -------------------------------------------------- | :---------------------: | :--------------: |
| Dashboard                                          |           ✅            |        —         |
| Libros: listar, ver detalle, exportar CSV          |           ✅            |        ✅        |
| Libros: crear, editar, eliminar, subir portada     |           ✅            |        ✅        |
| Ventas: crear, listar, ver, completar y cancelar   |           ✅            |        ✅        |
| Autores, editoriales y géneros: administrar (CRUD) |           ✅            |        —         |
| Usuarios: administrar (CRUD)                       |           ✅            |        —         |

### RF-09 · Dashboard del administrador 🛠

| CA  | Criterio de aceptación                                                                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Al iniciar sesión, un administrador llega al dashboard; un usuario llega al inventario                                                       |
| 2   | Muestra: libros activos, disponibles y no disponibles, valor del inventario disponible, cantidad de autores, editoriales, géneros y usuarios |
| 3   | Muestra la cantidad de libros activos por género                                                                                             |
| 6   | Muestra las ventas: cantidad de pendientes, y cantidad y monto total de las completadas                                                      |
| 4   | Muestra las últimas 10 operaciones de auditoría (acción, entidad, usuario y fecha)                                                           |
| 5   | Un usuario que intenta abrirlo ve "No tiene permisos para ver esta página"; la API responde 403                                              |

### RF-10 · Administración de usuarios ✅

Verificado por: API `users.spec.ts` (alta normalizada y con hash, auditoría sin contraseña, correo repetido incluso de un usuario desactivado, contraseña opcional al editar, no eliminarse ni quitarse el perfil, último administrador), `users.http.spec.ts` (permisos 401/403, 400/404/409, la contraseña nunca aparece en una respuesta, paginación), `auth-infrastructure.spec.ts` › "hashes a password…"; INT `prisma-managed-user.repository.int-spec.ts`, `prisma-user.repository.int-spec.ts` (los desactivados no inician sesión); WEB `users.test.tsx`, `users.api.test.ts`, `auth.test.tsx` › menú del administrador; E2E `users.spec.ts` (el usuario creado inicia sesión y, al eliminarlo, su token deja de servir).

| CA  | Criterio de aceptación                                                                                                                                                                                                                                                                       |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | El listado muestra nombre, correo y perfil (Administrador o Usuario)                                                                                                                                                                                                                         |
| 2   | Crear exige nombre, correo válido y único, perfil y contraseña de al menos 8 caracteres; un correo repetido responde 409                                                                                                                                                                     |
| 3   | Editar permite cambiar nombre, correo y perfil; la contraseña es opcional y solo se cambia si se completa                                                                                                                                                                                    |
| 4   | La contraseña se guarda con bcrypt y nunca se devuelve en ninguna respuesta                                                                                                                                                                                                                  |
| 5   | Eliminar es una desactivación lógica (`deleted_at`): conserva la autoría en la auditoría; el usuario ya no puede iniciar sesión y sus tokens vigentes dejan de servir                                                                                                                        |
| 6   | Un administrador no puede eliminarse ni quitarse el perfil de administrador a sí mismo, y siempre debe quedar al menos un administrador activo (409)                                                                                                                                         |
| 7   | Crear, editar y eliminar quedan en `audit_logs`                                                                                                                                                                                                                                              |
| 8   | La pantalla de usuarios sigue la estructura de los catálogos: tabla (Nombre, Correo electrónico, Perfil, Acciones), "Agregar" abre "Nuevo usuario" y el lápiz abre "Editar usuario" con los datos cargados; el administrador en sesión no ve el botón de eliminar y su perfil está bloqueado |
| 9   | La tabla pagina **en el servidor** (RF-04): `GET /users?page&limit` (por defecto página 1 de 10; `limit` > 100 o `page` < 1 responde 400); solo administradores (403 para un usuario)                                                                                                        |

### RF-11 a RF-13 · Administración de autores, editoriales y géneros ✅

Verificado por: API `references.spec.ts` (eliminación), `authors.spec.ts`, `publishers.spec.ts`, `genres.spec.ts` y `references.http.spec.ts` (permisos, 201/400/404/409 por HTTP real); INT `prisma-reference.repository.int-spec.ts` (orden, conteo, mayúsculas, libros eliminados); WEB `references.test.tsx` (confirmación al eliminar), `authors.test.tsx`, `publishers.test.tsx`, `genres.test.tsx`; E2E `admin.spec.ts`, `authors.spec.ts`, `publishers.spec.ts`.

Las tres pantallas comparten las mismas reglas:

| CA  | Criterio de aceptación                                                                                                                                       |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | El listado muestra el nombre y la cantidad de libros activos, ordenado por nombre                                                                            |
| 2   | Crear y renombrar exigen un nombre no vacío y único sin distinguir mayúsculas ("Novela" y "novela" son el mismo); repetido responde 409                      |
| 3   | Solo se puede eliminar un registro sin libros asociados (ni activos ni eliminados, para no romper el historial); si no, responde 409 indicando cuántos tiene |
| 4   | Crear, renombrar y eliminar quedan en `audit_logs`                                                                                                           |

### RF-14 · Libros con catálogo administrado ✅

Verificado por: API `book-commands.spec.ts` › "resolves the catalog ids…", "rejects an unknown author, publisher or genre without persisting anything"; `persistence.spec.ts` › "maps the aggregate to a write model that only connects existing catalog records"; WEB `BookForm.test.tsx` › "offers every existing record of each catalog", "submits the selected catalog ids together with the image"; E2E `book-lifecycle.spec.ts`.

| CA  | Criterio de aceptación                                                                                                                                  |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | En el formulario de libro, autor, editorial y género se **eligen de listas** con todos los registros existentes (no se escriben)                        |
| 2   | La API recibe identificadores (`authorId`, `publisherId`, `genreId`) y rechaza con 400 uno inexistente; ya no crea registros nuevos al guardar un libro |
| 3   | Los filtros del inventario siguen mostrando solo valores con libros activos (RF-02 CA-2)                                                                |

### RF-15 · Stock de libros ✅

Verificado por: API `book.spec.ts` (stock entero ≥ 0), `book-commands.spec.ts` › "applies partial changes: with no stock the book is no longer available", `persistence.spec.ts` (filtro `stock > 0`), `book-csv.serializer.spec.ts` (columna Stock); WEB `BookForm.test.tsx` › "rejects a negative or fractional stock"; E2E `book-list.spec.ts` › "filters combine: genre + availability".

| CA  | Criterio de aceptación                                                                                                                   |
| --- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Cada libro tiene un stock en unidades (entero, mayor o igual a 0) que se define al crearlo y se puede corregir al editarlo               |
| 2   | "Disponible" deja de ser un dato manual: un libro está disponible si su stock es mayor que 0 (filtro, insignia y CSV siguen funcionando) |
| 3   | El listado, el detalle y el CSV muestran el stock                                                                                        |

### RF-18 · Fecha de nacimiento y biografía del autor ✅

Verificado por: API `author.spec.ts` (fecha real, no futura, biografía ≤ 1000), `authors.spec.ts` › "updates only what it receives and audits the previous values", `references.http.spec.ts` › "answers 400 to a malformed, impossible or future birth date"; INT `prisma-author.repository.int-spec.ts` › "stores the birth date as a calendar day (no time-zone shift) and the biography as is", `seed.int-spec.ts` › "loads birth date and biography for every demo author (birth date only when known)", `prisma-author.repository.int-spec.ts` › "pages authors on the database, sorted by name, with the total"; API `authors.spec.ts` › "returns one page of authors sorted by name with pagination metadata", `references.http.spec.ts` › "paginates on the server when page or limit are sent, and lists everything otherwise"; WEB `authors.test.tsx` ("asks the server for one page at a time…", "steps back to the last page…"); E2E `authors.spec.ts`.

| CA  | Criterio de aceptación                                                                                                                                                                                                                                                |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Un autor puede tener fecha de nacimiento y una biografía breve (hasta 1.000 caracteres); ambas son **opcionales** porque no siempre se conocen                                                                                                                        |
| 2   | La fecha debe ser real (`2024-02-30` no) y no futura; se guarda como día calendario (`DATE`), sin corrimientos por zona horaria; si no, responde 400                                                                                                                  |
| 3   | Editar es parcial: un campo no enviado conserva su valor y `null` lo borra; el cambio queda en `audit_logs` con los valores anteriores                                                                                                                                |
| 4   | La pantalla de autores es solo la tabla (fecha, extracto de la biografía y acciones); "Agregar" abre "Nuevo autor" (al guardar vuelve a la lista) y el lápiz abre "Editar autor" con los datos cargados, que al guardar se queda en la página con un mensaje de éxito |
| 5   | Editoriales y géneros no cambian: siguen teniendo solo nombre                                                                                                                                                                                                         |
| 6   | La tabla pagina **en el servidor** (RF-04): `GET /authors?page&limit` devuelve esa página con `meta` y orden estable por nombre; sin `page` ni `limit` lista todos (lo usa el selector de autor del formulario de libro); `limit` > 100 o `page` < 1 responde 400     |
| 7   | Si al eliminar queda vacía la página actual, la tabla retrocede a la última página existente                                                                                                                                                                          |

### RF-19 · País y pantalla de la editorial ✅

Verificado por: API `publisher.spec.ts` (país normalizado y ≤ 80), `publishers.spec.ts` › "creates a normalized publisher with country…", "updates only what it receives…", "returns one page of publishers…", `references.http.spec.ts` › "publishers (country on top of the shared catalog rules)"; INT `prisma-publisher.repository.int-spec.ts`, `seed.int-spec.ts` › "loads the country of every demo publisher"; WEB `publishers.test.tsx`; E2E `publishers.spec.ts`.

| CA  | Criterio de aceptación                                                                                                                                                                                          |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Una editorial puede tener un país (hasta 80 caracteres), **opcional**; editar es parcial: un campo no enviado conserva su valor y `null` borra el país; el cambio queda en `audit_logs`                         |
| 2   | La pantalla de editoriales es solo la tabla (Nombre, País, Libros activos, Acciones), con las mismas reglas de RF-18: "Agregar" abre "Nueva editorial", el lápiz abre "Editar editorial" con los datos cargados |
| 3   | La tabla pagina **en el servidor** (RF-04): `GET /publishers?page&limit`; sin `page` ni `limit` lista todas (lo usa el selector del formulario de libro); `limit` > 100 o `page` < 1 responde 400               |
| 4   | Géneros no cambian: siguen teniendo solo nombre                                                                                                                                                                 |

### RF-20 · Descripción y pantalla del género ✅

Verificado por: API `genre.spec.ts` (descripción normalizada y ≤ 500), `genres.spec.ts` › "creates a normalized genre with description…", "updates only what it receives…", "returns one page of genres…", `references.http.spec.ts` › "genres (description on top of the shared catalog rules)"; INT `prisma-genre.repository.int-spec.ts`, `seed.int-spec.ts` › "loads the description of every demo genre"; WEB `genres.test.tsx`; E2E `admin.spec.ts` › "an administrator creates, edits and deletes a genre".

| CA  | Criterio de aceptación                                                                                                                                                                                                         |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Un género puede tener una descripción de texto libre (hasta 500 caracteres), **opcional**; editar es parcial: un campo no enviado conserva su valor y `null` borra la descripción; el cambio queda en `audit_logs`             |
| 2   | La pantalla de géneros es solo la tabla (Nombre, Descripción, Libros activos, Acciones), con la misma estructura de autores y editoriales: "Agregar" abre "Nuevo género", el lápiz abre "Editar género" con los datos cargados |
| 3   | La tabla pagina **en el servidor** (RF-04): `GET /genres?page&limit`; sin `page` ni `limit` lista todos (lo usa el selector del formulario de libro); `limit` > 100 o `page` < 1 responde 400                                  |

### RF-21 · Exportar autores, editoriales y géneros a CSV ✅

Verificado por: API `catalog-csv.spec.ts`, `export-catalog-csv.use-cases.spec.ts`, `references.http.spec.ts` › "catalog CSV export"; WEB `references.test.tsx` › "ExportReferencesButton", `references.api.test.ts`; E2E `catalog-export.spec.ts`.

| CA  | Criterio de aceptación                                                                                                                                                                                                                    |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Cada pantalla (Autores, Editoriales, Géneros) tiene su botón **Exportar CSV**, junto a "Agregar"; `GET /authors/export`, `/publishers/export` y `/genres/export` descargan `autores`, `editoriales` y `generos` con la fecha en el nombre |
| 2   | Exporta **todos** los registros ordenados por nombre (no solo la página visible); columnas: ID, Nombre, el dato propio (fecha de nacimiento y biografía, país o descripción) y Libros activos                                             |
| 3   | El archivo abre bien en Excel (BOM UTF-8), cita las comas y saltos de línea, y neutraliza celdas que una planilla ejecutaría como fórmula (`=`, `+`, `-`, `@`)                                                                            |
| 4   | Solo los administradores pueden exportar (otros perfiles reciben 403) y cada exportación queda en `audit_logs` como `EXPORT`, con la cantidad de filas                                                                                    |

### RF-16 · Ventas ✅

Verificado por: API `sale-builder.spec.ts` (snapshot de precios, total en centavos, líneas repetidas, libros inactivos, cantidad ≤ stock), `sales.spec.ts`, `sales.http.spec.ts` (permisos, 201/400/404, paginación y filtro por estado); INT `prisma-sale.repository.int-spec.ts`; WEB `sales.test.tsx` (listado, filtro, nueva venta con cantidad limitada por stock), `sale-draft.test.ts`, `sales.api.test.ts`; E2E `sales.spec.ts`.

| CA  | Criterio de aceptación                                                                                                                                    |
| --- | --------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Una venta tiene una o más líneas (libro y cantidad ≥ 1); cada línea guarda el precio unitario del libro al momento de crearla, y la venta guarda el total |
| 2   | Al crearla queda en estado **Pendiente**, registra quién la creó y no descuenta stock (una venta pendiente no reserva unidades)                           |
| 3   | Solo se pueden agregar libros activos, sin repetir un libro en dos líneas, y con cantidad no mayor al stock actual; si no, responde 400                   |
| 4   | El listado de ventas tiene paginación del lado del servidor y filtro por estado, y muestra fecha, total, estado y quién la creó                           |
| 5   | El detalle muestra las líneas, el total, el estado y, según el estado, las acciones disponibles                                                           |

### RF-17 · Completar y cancelar ventas ✅

Verificado por: API `sales.spec.ts` (descuento por línea, venta final, stock insuficiente o libro eliminado), `sales.http.spec.ts` (409 al repetir la acción o sin stock); INT `prisma-sale-stock.int-spec.ts` (descuentos concurrentes sobre el último ejemplar: solo uno se aplica; con una línea sin stock la transacción revierte y no se descuenta nada), `prisma-sale.repository.int-spec.ts` (la transición solo mueve una venta pendiente); WEB `sales.test.tsx` (método de pago obligatorio, confirmación al cancelar, sin acciones en ventas finales); E2E `sales.spec.ts` (completar descuenta el stock, cancelar no lo toca, libro eliminado → 409 sin descontar).

| CA  | Criterio de aceptación                                                                                                                                            |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Solo una venta **Pendiente** muestra las acciones "Completar venta" y "Cancelar"; una venta completada o cancelada es definitiva (otra acción responde 409)       |
| 2   | Completar exige un método de pago (efectivo, tarjeta de débito, tarjeta de crédito o transferencia) y registra la fecha de cierre                                 |
| 3   | Completar descuenta el stock de cada línea en una sola transacción; si algún libro no tiene stock suficiente o fue eliminado, no se descuenta nada y responde 409 |
| 4   | El descuento es atómico en la base (`stock = stock - n` con condición `stock >= n`): dos ventas simultáneas nunca dejan stock negativo                            |
| 5   | Cancelar pide confirmación, registra la fecha y no modifica el stock                                                                                              |
| 6   | Crear, completar y cancelar quedan en `audit_logs` (acciones `CREATE`, `COMPLETE`, `CANCEL`)                                                                      |

### RB-07 · Autorización por perfil ✅

| CA  | Criterio de aceptación                                                                                                           | Estado y verificación                                                                                                                                                                                                                                        |
| --- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Las rutas de administración responden 403 `FORBIDDEN` a un usuario sin perfil de administrador                                   | ✅ API `authorization.http.spec.ts` › "answers 403 FORBIDDEN to a regular user on admin routes", "authenticates before authorizing: no token is 401, not 403"; `roles.guard.spec.ts` (4 tests)                                                               |
| 2   | El perfil se lee de la base en cada petición (RB-02 CA-4): un cambio de perfil aplica de inmediato                               | ✅ API `authorization.http.spec.ts` › "reads the role from the database, not from the token"                                                                                                                                                                 |
| 3   | El menú solo muestra las secciones permitidas y las rutas protegidas del front muestran "No tiene permisos para ver esta página" | ✅ WEB `references.test.tsx` › "shows the page to an administrator and a clear message to anyone else"; `auth.test.tsx` › "shows only the inventory to a regular user"; E2E `admin.spec.ts` › "sees only the inventory and cannot open administration pages" |

### BD-06 · Migración de perfiles y usuarios ✅

| CA  | Criterio de aceptación                                                                                            | Estado y verificación                                                                                                   |
| --- | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| 1   | El perfil `EDITOR` pasa a llamarse `USER` sin perder datos (`ALTER TYPE … RENAME VALUE`)                          | ✅ INT `migrations.int-spec.ts` › "renames the EDITOR role to USER without losing users"                                |
| 2   | `users` incorpora `deleted_at`; las búsquedas de usuarios (login y validación del token) ignoran a los eliminados | ✅ INT `prisma-user.repository.int-spec.ts` › "ignores deleted users: they cannot log in and their tokens stop working" |

### BD-07 · Migración de stock y ventas ✅

| CA  | Criterio de aceptación                                                                                                                                         | Estado y verificación                                                                                                                                                                               |
| --- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `books` incorpora `stock` (entero, `CHECK (stock >= 0)`); los libros existentes quedan con stock 1 si estaban disponibles y 0 si no; `is_available` se elimina | ✅ INT `migrations.int-spec.ts` › "backfills the stock…", "rejects a negative stock at the database level". Contracción: INT `migrations.int-spec.ts` › "drops is_available once stock replaces it" |
| 2   | Nuevas tablas `sales` y `sale_items` con estado, método de pago, total, fechas y usuario creador; `sale_items` referencia `books` y `sales`                    | ✅ INT `migrations.int-spec.ts` › "creates the sales tables and the new audit actions"                                                                                                              |
| 3   | Índices para el listado de ventas (`status`, `created_at`) y para filtrar libros disponibles (`deleted_at`, `stock`)                                           | ✅ Creados en la migración; `prisma migrate diff` sin diferencias. 🛠 El plan de ejecución se verificará cuando existan las consultas (fases 2 y 3)                                                  |
| 4   | El seed carga stock para los 23 libros de ejemplo                                                                                                              | ✅ INT `seed.int-spec.ts` › "loads stock for every book, some of them out of stock"                                                                                                                 |

## Supuestos

- La disponibilidad pasa a derivarse del stock (RF-15); durante la transición se mantienen sincronizados.
- Un libro tiene exactamente un autor, una editorial y un género.
- Los precios están en CLP con hasta 2 decimales.
- Dos perfiles: administrador (`ADMIN`) y usuario (`USER`); ver la matriz de permisos de la ampliación.
- No hay autorregistro: el enunciado pide solo login, y las cuentas las crean los administradores desde la pantalla de usuarios (RF-10). El primer administrador lo crea el seed.

## Fuera del alcance

- Reactivación de libros eliminados.
- Refresh tokens en cookies httpOnly y autorización por roles.
- Almacenamiento de imágenes en S3 y redimensionamiento.
- Pipeline de CI.

## Brechas cerradas

Criterios que se cumplían pero no tenían un test automatizado que lo garantizara. Cada test nuevo se validó
con una **mutación**: se rompió a propósito el código que protege y se confirmó que el test fallaba.

| Criterio              | Riesgo que cubre                                                     | Test                                                  | Mutación detectada                                                                                       |
| --------------------- | -------------------------------------------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| RF-01 CA-6, RNF-04    | Un cambio de configuración desactiva el rate limiting o los headers  | API `http-security.spec.ts` (Nest real + `supertest`) | Límite del login de 5 a 50: el sexto intento dio 401                                                     |
| RF-05 CA-3            | Se pierde `keepPreviousData` y la tabla parpadea al buscar o paginar | WEB `application.test.tsx`                            | Sin `keepPreviousData`: los datos quedaron `undefined`                                                   |
| RF-02 CA-2 (catálogo) | El catálogo vuelve a ofrecer valores sin libros activos              | INT `prisma-catalog.repository.int-spec.ts`           | Sin el filtro `EXISTS`: aparecieron valores huérfanos                                                    |
| BD-03                 | Una migración futura pierde o renombra un índice                     | INT `database-indexes.int-spec.ts`                    | No se mutó la migración; el primer intento sobre tabla vacía falló y llevó a medir con datos + `ANALYZE` |
| BD-05                 | El seed deja de ser idempotente y duplica datos                      | INT `seed.int-spec.ts`                                | Sin la guarda de tabla vacía: duplicó los libros                                                         |

Al cerrar RNF-04 apareció una excepción intencional que no estaba documentada: `GET /api/health` tiene
`@SkipThrottle()` porque Docker lo consulta continuamente. Quedó como criterio explícito y con test, para que
nadie la "corrija" por error.
