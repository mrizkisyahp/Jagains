<?php

namespace App\Http\Requests\Instansi;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UsulanTolakRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->peran === 'instansi' && $this->user()?->instansi_id !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'alasan_baku' => [
                'required',
                'string',
                'in:bukan_fasilitas_publik,lahan_privat,laporan_fiktif,dalam_sengketa_hukum,lainnya',
            ],
            'keterangan' => ['required', 'string', 'min:10', 'max:1500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'alasan_baku.required' => 'Kategori alasan penolakan baku wajib dipilih.',
            'alasan_baku.in' => 'Kategori alasan penolakan tidak valid.',
            'keterangan.required' => 'Uraian keterangan pendukung usulan penolakan wajib diisi.',
            'keterangan.min' => 'Keterangan usulan penolakan minimal 10 karakter.',
        ];
    }
}
