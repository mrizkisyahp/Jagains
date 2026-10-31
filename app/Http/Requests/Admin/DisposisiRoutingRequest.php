<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DisposisiRoutingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->peran === 'admin';
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'instansi_id' => ['required', 'integer', 'exists:instansi,id'],
            'catatan' => ['required', 'string', 'min:10', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'instansi_id.required' => 'Instansi teknis tujuan wajib dipilih.',
            'instansi_id.exists' => 'Instansi yang dipilih tidak valid dalam sistem.',
            'catatan.required' => 'Catatan disposisi wajib diisi.',
            'catatan.min' => 'Catatan disposisi minimal berisi 10 karakter.',
        ];
    }
}
