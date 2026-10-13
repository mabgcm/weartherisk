# Printstore

Next.js App Router, TypeScript, Tailwind CSS ve Firebase tabanlı POD mağaza başlangıcı.

## Kurulum

```bash
npm install
cp .env.local.example .env.local
npm run dev
```

Firebase Console'da bir Web App oluşturup `.env.local` alanlarını doldurun. Firestore kurallarını yayımlamak için Firebase CLI ile giriş yaptıktan sonra `firebase deploy --only firestore` çalıştırın.

## Veri modeli

Firestore koleksiyonları `products`, `productVariants`, `providers`, `orders` ve `users` olarak tanımlıdır. TypeScript modelleri `src/lib/firebase/models.ts`, istemci kurulumu `src/lib/firebase/client.ts` dosyasındadır.
