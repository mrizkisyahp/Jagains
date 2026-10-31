# Jagains — Platform Pelacakan & Pembuktian Tindak Lanjut Aduan Fasilitas Publik

> **Jagains** adalah **Progressive Web App (PWA)** untuk memantau dan membuktikan tindak lanjut **kerusakan fasilitas umum**. Selain itu, Jagains menerapkan **SLA publik** serta sistem **penutupan tiket berbasis verifikasi warga** melalui **GPS dan foto aktual**, atau keputusan **Auditor Independen** jika terjadi sengketa. Melalui **peta interaktif** dan **dasbor kinerja daerah**, Jagains mendorong **transparansi pelayanan publik**.

---

## 🛠️ Tech Stack

Aplikasi ini dibangun menggunakan arsitektur monolit modern dengan pemisahan *client-side rendering* reaktif dan *server-side business logic* yang solid:

| Layer | Teknologi & Tools | Keterangan |
|---|---|---|
| **Backend Framework** | **Laravel 12 (PHP 8.2+)** | Routing, Controller, Form Request Validation, Policy, Eloquent ORM, Transaction Management |
| **Frontend Framework** | **React 19 + TypeScript** | Komponen UI reaktif, Type-safe state, Hooks kustom |
| **Monolith Bridge** | **Inertia.js v2/v3** | Penghubung client-server SPA tanpa REST API overhead |
| **Database** | **PostgreSQL 17** | Relational DB, UUID/BigSerial, PostGIS/Geographic indexing, Foreign Key constraints |
| **Styling & Design System** | **Tailwind CSS v4 & shadcn/ui** | Utility-first CSS, Radix UI primitives, Dark-mode theme |
| **Maps & Geolocation** | **Leaflet & OpenStreetMap** | Visualisasi spasial peta aduan publik, geocoding hierarki wilayah, browser GPS navigator |
| **Icons & Media** | **Lucide Icons & HTML5 Camera API** | Ikonografi antarmuka dan pengambilan foto bukti langsung dari perangkat |
| **Testing Framework** | **Pest PHP** | Automated Feature & Unit Testing |
| **Build Tool** | **Vite** | Fast HMR dev server & asset bundler |

---

## 🚀 Cara Menjalankan Project (Clone ➔ Install ➔ Run)

Ikuti langkah-langkah di bawah ini untuk menjalankan Jagains di lingkungan lokal Anda:

### 1. Prasyarat Sistem
Pastikan perangkat Anda telah terpasang:
- **PHP** >= 8.2 (dengan ekstensi `pdo_pgsql`, `mbstring`, `fileinfo`, `gd`, `openssl`)
- **Composer** >= 2.x
- **Node.js** >= 18.x (LTS) & **npm** >= 9.x
- **PostgreSQL** >= 15.x
- **Git**

---

### 2. Langkah Instalasi

#### Langkah A: Clone Repository
```bash
git clone https://github.com/mrizkisyahp/Jagains.git
cd Jagains
```

#### Langkah B: Install Dependensi PHP & JavaScript
```bash
# Install backend package
composer install

# Install frontend package
npm install
```

#### Langkah C: Konfigurasi Environment (`.env`)
Salin file konfigurasi contoh dan buat file `.env`:

*Untuk Linux / macOS / Git Bash:*
```bash
cp .env.example .env
```
*Untuk Windows (Command Prompt / PowerShell):*
```bash
copy .env.example .env
```

Buka file `.env` di text editor dan sesuaikan kredensial basis data PostgreSQL Anda:
```env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_PORT=5432
DB_DATABASE=Jagains
DB_USERNAME=postgres
DB_PASSWORD=password_anda
```

#### Langkah D: Generate Application Key & Storage Link
```bash
php artisan key:generate
php artisan storage:link
```

#### Langkah E: Migrasi & Seeding Data Uji Coba
Jalankan migrasi database beserta data dummy realistis (wilayah Depok, instansi dinas, kategori aduan, aturan routing, dan siklus hidup laporan):
```bash
php artisan migrate:fresh --seed
```

---

