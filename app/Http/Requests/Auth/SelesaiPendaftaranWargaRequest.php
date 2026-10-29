<?php

namespace App\Http\Requests\Auth;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SelesaiPendaftaranWargaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'token' => ['required', 'string'],
            'payload' => ['required', 'string'],
            'username' => [
                'required',
                'string',
                'min:3',
                'max:30',
                'regex:/^[a-zA-Z0-9_-]+$/',
                Rule::unique('users', 'username')->where(function ($query) {
                    return $query->whereRaw('lower(username) = ?', [strtolower($this->username)]);
                }),
            ],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'kelurahan_id' => [
                'required',
                'integer',
                Rule::exists('wilayah', 'id')->where('tingkat', 'kelurahan'),
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'username.regex' => 'Username hanya boleh berisi huruf, angka, tanda hubung (-), dan garis bawah (_).',
            'username.unique' => 'Username ini sudah digunakan. Silakan pilih username lain.',
            'password.min' => 'Kata sandi minimal terdiri dari 8 karakter.',
            'kelurahan_id.exists' => 'Kelurahan yang dipilih tidak valid dalam wilayah Kota Depok.',
        ];
    }
}
