# Base de datos (Supabase)

Proyecto: `fjiaigbdmtpfkqlatfdv`.

## Estructura

- `migrations/`: migraciones versionadas. El nombre de cada archivo coincide con la
  versión registrada en la base (`supabase_migrations.schema_migrations`).
- `legacy/`: scripts SQL antiguos que se ejecutaron a mano en el editor SQL. Se
  conservan como referencia histórica; **no** volver a ejecutarlos.

## Primer uso de la CLI (una vez)

```bash
npx supabase login
npx supabase init            # crea supabase/config.toml si no existe
npx supabase link --project-ref fjiaigbdmtpfkqlatfdv
npm run db:migrations:fetch  # descarga a migrations/ el SQL de todo el historial remoto
```

El historial remoto parte en junio de 2026. El esquema inicial (perfiles, colecciones,
banlists) se creó antes desde el editor SQL y no está en el historial. Para tener una base
reproducible completa, generar una vez una migración base con `npx supabase db pull`.

## Día a día

- Nueva migración: `npx supabase migration new <nombre>`, escribir el SQL y aplicarla con
  `npx supabase db push`.
- Después de cambiar el esquema: `npm run db:types` para regenerar `src/types/database.ts`.
