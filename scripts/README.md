# Card tooling

Scripts para mantener `public/assets/json/cartas_<format>.json` y migrar las
imagenes a BunnyCDN. Node >= 20.19 (usa `fetch` nativo, sin dependencias).

Todos los comandos se corren desde `myl_app_web_react/`.

## 0. Setup BunnyCDN (una vez)

1. Crea una cuenta en BunnyCDN.
2. Crea un **Storage Zone** (ej. `myl-cards`).
3. Crea un **Pull Zone** conectado a ese Storage Zone. Su hostname publico es
   algo como `myl-cards.b-cdn.net`.
4. Copia `scripts/.env.example` a `scripts/.env` y completa:
   - `BUNNY_STORAGE_ZONE`, `BUNNY_STORAGE_KEY` (password del storage zone),
     `BUNNY_STORAGE_HOST` (region), `BUNNY_PULLZONE_HOST`.

`scripts/.env`, `scripts/data/` y `scripts/images/` estan en `.gitignore`.

## 1. Merge del catalogo (agrega nuevas + refresca existentes)

```bash
node scripts/merge-cards.mjs pb --dry   # genera cartas_pb.preview.json para revisar
node scripts/merge-cards.mjs pb         # sobrescribe cartas_pb.json
```

Por defecto lee el API desde `C:/Users/veanv/Desktop/api.mazos.cl_cartas_pb.json`.
Para otra ruta: `node scripts/merge-cards.mjs pb API_JSON="ruta/al/api.json"`.

Que hace:
- Matchea por `id`.
- Existentes: solo sincroniza `cardCategory` desde el API (null cuando no tiene).
- Preserva todo lo demas local (incl. `imageUrl` en Bunny, `product`, `interactions`,
  `moreThan3`, `isNewest`, `isRework`, `isReworked`, `unique`, edition/game curados).
- Nuevas: se construyen con el esquema local + `cardCategory`, anteponidas por id desc.

## 2. Migrar imagenes a BunnyCDN

```bash
node scripts/download-images.mjs pb      # baja imagenes a scripts/images/ + manifest
node scripts/upload-bunny.mjs pb         # sube a Bunny + genera image-map-pb.json
node scripts/rewrite-image-urls.mjs pb   # reemplaza imageUrl en cartas_pb.json
```

- `download-images.mjs` y `upload-bunny.mjs` reanudan automaticamente: si vuelves
  a correrlos, saltan lo ya hecho y reintentan lo fallido (`--force` para rehacer).
- `--concurrency=N` ajusta el paralelismo (default 8).
- `rewrite-image-urls.mjs --dry` escribe `cartas_pb.preview.json`.

## 3. Verificar

```bash
node scripts/verify-cards.mjs pb
npm run dev   # revisar Collection / DeckBuilder cargando desde Bunny
```

Verifica: `total` == cantidad de cartas, sin ids duplicados, sin URLs
`cdn.mazos.cl` restantes, todas con `type`.
