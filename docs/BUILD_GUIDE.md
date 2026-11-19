# Guía de construcción: cómo está construida la aplicación (y cómo extenderla)

Este es el manual para agregar código al proyecto sin erosionar la arquitectura.
Lea primero [ARCHITECTURE.md](./ARCHITECTURE.md) para tener la visión general.

---

## 1. Reglas no negociables

| Regla                                                                                   | Controlada por                                 |
| --------------------------------------------------------------------------------------- | ---------------------------------------------- |
| **Ningún archivo fuente supera 60 líneas** (sin contar líneas en blanco ni comentarios) | ESLint `max-lines` en ambas aplicaciones       |
| Funciones ≤ 30 líneas (API) / ≤ 45 líneas (componentes web)                             | ESLint `max-lines-per-function`                |
| Complejidad ciclomática ≤ 8 (API) / ≤ 10 (web)                                          | ESLint `complexity`                            |
| Sin `console.*` en el código fuente                                                     | ESLint `no-console` (usar el `Logger` de Nest) |
| Cobertura ≥ 80% (líneas, ramas, funciones, sentencias)                                  | Umbrales de Jest / Vitest                      |
| Conventional commits                                                                    | commitlint (hook `commit-msg`)                 |
| Lint + typecheck antes de cada commit, tests antes de cada push                         | Husky + lint-staged                            |

Cuando un archivo llega a 60 líneas, **es una señal de diseño, no un problema de formato**: está
haciendo más de una cosa. Divídalo por responsabilidad (ver §4); nunca comprima código en menos líneas.

## 2. Backend: anatomía de un bounded context

```
modules/<contexto>/
├── domain/
│   ├── <agregado>.ts             clase inmutable, factory `create`, `restore`, los comportamientos devuelven nuevas instancias
│   ├── <value-object>.ts         se valida al construirse, se compara por valor
│   ├── <agregado>-data.ts        tipo de entrada + normalización (todas las invariantes)
│   ├── <agregado>.errors.ts      subclases de NotFoundError / ValidationError / ...
│   ├── <agregado>-criteria.ts    objeto de consulta (filtros, orden) — sin SQL
│   └── <agregado>.repository.ts  abstract class = puerto + token de DI
├── application/
│   ├── <verbo>-<agregado>.use-case.ts   UN método público: execute(command)
│   ├── <agregado>-view.ts               DTO de salida (solo primitivos)
│   └── ports/<capacidad>.port.ts        abstract class para cualquier capacidad externa
├── infrastructure/
│   ├── persistence/prisma-<agregado>.repository.ts
│   ├── persistence/<agregado>.mapper.ts       registro ⇄ agregado
│   └── <adaptador>/<tecnologia>-<capacidad>.ts
├── presentation/
│   ├── <agregado>s-query.controller.ts        endpoints GET
│   ├── <agregado>s-command.controller.ts      endpoints POST/PATCH/DELETE
│   └── dto/*.dto.ts                           class-validator + decoradores de Swagger
└── <contexto>.module.ts                       el ÚNICO lugar donde se enlazan puertos con adaptadores
```

### Paso a paso: agregar un caso de uso (ejemplo: "marcar libro como no disponible")

1. **Primero el dominio**: agregar el comportamiento al agregado.
   ```ts
   markUnavailable(now = new Date()): Book {
     this.assertActive();
     return new Book({ ...this.props, stock: 0, updatedAt: now });
   }
   ```
   Testearlo en `book.spec.ts` (puro, sin mocks).
2. **Caso de uso**: `mark-book-unavailable.use-case.ts` — inyectar puertos, envolver las escrituras en
   `transactions.run`, registrar la auditoría y devolver un `BookView`.
3. **Testear el caso de uso** con `InMemoryBookRepository`, `FakeTransactionManager` y `FakeAuditLogger`
   de `src/test-utils`. Sin módulo de testing de Nest ni base de datos.
4. **Exponerlo**: agregar el endpoint a `BooksCommandController` (escritura), o a un controlador nuevo si
   ese está cerca del límite de 60 líneas. Validar la entrada con un DTO.
5. **Registrar** el caso de uso en los `providers` de `books.module.ts`.
6. Ejecutar `npm run lint && npm test -w apps/api`.

### Paso a paso: agregar un nuevo bounded context

1. Crear la estructura de carpetas anterior.
2. Definir los puertos como `abstract class` en `domain/` (repositorios) o en `application/ports/` (otras capacidades).
3. Escribir los casos de uso y sus tests contra fakes **antes** de escribir cualquier adaptador.
4. Implementar los adaptadores en `infrastructure/`.
5. Enlazar los puertos en `<contexto>.module.ts`: `{ provide: Puerto, useClass: Adaptador }`.
6. Importar el módulo en `app.module.ts`.
7. Si requiere tablas nuevas: editar `schema.prisma` → `npm run prisma:migrate -w apps/api -- --name <cambio>` → revisar el SQL.

