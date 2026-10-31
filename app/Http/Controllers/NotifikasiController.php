<?php

namespace App\Http\Controllers;

use App\Services\NotifikasiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class NotifikasiController extends Controller
{
    public function __construct(
        protected NotifikasiService $notifikasiService
    ) {}

    /**
     * Menampilkan halaman notifikasi pengguna atau mengembalikan data terpaginasi.
     */
    public function index(Request $request): Response|JsonResponse
    {
        $notifikasi = $this->notifikasiService->ambilNotifikasiUser($request->user(), perPage: 15);

        if ($request->wantsJson()) {
            return response()->json($notifikasi);
        }

        return Inertia::render('notifikasi/index', [
            'notifikasi' => $notifikasi,
        ]);
    }

    /**
     * Mengambil ringkasan notifikasi untuk popover navbar (unread count & 5 notifikasi terbaru).
     */
    public function ringkasan(Request $request): JsonResponse
    {
        $data = $this->notifikasiService->ambilRingkasanNavbar($request->user(), limit: 5);

        return response()->json($data);
    }

    /**
     * Menandai satu notifikasi sebagai telah dibaca.
     */
    public function baca(Request $request, int $id): JsonResponse|RedirectResponse
    {
        $this->notifikasiService->tandaiDibaca($request->user(), $id);

        if ($request->wantsJson()) {
            return response()->json(['sukses' => true]);
        }

        return back();
    }

    /**
     * Menandai seluruh notifikasi milik pengguna sebagai telah dibaca.
     */
    public function bacaSemua(Request $request): JsonResponse|RedirectResponse
    {
        $this->notifikasiService->tandaiDibaca($request->user());

        if ($request->wantsJson()) {
            return response()->json(['sukses' => true]);
        }

        return back()->with('sukses', 'Seluruh notifikasi telah ditandai dibaca.');
    }
}
