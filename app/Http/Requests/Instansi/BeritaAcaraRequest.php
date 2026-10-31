<?php

namespace App\Http\Requests\Instansi;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BeritaAcaraRequest extends FormRequest
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
            'kegiatan' => ['required', 'string', 'min:10', 'max:2000'],
            'hasil' => ['required', 'string', 'min:10', 'max:2000'],
            'hambatan' => ['nullable', 'string', 'max:2000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'kegiatan.required' => 'Uraian kegiatan fisik wajib diisi.',
            'kegiatan.min' => 'Uraian kegiatan minimal berisi 10 karakter.',
            'hasil.required' => 'Uraian hasil fisik pekerjaan wajib diisi.',
            'hasil.min' => 'Uraian hasil minimal berisi 10 karakter.',
        ];
    }
}
