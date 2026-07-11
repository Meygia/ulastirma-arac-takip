# Deploy (GitHub + Vercel)

## 1. GitHub'a push

Terminalde proje klasöründe:

```powershell
cd C:\Users\Batuh\ulastirma-arac-takip

# İlk kez ise (sadece bir kez)
git config --global user.name "Adınız Soyadınız"
git config --global user.email "github-email@example.com"

# GitHub giriş
gh auth login

# Repo oluştur ve push (private)
gh repo create ulastirma-arac-takip --private --source=. --remote=origin --push
```

Public repo isterseniz `--private` yerine `--public` kullanın.

## 2. Turso veritabanı (Vercel için zorunlu)

Yerel `dev.db` Vercel'de çalışmaz. Ücretsiz Turso kullanın:

1. https://turso.tech adresinde hesap açın
2. Yeni database oluşturun
3. Token alın

Vercel ortam değişkenleri:

| Değişken | Örnek |
|----------|--------|
| `DATABASE_URL` | `libsql://your-db-name-org.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso dashboard token |

Yerel veriyi taşımak için (isteğe bağlı):

```powershell
# Turso CLI kuruluysa
turso db shell your-db-name < schema.sql
```

Prisma migration'lar build sırasında otomatik uygulanır (`npm run build`).

## 3. Vercel deploy

```powershell
npm install -g vercel
vercel login
vercel link
vercel env add DATABASE_URL
vercel env add TURSO_AUTH_TOKEN
vercel --prod
```

Alternatif: [vercel.com/new](https://vercel.com/new) → GitHub reposunu bağla → Environment Variables ekle → Deploy.

## Notlar

- `.env` dosyası Git'e gitmez (güvenlik).
- Yüklenen belgeler (`public/uploads/`) Vercel'de kalıcı değildir; ileride Vercel Blob veya S3 gerekir.
- Build komutu: `prisma generate && prisma migrate deploy && next build`
