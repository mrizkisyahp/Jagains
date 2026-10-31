<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class AuditLogController extends Controller
{
    /**
     * Menampilkan daftar riwayat audit log berpaginasi dengan filter.
     */
    public function index(Request $request): Response
    {
        $query = AuditLog::with([
            'pelaku:id,username,peran',
            'laporan:id,nomor_tiket,judul',
        ])->orderByDesc('waktu');

        if ($request->filled('waktu_mulai')) {
            $query->whereDate('waktu', '>=', $request->query('waktu_mulai'));
        }

        if ($request->filled('waktu_selesai')) {
            $query->whereDate('waktu', '<=', $request->query('waktu_selesai'));
        }

        if ($request->filled('aksi')) {
            $query->where('aksi', $request->query('aksi'));
        }

        if ($request->filled('objek_tipe')) {
            $query->where('objek_tipe', $request->query('objek_tipe'));
        }

        if ($request->filled('search')) {
            $search = $request->query('search');
            $query->where(function ($q) use ($search) {
                $q->whereHas('pelaku', function ($sub) use ($search) {
                    $sub->where('username', 'ilike', "%{$search}%");
                })->orWhereHas('laporan', function ($sub) use ($search) {
                    $sub->where('nomor_tiket', 'ilike', "%{$search}%")
                        ->orWhere('judul', 'ilike', "%{$search}%");
                })->orWhere('alasan', 'ilike', "%{$search}%");
            });
        }

        $logs = $query->paginate(15)->withQueryString();

        $daftarAksi = AuditLog::select('aksi')
            ->distinct()
            ->orderBy('aksi')
            ->pluck('aksi');

        $isAuditor = $request->routeIs('auditor.*') || str_starts_with($request->path(), 'auditor/');
        $component = $isAuditor ? 'auditor/audit-log' : 'admin/audit-log';

        return Inertia::render($component, [
            'logs' => $logs,
            'filters' => [
                'waktu_mulai' => $request->query('waktu_mulai'),
                'waktu_selesai' => $request->query('waktu_selesai'),
                'aksi' => $request->query('aksi'),
                'objek_tipe' => $request->query('objek_tipe'),
                'search' => $request->query('search'),
            ],
            'daftarAksi' => $daftarAksi,
        ]);
    }
}
