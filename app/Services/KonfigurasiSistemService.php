<?php

namespace App\Services;

use App\Models\AturanRouting;
use App\Models\AturanSla;
use App\Models\Instansi;
use App\Models\Kategori;
use App\Models\ParameterKuorum;
use App\Models\Pengaturan;
use App\Models\User;
use App\Models\Wilayah;
use Illuminate\Support\Facades\DB;

class KonfigurasiSistemService
{
    /**
     * Mengambil seluruh data konfigurasi sistem untuk panel admin (FR-ADM-01 s/d FR-ADM-03).
     */
    public function ambilSemuaKonfigurasi(): array
    {
        $pengaturan = Pengaturan::with('pengubah:id,username')
            ->orderBy('key', 'asc')
            ->get();

        $masterInstansi = Instansi::with('wilayah:id,nama')
            ->orderBy('nama', 'asc')
            ->get();

        $masterKategori = Kategori::orderBy('nama', 'asc')->get();

        $masterWilayah = Wilayah::with('induk:id,nama')
            ->orderBy('tingkat', 'asc')
            ->orderBy('nama', 'asc')
            ->get();

        $aturanRouting = AturanRouting::with([
            'kategori:id,nama',
            'wilayah:id,nama,tingkat',
            'instansi:id,nama,singkatan',
        ])
            ->orderBy('prioritas', 'asc')
            ->get();

        $aturanSla = AturanSla::with('kategori:id,nama')
            ->orderBy('id', 'asc')
            ->get();

        $parameterKuorum = ParameterKuorum::with('wilayah:id,nama,tingkat')
            ->orderBy('id', 'asc')
            ->get();

        return [
            'pengaturan' => $pengaturan,
            'masterInstansi' => $masterInstansi,
            'masterKategori' => $masterKategori,
            'masterWilayah' => $masterWilayah,
            'aturanRouting' => $aturanRouting,
            'aturanSla' => $aturanSla,
            'parameterKuorum' => $parameterKuorum,
        ];
    }

    /**
     * Memperbarui parameter sistem key-value dengan pelacakan versi (FR-ADM-03).
     */
    public function updateParameter(User $admin, string $key, string $nilai, ?string $alasan = null): Pengaturan
    {
        return DB::transaction(function () use ($admin, $key, $nilai, $alasan) {
            $pengaturan = Pengaturan::where('key', $key)->firstOrFail();
            $nilaiLama = $pengaturan->nilai;
            $versiBaru = $pengaturan->versi + 1;

            $pengaturan->update([
                'nilai' => $nilai,
                'versi' => $versiBaru,
                'diubah_oleh' => $admin->id,
                'waktu' => now(),
            ]);

            AuditLogService::catat(
                aksi: 'UBAH_PENGATURAN_SISTEM',
                objekTipe: 'pengaturan',
                objekId: null,
                nilaiLama: ['key' => $key, 'nilai' => $nilaiLama, 'versi' => $pengaturan->versi - 1],
                nilaiBaru: ['key' => $key, 'nilai' => $nilai, 'versi' => $versiBaru],
                alasan: $alasan ?? "Pembaruan parameter {$key} menjadi {$nilai}",
                pelakuId: $admin->id
            );

            return $pengaturan->fresh('pengubah');
        });
    }

    /**
     * Menyimpan atau memperbarui data master instansi (FR-ADM-01).
     */
    public function simpanInstansi(User $admin, array $data, ?int $id = null): Instansi
    {
        return DB::transaction(function () use ($admin, $data, $id) {
            $instansi = $id ? Instansi::findOrFail($id) : new Instansi;
            $nilaiLama = $id ? $instansi->toArray() : null;

            $instansi->fill($data);
            $instansi->save();

            AuditLogService::catat(
                aksi: $id ? 'UBAH_MASTER_INSTANSI' : 'TAMBAH_MASTER_INSTANSI',
                objekTipe: 'instansi',
                objekId: $instansi->id,
                nilaiLama: $nilaiLama,
                nilaiBaru: $instansi->toArray(),
                alasan: $id ? "Pembaruan instansi {$instansi->singkatan}" : "Penambahan instansi {$instansi->singkatan}",
                pelakuId: $admin->id
            );

            return $instansi->fresh('wilayah');
        });
    }

    /**
     * Menyimpan atau memperbarui data master kategori kerusakan (FR-ADM-01).
     */
    public function simpanKategori(User $admin, array $data, ?int $id = null): Kategori
    {
        return DB::transaction(function () use ($admin, $data, $id) {
            $kategori = $id ? Kategori::findOrFail($id) : new Kategori;
            $nilaiLama = $id ? $kategori->toArray() : null;

            $kategori->fill($data);
            $kategori->save();

            AuditLogService::catat(
                aksi: $id ? 'UBAH_MASTER_KATEGORI' : 'TAMBAH_MASTER_KATEGORI',
                objekTipe: 'kategori',
                objekId: $kategori->id,
                nilaiLama: $nilaiLama,
                nilaiBaru: $kategori->toArray(),
                alasan: $id ? "Pembaruan kategori {$kategori->nama}" : "Penambahan kategori {$kategori->nama}",
                pelakuId: $admin->id
            );

            return $kategori;
        });
    }

