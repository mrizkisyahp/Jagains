<?php

namespace App\Http\Requests\Instansi;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class AlihkanTiketRequest extends FormRequest
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
            'instansi_tujuan_id' => [
                'required',
                'integer',
                'exists:instansi,id',
                'different:instansi_asal_id',
            ],
            'alasan' => [
                'required',
                'string',
                'min:10',
                'max:1000',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'instansi_tujuan_id.required' => 'Instansi tujuan pengalihan wajib dipilih.',
            'instansi_tujuan_id.exists' => 'Instansi tujuan tidak terdaftar dalam sistem.',
            'instansi_tujuan_id.different' => 'Instansi tujuan tidak boleh sama dengan instansi saat ini.',
            'alasan.required' => 'Alasan pengalihan wajib diisi.',
            'alasan.min' => 'Alasan pengalihan minimal 10 karakter.',
        ];
    }
}
