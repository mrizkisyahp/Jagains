<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class SimpanPetugasRequest extends FormRequest
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
            'username' => [
                'required',
                'string',
                'min:3',
                'max:50',
                'regex:/^[a-zA-Z0-9_]+$/',
                'unique:users,username',
            ],
            'peran' => ['required', Rule::in(['instansi', 'auditor'])],
            'instansi_id' => [
                Rule::requiredIf($this->input('peran') === 'instansi'),
                'nullable',
                'integer',
                'exists:instansi,id',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'username.required' => 'Username petugas wajib diisi.',
            'username.unique' => 'Username ini sudah digunakan.',
            'username.regex' => 'Username hanya boleh berupa huruf, angka, dan garis bawah (_).',
            'peran.required' => 'Peran akun petugas wajib ditentukan.',
            'instansi_id.required' => 'Instansi dinas wajib dipilih untuk akun petugas instansi.',
            'instansi_id.exists' => 'Instansi tidak valid.',
        ];
    }
}
