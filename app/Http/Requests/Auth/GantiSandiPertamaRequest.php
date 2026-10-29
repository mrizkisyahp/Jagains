<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Hash;

class GantiSandiPertamaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    public function rules(): array
    {
        return [
            'current_password' => [
                'required',
                'string',
                function ($attribute, $value, $fail) {
                    if (! Hash::check($value, $this->user()->password)) {
                        $fail('Kata sandi saat ini yang Anda masukkan salah.');
                    }
                },
            ],
            'new_password' => [
                'required',
                'string',
                'min:8',
                'confirmed',
                'different:current_password',
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'new_password.min' => 'Kata sandi baru minimal terdiri dari 8 karakter.',
            'new_password.different' => 'Kata sandi baru tidak boleh sama dengan kata sandi awal.',
            'new_password.confirmed' => 'Konfirmasi kata sandi baru tidak cocok.',
        ];
    }
}
