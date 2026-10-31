<?php

namespace App\Http\Requests\Instansi;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class TerimaTiketRequest extends FormRequest
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
            'catatan' => ['nullable', 'string', 'max:1000'],
        ];
    }
}
