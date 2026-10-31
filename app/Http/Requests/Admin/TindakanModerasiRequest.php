<?php

namespace App\Http\Requests\Admin;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class TindakanModerasiRequest extends FormRequest
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
            'tindakan' => ['required', Rule::in(['diabaikan', 'peringatan', 'disembunyikan', 'dibekukan'])],
            'catatan' => ['required', 'string', 'min:10', 'max:1000'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tindakan.required' => 'Tindakan moderasi wajib dipilih.',
            'tindakan.in' => 'Tindakan moderasi tidak valid.',
            'catatan.required' => 'Catatan keputusan moderator wajib diisi.',
            'catatan.min' => 'Catatan keputusan moderator minimal 10 karakter.',
        ];
    }
}
