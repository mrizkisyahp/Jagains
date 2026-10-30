<?php

namespace App\Http\Requests\Laporan;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class CekLaporanSerupaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'kategori_id' => ['required', 'integer', 'exists:kategori,id'],
            'lintang' => ['required', 'numeric', 'between:-90,90'],
            'bujur' => ['required', 'numeric', 'between:-180,180'],
            'akurasi_gps_m' => ['nullable', 'numeric', 'min:0'],
        ];
    }
}