### 3. Menjalankan Aplikasi

Jalankan server backend dan frontend di **dua terminal terpisah**:

**Terminal 1 (Laravel Server):**
```bash
php artisan serve
```

**Terminal 2 (Vite Frontend Development):**
```bash
npm run dev
```

> **Akses Aplikasi:** Buka peramban (browser) dan buka **[http://localhost:8000](http://localhost:8000)**.

---

### 4. Akun Uji Coba (Demo Credentials)

Untuk mempermudah pengujian seluruh peran pengguna, seeder telah menyiapkan akun siap pakai dengan kata sandi default: `password123`

| Peran | Username | Password | Deskripsi / Hak Akses |
|---|---|---|---|
| **Warga (Pelapor & Verifikator)** | `warga_demo_1` | `password123` | Lapor kerusakan, pelacakan tiket, & verifikasi kuorum lapangan |
| **Instansi Dinas (Pelaksana)** | `dinas_pekerjaan_umum_dan_penataan_ruang_kota_depok` | `password123` | Antrean kerja tiket, penerimaan, berita acara, & foto bukti fisik |
| **Auditor Independen** | `auditor1` | `password123` | Antrean eskalasi, peninjauan SLA overdue, & penerbitan keputusan audit |
| **Super Admin** | `admin1` | `password123` | Konfigurasi SLA, routing instansi, manajemen akun, & audit log sistem |

---

## 📊 Progress Saat Ini

Aplikasi telah selesai dibangun secara *end-to-end* (halaman antarmuka, alur logika sistem, dan basis data telah terhubung penuh):

- [x] **Landing Page & Peta Publik Interaktif:**
  - Halaman utama informatif dengan statistik penyelesaian laporan terkini.
  - Peta interaktif sebaran kerusakan fasilitas publik dengan filter status, kategori, dan detail riwayat aduan.

- [x] **Autentikasi & Akun Pengguna:**
  - Pendaftaran akun warga dengan perlindungan privasi (*hashing email*).
  - Masuk sistem multi-peran (Warga, Instansi Dinas, Auditor Independen, dan Super Admin).
  - Pengelolaan profil pengguna dan riwayat aduan warga.

- [x] **Fitur Pelaporan Kerusakan oleh Warga:**
  - Alur pelaporan terpandu 4 langkah: pengambilan foto bukti langsung lewat kamera, deteksi koordinat GPS otomatis, pemilihan kategori aduan, dan deskripsi masalah.
  - Pelacakan progres status perbaikan secara transparan oleh warga.

- [x] **Panel Penanganan Aduan untuk Instansi Dinas:**
  - Antrean kerja operasional dinas terkait untuk meninjau aduan masuk.
  - Alur penerimaan administrasi dan pembaruan pengerjaan fisik di lapangan (tahap survei, jadwal pengerjaan, hingga pelaksanaan).
  - Pengunggahan berita acara resmi dan foto bukti hasil pengerjaan fisik.

- [x] **Sistem Verifikasi Lapangan oleh Warga Sekitar (Anti Selesai Sepihak):**
  - Konfirmasi penyelesaian langsung oleh warga di sekitar lokasi kerusakan.
  - Validasi kehadiran di lokasi menggunakan radius GPS dan bukti foto kamera lapangan.
  - Tiket baru dapat dinyatakan resmi selesai setelah diverifikasi oleh warga setempat.

- [x] **Panel Pengawasan & Eskalasi Auditor Independen:**
  - Pengawasan batas waktu pengerjaan (Service Level Agreement).
  - Penanganan tiket yang terlambat (*overdue*) atau disengketakan warga.
  - Penerbitan keputusan audit resmi (perintah pengerjaan ulang atau penutupan laporan).

- [x] **Panel Pengelolaan Super Admin:**
  - Manajemen akun dinas pelaksana dan auditor pengawas.
  - Konfigurasi parameter batas waktu pengerjaan (SLA) dan aturan penugasan laporan otomatis ke instansi terkait.
  - Moderasi aduan dan pemantauan riwayat aktivitas sistem (*audit log*).

