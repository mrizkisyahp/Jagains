# Nama Proyek

> Jagains: Platform pelaporan kerusakan fasilitas umum dengan transparansi dan anonimitas yang terjaga.

**Tech stack:** Laravel · React (Inertia.js) · shadcn/ui · Tailwind CSS · npm

---

## Daftar Isi

1. [Panduan Umum untuk Kontributor](#1-panduan-umum-untuk-kontributor)
2. [Setup Project Setelah Clone](#2-setup-project-setelah-clone)
3. [Penjelasan Tech Stack](#3-penjelasan-tech-stack)
4. [Menggunakan shadcn/ui](#4-menggunakan-shadcnui)
5. [Troubleshooting](#5-troubleshooting)

---

## 1. Panduan Umum untuk Kontributor

### Prasyarat

Pastikan tools berikut sudah terpasang di komputer kamu:

| Tools | Versi minimum | Cek versi |
|-------|---------------|-----------|
| PHP | 8.2+ | `php -v` |
| Composer | 2.x | `composer -V` |
| Node.js | 18+ (disarankan LTS) | `node -v` |
| npm | 9+ | `npm -v` |
| Database | MySQL / MariaDB / PostgreSQL / SQLite | - |
| Git | terbaru | `git --version` |

> Sesuaikan versi dengan kebutuhan proyek (lihat `composer.json` dan `package.json`).

### Clone Repository

```bash
git clone <URL_REPOSITORY>
cd <NAMA_FOLDER_PROJECT>
```

### Alur Kerja Git (Workflow)

1. Pastikan branch `main` / `develop` kamu up to date:
   ```bash
   git checkout main
   git pull origin main
   ```
2. Buat branch baru untuk setiap fitur atau perbaikan:
   ```bash
   git checkout -b feat/nama-fitur
   ```
3. Commit dengan pesan yang jelas, mengikuti format berikut:

   | Prefix | Kegunaan |
   |--------|----------|
   | `feat:` | Fitur baru |
   | `fix:` | Perbaikan bug |
   | `docs:` | Perubahan dokumentasi |
   | `style:` | Perubahan tampilan/format (tanpa mengubah logika) |
   | `refactor:` | Perapian kode tanpa mengubah perilaku |
   | `chore:` | Pekerjaan maintenance (dependency, config) |

   Contoh:
   ```bash
   git commit -m "feat: tambah halaman daftar pengguna"
   ```
4. Push branch dan buat **Pull Request** ke `main` / `develop`:
   ```bash
   git push origin feat/nama-fitur
   ```
5. Minta minimal 1 anggota tim untuk me-review sebelum merge.

### Aturan Penting

- **Jangan** commit file `.env` atau kredensial apa pun.
- **Jangan** commit folder `vendor/` dan `node_modules/`.
- Selalu `git pull` sebelum mulai bekerja.
- Satu branch = satu fitur / satu perbaikan.

---

## 2. Setup Project Setelah Clone

Ikuti langkah-langkah berikut **secara berurutan**.

### Langkah 1: Install dependency PHP

```bash
composer install
```

### Langkah 2: Install dependency JavaScript

```bash
npm install
```

### Langkah 3: Salin file environment

Linux / macOS / Git Bash:
```bash
cp .env.example .env
```

Windows (Command Prompt):
```cmd
copy .env.example .env
```

### Langkah 4: Generate application key

```bash
php artisan key:generate
```

### Langkah 5: Konfigurasi database

Buat database kosong, lalu buka file `.env` dan sesuaikan:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=nama_database
DB_USERNAME=root
DB_PASSWORD=
```

> Menggunakan SQLite? Ubah `DB_CONNECTION=sqlite`, hapus pengaturan DB lainnya, lalu buat file kosong `database/database.sqlite`.

### Langkah 6: Jalankan migrasi (dan seeder jika ada)

```bash
php artisan migrate
```

Jika proyek memiliki data awal:
```bash
php artisan migrate --seed
```

### Langkah 7: Buat symbolic link storage (jika memakai upload file)

```bash
php artisan storage:link
```

### Langkah 8: Jalankan aplikasi

Buka **dua terminal** terpisah:

**Terminal 1: Laravel server**
```bash
php artisan serve
```

**Terminal 2: Vite dev server (hot reload frontend)**
```bash
npm run dev
```

Aplikasi dapat diakses di **http://localhost:8000**.

> Jika `composer.json` memiliki script `dev`, kamu bisa menjalankan semuanya sekaligus dengan `composer run dev`.

### Ringkasan Cepat (Copy-Paste)

```bash
composer install
npm install
cp .env.example .env
php artisan key:generate
# atur database di file .env, lalu:
php artisan migrate --seed
php artisan serve
# terminal lain:
npm run dev
```

### Perintah yang Sering Dipakai

| Perintah | Fungsi |
|----------|--------|
| `php artisan serve` | Menjalankan server Laravel |
| `npm run dev` | Menjalankan Vite (development) |
| `npm run build` | Build aset untuk production |
| `php artisan migrate` | Menjalankan migrasi database |
| `php artisan migrate:fresh --seed` | Reset database dan isi ulang data |
| `php artisan route:list` | Melihat daftar route |
| `php artisan optimize:clear` | Membersihkan semua cache Laravel |
| `php artisan test` | Menjalankan test |

---

## 3. Penjelasan Tech Stack

| Teknologi | Peran | Dokumentasi |
|-----------|-------|-------------|
| **Laravel** | Backend: routing, database, autentikasi, business logic | [laravel.com/docs](https://laravel.com/docs) |
| **React** | Library UI untuk membangun antarmuka | [react.dev](https://react.dev) |
| **Inertia.js** | Penghubung Laravel dan React tanpa perlu membuat REST API terpisah | [inertiajs.com](https://inertiajs.com) |
| **shadcn/ui** | Kumpulan komponen UI siap pakai berbasis Radix UI + Tailwind CSS | [ui.shadcn.com](https://ui.shadcn.com) |
| **Tailwind CSS** | Utility-first CSS framework | [tailwindcss.com](https://tailwindcss.com) |
| **Vite** | Build tool dan dev server frontend | [vitejs.dev](https://vitejs.dev) |
| **npm** | Package manager untuk dependency JavaScript | [docs.npmjs.com](https://docs.npmjs.com) |

### Struktur Folder Penting

```
├── app/
│   ├── Http/Controllers/      # Controller Laravel
│   └── Models/                # Model Eloquent
├── database/
│   ├── migrations/            # Struktur tabel
│   └── seeders/               # Data awal
├── resources/
│   ├── css/app.css            # Tailwind + CSS variables tema
│   └── js/
│       ├── components/
│       │   └── ui/            # Komponen shadcn/ui (hasil generate)
│       ├── layouts/           # Layout halaman
│       ├── lib/utils.ts       # Helper (fungsi cn)
│       ├── pages/             # Halaman Inertia (React)
│       └── app.tsx            # Entry point frontend
├── routes/web.php             # Route aplikasi
├── components.json            # Konfigurasi shadcn/ui
└── .env                       # Konfigurasi environment (jangan di-commit)
```

> Struktur bisa sedikit berbeda tergantung starter kit yang dipakai. Sesuaikan jika perlu.

### Cara Kerja Inertia Singkat

Controller Laravel me-return halaman React, bukan view Blade:

```php
// routes/web.php
use Inertia\Inertia;

Route::get('/users', function () {
    return Inertia::render('users/index', [
        'users' => User::all(),
    ]);
});
```

```tsx
// resources/js/pages/users/index.tsx
export default function Index({ users }) {
    return (
        <ul>
            {users.map((user) => (
                <li key={user.id}>{user.name}</li>
            ))}
        </ul>
    );
}
```

Data dari controller otomatis menjadi **props** di komponen React.

---

## 4. Menggunakan shadcn/ui

shadcn/ui **bukan library yang di-install sebagai dependency**. Kode komponen disalin langsung ke dalam proyek kita (folder `resources/js/components/ui`), sehingga kita bebas mengubahnya sesuai kebutuhan.

### 4.1 Menambahkan Komponen Baru

Gunakan CLI shadcn. Contoh menambahkan komponen `button`:

```bash
npx shadcn@latest add button
```

Menambahkan beberapa komponen sekaligus:

```bash
npx shadcn@latest add button input label card dialog
```

Melihat semua komponen yang tersedia:

```bash
npx shadcn@latest add
```

Komponen akan muncul di `resources/js/components/ui/`. Jika ada dependency tambahan (misalnya Radix UI), CLI akan meng-install-nya otomatis lewat npm.

> **Penting:** Setelah menambah komponen, commit file hasil generate beserta perubahan `package.json` dan `package-lock.json`.

### 4.2 Memakai Komponen di Halaman

Contoh memakai `Button`, `Input`, dan `Card`:

```tsx
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';

export default function Example() {
    return (
        <Card className="w-full max-w-md">
            <CardHeader>
                <CardTitle>Judul Card</CardTitle>
                <CardDescription>Deskripsi singkat.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Input placeholder="Nama lengkap" />
                <Button>Simpan</Button>
            </CardContent>
        </Card>
    );
}
```

### 4.3 Variant dan Size

Banyak komponen punya `variant` dan `size`:

```tsx
<Button>Default</Button>
<Button variant="secondary">Secondary</Button>
<Button variant="destructive">Hapus</Button>
<Button variant="outline">Outline</Button>
<Button variant="ghost">Ghost</Button>
<Button variant="link">Link</Button>
<Button size="sm">Kecil</Button>
<Button size="lg">Besar</Button>
```

### 4.4 Kustomisasi Komponen

Ada tiga cara, dari yang paling ringan:

**1. Lewat `className` (paling sering dipakai)**

```tsx
<Button className="w-full rounded-full">Login</Button>
```

**2. Mengubah file komponen langsung**

Karena kodenya ada di proyek kita, buka `resources/js/components/ui/button.tsx` lalu ubah style atau tambah variant:

```tsx
const buttonVariants = cva('...', {
    variants: {
        variant: {
            // ...variant bawaan
            success: 'bg-green-600 text-white hover:bg-green-700',
        },
    },
});
```

**3. Mengubah tema global lewat CSS variables**

Warna tema ada di `resources/css/app.css`:

```css
:root {
    --background: ...;
    --foreground: ...;
    --primary: ...;
    --primary-foreground: ...;
    --radius: 0.5rem;
}

.dark {
    --background: ...;
    --foreground: ...;
}
```

Ubah nilai di sini agar seluruh komponen ikut berubah. Kamu bisa membuat tema sendiri lewat [ui.shadcn.com/themes](https://ui.shadcn.com/themes).

### 4.5 Helper `cn()`

Fungsi `cn()` (di `resources/js/lib/utils.ts`) menggabungkan class Tailwind dan menyelesaikan konflik class. Pakai ini saat membuat komponen dengan class kondisional:

```tsx
import { cn } from '@/lib/utils';

<div className={cn('p-4 rounded-md', isActive && 'bg-primary text-primary-foreground')} />
```

### 4.6 Contoh Form dengan Inertia + shadcn

```tsx
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function CreateUser() {
    const { data, setData, post, processing, errors } = useForm({
        name: '',
        email: '',
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/users');
    };

    return (
        <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="name">Nama</Label>
                <Input
                    id="name"
                    value={data.name}
                    onChange={(e) => setData('name', e.target.value)}
                />
                {errors.name && (
                    <p className="text-sm text-destructive">{errors.name}</p>
                )}
            </div>

            <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    type="email"
                    value={data.email}
                    onChange={(e) => setData('email', e.target.value)}
                />
                {errors.email && (
                    <p className="text-sm text-destructive">{errors.email}</p>
                )}
            </div>

            <Button type="submit" disabled={processing}>
                Simpan
            </Button>
        </form>
    );
}
```

### 4.7 Dark Mode

Komponen shadcn mendukung dark mode lewat class `.dark` pada elemen `<html>`. Gunakan variabel warna (`bg-background`, `text-foreground`, `text-muted-foreground`, dll.) dan **hindari warna hardcode** (misalnya `bg-white`) agar tema tetap konsisten.

### 4.8 Aturan Pakai shadcn di Proyek Ini

- Cek dulu folder `components/ui/`. Jika komponen sudah ada, **pakai yang ada**, jangan tambah ulang.
- Tambah komponen hanya lewat CLI (`npx shadcn@latest add ...`), bukan salin manual dari internet.
- Gunakan warna dari token tema (`primary`, `muted`, `destructive`, dll.).
- Untuk komponen gabungan yang dipakai berulang (misalnya `UserCard`), buat di `resources/js/components/`, **bukan** di folder `ui/`. Folder `ui/` khusus komponen bawaan shadcn.
- Jika mengubah komponen di `ui/`, kabari tim lewat deskripsi Pull Request.

### 4.9 Referensi

- Daftar komponen: [ui.shadcn.com/docs/components](https://ui.shadcn.com/docs/components)
- Instalasi: [ui.shadcn.com/docs/installation](https://ui.shadcn.com/docs/installation)
- Dokumentasi Inertia: [inertiajs.com](https://inertiajs.com)

---

## 5. Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `No application encryption key has been specified` | Jalankan `php artisan key:generate` |
| Halaman blank / error `Vite manifest not found` | Jalankan `npm run dev` (development) atau `npm run build` |
| Perubahan `.env` tidak terbaca | Jalankan `php artisan config:clear` |
| Error koneksi database | Cek kredensial di `.env` dan pastikan service database aktif |
| Class not found setelah `git pull` | Jalankan `composer install` lalu `composer dump-autoload` |
| Komponen shadcn tidak ditemukan | Pastikan alias `@` di `tsconfig.json` dan `vite.config.ts` sudah benar, lalu cek `components.json` |
| Style Tailwind tidak muncul | Pastikan `npm run dev` berjalan dan file sudah masuk ke konfigurasi `content` Tailwind |
| Setelah pull ada dependency baru | Jalankan `composer install` dan `npm install` |

Masih bermasalah? Hubungi tim lewat grup diskusi atau buat **Issue** di repository.

---

## Tim

| Nama | Peran |
|------|-------|
| - | Project Manager |
| - | Developer |

---

*Terakhir diperbarui: Oktober 2026*
