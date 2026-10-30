<?php

namespace App\Http\Requests\Warga;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DukungLaporanSerupaRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->peran === 'warga';
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'laporan_id' => ['required', 'integer', 'exists:laporan,id'],
        ];
    }
}
