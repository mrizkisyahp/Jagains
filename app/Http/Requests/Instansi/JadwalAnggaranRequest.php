<?php

namespace App\Http\Requests\Instansi;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class JadwalAnggaranRequest extends FormRequest
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
            'jenis_pendanaan' => ['required', 'string', 'in:APBD_KOTA,APBD_PROVINSI,APBN,LAINNYA'],
            'tanggal_target' => [
                'required',
                'date',
                'after_or_equal:today',
                'before_or_equal:'.now()->addDays(180)->toDateString(),
            ],
            'catatan' => ['nullable', 'string', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'jenis_pendanaan.required' => 'Jenis sumber pendanaan wajib dipilih.',
            'jenis_pendanaan.in' => 'Pilihan jenis pendanaan tidak valid.',
            'tanggal_target.required' => 'Tanggal target penyelesaian (janji publik) wajib ditentukan.',
            'tanggal_target.after_or_equal' => 'Tanggal target tidak boleh tanggal di masa lalu.',
            'tanggal_target.before_or_equal' => 'Tanggal target maksimal 180 hari dari hari ini (Parameter P-15).',
        ];
    }
}
