<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BukaIdentitasPelaporRequest extends FormRequest
{
    public function authorize(): bool
    {
        return in_array($this->user()?->peran, ['admin', 'auditor']);
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'alasan' => ['required', 'string', 'min:10', 'max:500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'alasan.required' => 'Alasan investigasi pembukaan identitas pelapor wajib diisi.',
            'alasan.min' => 'Alasan investigasi minimal berisi 10 karakter.',
        ];
    }
}