## 3. Catálogo de interfaces (puertos)

Los puertos son `abstract class`: funcionan como interfaces de TypeScript **y** como tokens de DI en tiempo de ejecución
(las interfaces de TypeScript desaparecen al compilar, por lo que Nest no podría inyectarlas).

| Puerto                                                         | Firma                                                                                                       | Adaptador(es)                                                                            |
| -------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `BookRepository`                                               | `findById(id)`, `findPage(criteria)`, `streamAll(query)`, `save(book)`                                      | `PrismaBookRepository`, `InMemoryBookRepository` (tests)                                 |
| `CatalogRepository`                                            | `load(): Promise<Catalog>`                                                                                  | `PrismaCatalogRepository`                                                                |
| `UserRepository`                                               | `findByEmail(email)`, `findById(id)` (login y validación del token)                                         | `PrismaUserRepository`                                                                   |
| `ManagedUserRepository`                                        | `listPage`, `findById`, `findByEmail`, `create`, `update`, `deactivate`, `countActiveAdmins`                | `PrismaManagedUserRepository`, `InMemoryManagedUserRepository`                           |
| `AuthorRepository` · `PublisherRepository` · `GenreRepository` | `list`, `listPage`, `findById`, `create`, `update` (con sus datos propios)                                  | `Prisma*Repository`, `InMemory*Repository`                                               |
| `ReferenceRepository`                                          | `findById`, `findByName`, `countBooks`, `delete` (reglas comunes de los tres catálogos)                     | `PrismaReferenceRepository`, `InMemoryReferenceRepository`                               |
| `SaleRepository`                                               | `listPage`, `findById`, `create`, `markCompleted`, `markCancelled` (transiciones condicionadas a `PENDING`) | `PrismaSaleRepository`, `InMemorySaleRepository`                                         |
| `SaleStock`                                                    | `findSellable(ids)`, `decrement(bookId, qty)` atómico (`stock >= qty`)                                      | `PrismaSaleStock`, `InMemorySaleStock`                                                   |
| `DashboardRepository`                                          | `bookStats`, `booksByGenre`, `salesStats`, `inventoryValue`, `catalogStats`, `recentActivity`               | `PrismaDashboardRepository`, `FakeDashboardRepository`                                   |
| `ImageStorage`                                                 | `save(image): Promise<url>`, `remove(url)`                                                                  | `LocalImageStorage`, `FakeImageStorage` (tests) — un adaptador S3 es el camino a la nube |
| `TransactionManager`                                           | `run<T>(work): Promise<T>`                                                                                  | `PrismaTransactionManager` (ALS), `FakeTransactionManager`                               |
| `AuditLogger`                                                  | `record(entry)`                                                                                             | `PrismaAuditLogger`, `FakeAuditLogger`                                                   |
| `PasswordHasher`                                               | `hash(plain)`, `verify(plain, hash \| undefined)`                                                           | `BcryptPasswordHasher` (tiempo constante incluso para usuarios inexistentes)             |
| `TokenIssuer`                                                  | `issue(user): Promise<string>`                                                                              | `JwtTokenIssuer`                                                                         |
| `BooksGateway` (frontend)                                      | `list`, `get`, `create`, `update`, `remove`, `uploadImage`, `exportCsv`, `catalog`                          | `booksApi` (axios), `vi.mock` en los tests                                               |

## 4. Segregación de clases (SOLID aplicado)

| Principio                         | Cómo se aplica aquí                                                                                                                                      | Antipatrón que evitamos                                  |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------- |
| **S** — Responsabilidad única     | Un caso de uso por clase; controladores separados en Query / Command / Image; mapper y query builder separados del repositorio                           | Un `BooksService` con 12 métodos                         |
| **O** — Abierto/cerrado           | Un nuevo campo de orden = una entrada en `SORT_COLUMNS`; un nuevo almacenamiento = una nueva clase adaptador                                             | `switch` que crecen con cada feature                     |
| **L** — Sustitución de Liskov     | Cada adaptador es intercambiable con su fake (los tests lo demuestran)                                                                                   | Adaptadores que lanzan "not implemented"                 |
| **I** — Segregación de interfaces | `UserRepository` (login) solo expone `findByEmail` y `findById`, separado de `ManagedUserRepository` (administración); `ImageStorage` solo `save/remove` | Un `Repository<T>` genérico con 10 métodos que nadie usa |
| **D** — Inversión de dependencias | Los casos de uso dependen de puertos abstractos; solo los `*.module.ts` conocen las clases concretas                                                     | `new PrismaClient()` dentro de la lógica de negocio      |

### Cómo dividir un archivo que superó las 60 líneas

