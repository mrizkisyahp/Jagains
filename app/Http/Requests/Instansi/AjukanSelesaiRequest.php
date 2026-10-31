<?php

namespace App\Http\Requests\Instansi;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AjukanSelesaiRequest extends FormRequest
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
            'foto' => ['required', 'string'],
            'lintang' => ['required', 'numeric', 'between:-90,90'],
            'bujur' => ['required', 'numeric', 'between:-180,180'],
            'akurasi_gps_m' => ['nullable', 'numeric', 'min:0', 'max:500'],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'foto.required' => 'Foto bukti hasil perbaikan fisik wajib diambil dari kamera.',
            'lintang.required' => 'Koordinat lintang petugas di lokasi wajib disertakan.',
            'bujur.required' => 'Koordinat bujur petugas di lokasi wajib disertakan.',
        ];
    }
}
