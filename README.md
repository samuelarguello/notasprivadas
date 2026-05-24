# CUNEF - Notas privadas

Aplicacion Next.js + Supabase para enviar notas cifradas, temporales y de un solo uso.

## Seguridad

- La nota se cifra en el navegador con AES-GCM.
- La clave de descifrado viaja en el fragmento del enlace, despues de `#`.
- El fragmento `#...` no se envia al servidor.
- Supabase guarda solo texto cifrado, `iv` y `salt`.
- Al abrir una nota, la API la borra de Supabase.

## 1. Crear proyecto en Supabase

1. Entra en https://supabase.com
2. Crea un proyecto nuevo.
3. Ve a SQL Editor.
4. Ejecuta el contenido de `supabase/schema.sql`.
5. Ve a Project Settings > API.
6. Copia:
   - Project URL
   - service_role key

## 2. Configurar variables

Crea `.env.local` en local:

```bash
SUPABASE_URL=https://TU-PROYECTO.supabase.co
SUPABASE_SERVICE_ROLE_KEY=TU_SERVICE_ROLE_KEY
NEXT_PUBLIC_APP_URL=http://localhost:3000
NOTE_TTL_HOURS=72
```

No subas `.env.local` a GitHub.

## 3. Probar en local

```bash
npm install
npm run dev
```

Abre http://localhost:3000

## 4. Subir a GitHub

```bash
git init
git add .
git commit -m "Primera version notas privadas"
git branch -M main
git remote add origin URL_DE_TU_REPOSITORIO
git push -u origin main
```

## 5. Desplegar en Vercel

1. Entra en https://vercel.com
2. Importa el repositorio de GitHub.
3. En Environment Variables anade:
   - SUPABASE_URL
   - SUPABASE_SERVICE_ROLE_KEY
   - NEXT_PUBLIC_APP_URL=https://notasprivadas.cunef.edu
   - NOTE_TTL_HOURS=72
4. Deploy.

## 6. Dominio personalizado

En Vercel > Project > Settings > Domains, anade:

```text
notasprivadas.cunef.edu
```

En el DNS de CUNEF crea/modifica:

```text
Tipo: CNAME
Nombre/Host: notasprivadas
Valor/Destino: cname.vercel-dns.com
```

Cuando Vercel lo verifique, emitira SSL automaticamente.