    /**
     * Menyimpan atau memperbarui data master wilayah administratif (FR-ADM-01).
     */
    public function simpanWilayah(User $admin, array $data, ?int $id = null): Wilayah
    {
        return DB::transaction(function () use ($admin, $data, $id) {
            $wilayah = $id ? Wilayah::findOrFail($id) : new Wilayah;
            $nilaiLama = $id ? $wilayah->toArray() : null;

            if (($data['tingkat'] ?? '') === 'kota') {
                $data['induk_id'] = null;
            }

            $wilayah->fill($data);
            $wilayah->save();

            AuditLogService::catat(
                aksi: $id ? 'UBAH_MASTER_WILAYAH' : 'TAMBAH_MASTER_WILAYAH',
                objekTipe: 'wilayah',
                objekId: $wilayah->id,
                nilaiLama: $nilaiLama,
                nilaiBaru: $wilayah->toArray(),
                alasan: $id ? "Pembaruan wilayah {$wilayah->nama}" : "Penambahan wilayah {$wilayah->nama}",
                pelakuId: $admin->id
            );

            return $wilayah->fresh('induk');
        });
    }

    /**
     * Menyimpan aturan routing disposisi otomatis (FR-ADM-02).
     * Jika terdapat aturan dengan kombinasi kategori, wilayah, dan instansi yang sama persis,
     * sistem secara otomatis melakukan fallback update pada aturan tersebut untuk mencegah bentrok/duplikasi.
     */
    public function simpanRouting(User $admin, array $data, ?int $id = null): AturanRouting
    {
        return DB::transaction(function () use ($admin, $data, $id) {
            // Fallback: deteksi apakah sudah ada aturan yang sama persis
            if (! $id) {
                $duplikat = AturanRouting::where('kategori_id', $data['kategori_id'])
                    ->where('wilayah_id', $data['wilayah_id'])
                    ->where('instansi_id', $data['instansi_id'])
                    ->first();

                if ($duplikat) {
                    $id = $duplikat->id;
                }
            }

            $aturan = $id ? AturanRouting::findOrFail($id) : new AturanRouting;
            $nilaiLama = $id ? $aturan->toArray() : null;

            $aturan->fill($data);
            $aturan->save();

            AuditLogService::catat(
                aksi: $id ? 'UBAH_ATURAN_ROUTING' : 'TAMBAH_ATURAN_ROUTING',
                objekTipe: 'aturan_routing',
                objekId: $aturan->id,
                nilaiLama: $nilaiLama,
                nilaiBaru: $aturan->toArray(),
                alasan: $id
                    ? "Pembaruan aturan routing #{$aturan->id} (prioritas {$aturan->prioritas})"
                    : "Konfigurasi aturan routing baru (prioritas {$aturan->prioritas})",
                pelakuId: $admin->id
            );

            return $aturan->fresh(['kategori', 'wilayah', 'instansi']);
        });
    }

    /**
     * Menghapus aturan routing dengan audit log (FR-ADM-02).
     */
    public function hapusRouting(User $admin, AturanRouting $aturan): void
    {
        DB::transaction(function () use ($admin, $aturan) {
            $nilaiLama = $aturan->toArray();
            $id = $aturan->id;
            $deskripsi = "Penghapusan aturan routing #{$id} ({$aturan->kategori?->nama} - {$aturan->wilayah?->nama} -> {$aturan->instansi?->singkatan})";

            $aturan->delete();

            AuditLogService::catat(
                aksi: 'HAPUS_ATURAN_ROUTING',
                objekTipe: 'aturan_routing',
                objekId: $id,
                nilaiLama: $nilaiLama,
                nilaiBaru: null,
                alasan: $deskripsi,
                pelakuId: $admin->id
            );
        });
    }

    /**
     * Menyimpan atau memperbarui standar SLA hari kerja per kategori (FR-ADM-03).
     */
    public function simpanSla(User $admin, array $data): AturanSla
    {
        return DB::transaction(function () use ($admin, $data) {
            $sla = AturanSla::where('kategori_id', $data['kategori_id'])->first();
            $nilaiLama = $sla ? $sla->toArray() : null;

            $slaBaru = AturanSla::updateOrCreate(
                ['kategori_id' => $data['kategori_id']],
                $data
            );

            AuditLogService::catat(
                aksi: 'UPDATE_STANDAR_SLA',
                objekTipe: 'aturan_sla',
                objekId: $slaBaru->id,
                nilaiLama: $nilaiLama,
                nilaiBaru: $slaBaru->toArray(),
                alasan: "Pembaruan standar SLA kategori #{$data['kategori_id']}",
                pelakuId: $admin->id
            );

            return $slaBaru->fresh('kategori');
        });
    }

    /**
     * Menyimpan atau memperbarui parameter formula kuorum warga (FR-ADM-03).
     */
    public function simpanKuorum(User $admin, array $data): ParameterKuorum
    {
        return DB::transaction(function () use ($admin, $data) {
            $kuorum = ParameterKuorum::where('wilayah_id', $data['wilayah_id'])->first();
            $nilaiLama = $kuorum ? $kuorum->toArray() : null;

            $kuorumBaru = ParameterKuorum::updateOrCreate(
                ['wilayah_id' => $data['wilayah_id']],
                $data
            );

            AuditLogService::catat(
                aksi: 'UPDATE_PARAMETER_KUORUM',
                objekTipe: 'parameter_kuorum',
                objekId: $kuorumBaru->id,
                nilaiLama: $nilaiLama,
                nilaiBaru: $kuorumBaru->toArray(),
                alasan: "Pembaruan formula kuorum wilayah #{$data['wilayah_id']}",
                pelakuId: $admin->id
            );

            return $kuorumBaru->fresh('wilayah');
        });
    }
}
