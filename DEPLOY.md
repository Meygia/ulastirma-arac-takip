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

Vercel ortam değişkenleri (Settings → Environment Variables):

| Değişken | Örnek |
|----------|--------|
| `DATABASE_URL` | `libsql://your-db-name-org.turso.io` |
| `TURSO_AUTH_TOKEN` | Turso dashboard token |

**Önemli:** Value kutusuna tırnak koymayın. Key = isim, Value = değer.

Migration'lar Vercel build'inde değil, bilgisayarınızdan **bir kez** çalıştırılır:

```powershell
cd C:\Users\Batuh\ulastirma-arac-takip

# Geçici .env.turso dosyası oluşturun (Git'e gitmez):
# DATABASE_URL=libsql://....turso.io
# TURSO_AUTH_TOKEN=eyJ...

npm run db:deploy:turso
```

Başarılı olunca `Turso migrations complete.` yazar. Sonra Vercel'de Deploy/Redeploy yapın.

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

## 4. Kullanıcı girişi

Vercel Environment Variables:

| Değişken | Örnek |
|----------|--------|
| `AUTH_SECRET` | Uzun rastgele metin |
| `AUTH_USERS` | `admin:Sifre1,batuhan:Sifre2` |

Format: `kullanici:sifre` çiftleri virgülle ayrılır. Değişiklikten sonra Redeploy gerekir.

## 5. Kilometre senkronu (cibmutfak)

Kaynak: `https://arac.cibmutfak.com` → `vehicles.list` API'sindeki `currentKm` (Giriş KM).

Vercel Environment Variables:

| Değişken | Değer |
|----------|--------|
| `KM_SENKRON_AKTIF` | `true` |
| `KM_SENKRON_URL` | `https://arac.cibmutfak.com` |
| `KM_SENKRON_SIFRE` | Kaynak sitenin yönetici şifresi |

Senkron:
- Ana sayfa / araç açılınca (en fazla ~90 sn'de bir)
- `/api/km-senkron` günlük cron (Hobby planda daha sık cron deploy'u bozar)

Plakalar boşluksuz karşılaştırılır (`06 FRU 846` = `06FRU846`).

## 6. Araç belgeleri (Vercel Blob)

Vercel sunucusunda yerel diske yazılamaz. Belge yükleme için Blob store gerekir:

1. [Vercel Dashboard](https://vercel.com) → proje → **Storage** → **Blob** → Create
2. Store'u projeye bağlayın; `BLOB_READ_WRITE_TOKEN` otomatik eklenir
3. Redeploy

Yerelde token yoksa dosyalar `public/uploads/` altına yazılır.

## Notlar

- `.env` dosyası Git'e gitmez (güvenlik).
- Build komutu: `prisma generate && next build`