| Síntoma                                                | Dividir en                                                                             |
| ------------------------------------------------------ | -------------------------------------------------------------------------------------- |
| Controlador con muchos endpoints                       | Controlador de consultas + controlador de comandos (+ uno por sub-recurso, ej. imagen) |
| Caso de uso con ramas para crear/actualizar            | Dos casos de uso que comparten un helper pequeño (`requireBook`)                       |
| Repositorio con lógica de construcción de consultas    | `*-query.builder.ts` (puro, con tests unitarios) + repositorio                         |
| Repositorio con lógica de mapeo                        | `*.mapper.ts` (puro, con tests unitarios)                                              |
| Componente con formulario + campos + subida de archivo | `BookForm` (estado) + `BookFormFields` (inputs) + `ImagePicker`                        |
| Página con carga de datos + layout                     | Página (hooks + composición) + componentes presentacionales                            |
| Hook con estado del servidor + estado de UI            | Hook de React Query (servidor) + `use<Feature>State` (UI)                              |

## 5. Reglas del frontend

1. **Carpeta = capa**: `domain` (TS puro) → `infrastructure` (HTTP) → `application` (hooks) → `ui` (componentes).
   Un componente importa hooks, nunca `booksApi` ni axios.
2. Las **páginas** son puntos de entrada de rutas: leen parámetros, llaman hooks y componen componentes.
   Las páginas de alta/edición/detalle se cargan de forma diferida (export default).
3. Los **componentes** reciben datos y callbacks por props. Solo los containers (`AuthenticatedLayout`,
   páginas) conocen la autenticación, el routing o React Query.
4. **Formularios**: react-hook-form + esquema zod en `domain/` (`mode: 'onChange'` → validación reactiva).
   El esquema replica las invariantes del backend; el backend sigue siendo la fuente de verdad.
5. **Errores**: nunca capturar y silenciar. Los errores de la API se convierten en `ApiError` en el interceptor
   de axios y se muestran con `ErrorBanner`.
6. **Accesibilidad**: cada input tiene label (`TextField`, `SelectField`), los errores usan `role="alert"`
   y `aria-describedby`, y los encabezados ordenables exponen `aria-sort`.

## 6. Estrategia de testing

| Nivel        | Herramientas             | Qué se testea                                                                                 | Ejemplo                          |
| ------------ | ------------------------ | --------------------------------------------------------------------------------------------- | -------------------------------- |
| Dominio      | Jest / Vitest, sin mocks | Invariantes, inmutabilidad, funciones puras                                                   | `book.spec.ts`, `domain.test.ts` |
| Casos de uso | Jest + fakes en memoria  | Orquestación, transacciones, auditoría, compensación                                          | `book-commands.spec.ts`          |
| Adaptadores  | Jest                     | Mappers, query builders, almacenamiento de archivos (directorio temporal)                     | `persistence.spec.ts`            |
| Borde HTTP   | Jest                     | Los controladores delegan, los pipes validan, filtro/interceptores dan forma a las respuestas | `controllers.spec.ts`            |
| UI           | Vitest + Testing Library | Comportamiento desde el punto de vista del usuario (roles, labels)                            | `pages.test.tsx`                 |
| HTTP real    | Jest + `supertest`       | `AppModule` completo en proceso: rate limiting, headers de seguridad                          | `http-security.spec.ts`          |
| Integración  | Jest + Testcontainers    | Repositorios Prisma, índices y seed contra PostgreSQL 16 con las migraciones reales           | `*.int-spec.ts`                  |
| E2E          | Playwright               | Flujos completos de usuario contra el stack de Docker                                         | `apps/e2e/tests/*.spec.ts`       |

Preferir **fakes** (`InMemoryBookRepository`) por sobre mocks para los puertos: testean comportamiento, no llamadas.
Usar mocks solo en el borde (cliente HTTP, `booksApi` en los tests de UI).

Reglas para los tests de integración:

- Van junto al código, con el sufijo `.int-spec.ts`: la suite unitaria no los toma (`npm test` sigue sin
  necesitar Docker) y se ejecutan con `npm run test:int`.
- Cada spec levanta su propio contenedor con `startTestDatabase()` (`src/test-utils/postgres-container.ts`).
- Un test de plan de ejecución necesita datos y `ANALYZE`: sobre una tabla vacía el planificador elige
  índices al azar.
- Un test nuevo se valida rompiendo a propósito el código que protege: si no falla, no protege nada.

Cada criterio de aceptación y su test están en [SPEC.md](SPEC.md).

## 7. Flujo de trabajo diario

```bash
npm install                      # instala también los hooks de Husky (script prepare)
docker compose up -d db          # solo la base de datos
npm run prisma:deploy -w apps/api && npm run prisma:seed -w apps/api
npm run start:dev -w apps/api    # http://localhost:3000/api/docs
npm run dev -w apps/web          # http://localhost:5173 (redirige /api)
```

En cada `git commit`:

1. `lint-staged` ejecuta ESLint `--fix` + Prettier solo sobre los archivos en stage.
2. `npm run typecheck` en ambas aplicaciones.
3. `commitlint` valida el mensaje (`feat: ...`, `fix: ...`, `refactor: ...`).

En cada `git push`: se ejecuta la suite completa de tests.
