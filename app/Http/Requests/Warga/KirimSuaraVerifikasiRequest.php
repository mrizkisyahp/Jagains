<?php

namespace App\Http\Requests\Warga;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class KirimSuaraVerifikasiRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->peran === 'warga';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $jalur = strtoupper((string) $this->input('jalur', 'B'));
        $setuju = filter_var($this->input('setuju'), FILTER_VALIDATE_BOOLEAN, FILTER_NULL_ON_FAILURE);

        return [
            'setuju' => ['required', 'boolean'],
            'jalur' => ['required', 'in:A,B,a,b'],
            'foto_base64' => [$jalur === 'A' ? 'required' : 'nullable', 'string'],
            'latitude' => [$jalur === 'A' ? 'required' : 'nullable', 'numeric', 'between:-90,90'],
            'longitude' => [$jalur === 'A' ? 'required' : 'nullable', 'numeric', 'between:-180,180'],
            'akurasi_m' => ['nullable', 'numeric', 'min:0'],
            'alasan' => [
                $setuju === false ? 'required' : 'nullable',
                'string',
                $setuju === false ? 'min:10' : '',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'setuju.required' => 'Pilihan konfirmasi verifikasi (Sudah Sesuai / Belum Sesuai) wajib dipilih.',
            'jalur.required' => 'Jalur verifikasi (Jalur A atau Jalur B) wajib ditentukan.',
            'jalur.in' => 'Jalur verifikasi hanya boleh Jalur A (Kamera + GPS) atau Jalur B (Jarak Jauh).',
            'foto_base64.required' => 'Foto bukti kamera langsung di lokasi wajib diambil untuk verifikasi Jalur A.',
            'latitude.required' => 'Koordinat lintang GPS wajib disertakan pada verifikasi Jalur A.',
            'longitude.required' => 'Koordinat bujur GPS wajib disertakan pada verifikasi Jalur A.',
            'alasan.required' => 'Alasan penolakan wajib diisi jika Anda memilih "Belum Sesuai".',
            'alasan.min' => 'Alasan penolakan perbaikan harus diisi minimal 10 karakter bermakna.',
        ];
    }
}
