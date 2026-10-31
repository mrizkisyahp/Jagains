<?php

namespace App\Http\Requests\Instansi;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class KembalikanTiketRequest extends FormRequest
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
            'alasan' => ['required', 'string', 'min:10', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'alasan.required' => 'Alasan pengembalian ke Admin wajib diisi.',
            'alasan.min' => 'Alasan pengembalian minimal berisi 10 karakter.',
        ];
    }
}
