<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\SimpanPetugasRequest;
use App\Models\Instansi;
use App\Models\User;
use App\Services\PetugasManagementService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class PetugasManagementController extends Controller
{
    public function __construct(
        protected PetugasManagementService $petugasService
    ) {}

    /**
     * Menampilkan daftar akun staf (instansi & auditor) (FR-ADM-04).
     */
    public function index(Request $request): Response
    {
        $peranFilter = $request->query('peran');

        $query = User::with(['instansi:id,nama,singkatan'])
            ->whereIn('peran', ['instansi', 'auditor'])
            ->orderBy('created_at', 'desc');

        if ($peranFilter && in_array($peranFilter, ['instansi', 'auditor'])) {
            $query->where('peran', $peranFilter);
        }

        $daftarPetugas = $query->paginate(15)
            ->withQueryString()
            ->through(fn (User $u) => [
                'id' => $u->id,
                'username' => $u->username,
                'peran' => $u->peran,
                'status_akun' => $u->status_akun,
                'wajib_ganti_sandi' => $u->wajib_ganti_sandi,
                'instansi' => $u->instansi ? [
                    'id' => $u->instansi->id,
                    'nama' => $u->instansi->nama,
                    'singkatan' => $u->instansi->singkatan,
                ] : null,
                'created_at' => $u->created_at->toISOString(),
            ]);

        $daftarInstansi = Instansi::where('aktif', true)
            ->orderBy('nama')
            ->get(['id', 'nama', 'singkatan']);

        return Inertia::render('admin/petugas', [
            'daftarPetugas' => $daftarPetugas,
            'daftarInstansi' => $daftarInstansi,
            'peranFilter' => $peranFilter,
            'sandiBaru' => session('sandi_baru'),
            'petugasBaru' => session('petugas_baru'),
        ]);
    }

    /**
     * Menyimpan akun staf baru.
     */
    public function store(SimpanPetugasRequest $request): RedirectResponse
    {
        $result = $this->petugasService->buatPetugas(
            admin: $request->user(),
            data: $request->validated()
        );

        return back()
            ->with('sukses', "Akun staf {$result['user']->username} berhasil dibuat.")
            ->with('sandi_baru', $result['sandiBaru'])
            ->with('petugas_baru', [
                'username' => $result['user']->username,
                'peran' => $result['user']->peran,
            ]);
    }

    /**
     * Mereset kata sandi staf.
     */
    public function resetSandi(Request $request, User $user): RedirectResponse
    {
        if (! in_array($user->peran, ['instansi', 'auditor'])) {
            abort(400, 'Hanya dapat mereset sandi staf instansi atau auditor.');
        }

        $sandiBaru = $this->petugasService->resetSandi(
            admin: $request->user(),
            target: $user
        );

        return back()
            ->with('sukses', "Kata sandi {$user->username} berhasil direset.")
            ->with('sandi_baru', $sandiBaru)
            ->with('petugas_baru', [
                'username' => $user->username,
                'peran' => $user->peran,
            ]);
    }

    /**
     * Mengubah status akun aktif/nonaktif.
     */
    public function toggleStatus(Request $request, User $user): RedirectResponse
    {
        if (! in_array($user->peran, ['instansi', 'auditor'])) {
            abort(400, 'Hanya dapat mengubah status staf instansi atau auditor.');
        }

        $userSegar = $this->petugasService->toggleStatus(
            admin: $request->user(),
            target: $user
        );

        return back()->with('sukses', "Status akun {$userSegar->username} berhasil diubah menjadi {$userSegar->status_akun}.");
    }
}
