<?php

namespace App\Http\Requests\Instansi;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class TanggapanResmiRequest extends FormRequest
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
            'tanggapan' => ['required', 'string', 'min:10', 'max:2500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tanggapan.required' => 'Pernyataan tanggapan resmi instansi wajib diisi.',
            'tanggapan.min' => 'Pernyataan tanggapan resmi minimal berisi 10 karakter.',
        ];
    }
}
