<?php

namespace App\Http\Requests\Tiket;

use Illuminate\Foundation\Http\FormRequest;

class LaporKontenRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null;
    }

    /**
     * @return array<string, array<int, string>>
     */
    public function rules(): array
    {
        return [
            'alasan' => [
                'required',
                'string',
                'in:sara_ujaran_kebencian,foto_tidak_senonoh,spam_promosi,informasi_palsu,pelanggaran_privasi,lainnya',
            ],
            'catatan' => [
                'nullable',
                'string',
                'max:500',
            ],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'alasan.required' => 'Pilihlah salah satu alasan pelanggaran yang sesuai.',
            'alasan.in' => 'Kategori alasan pelanggaran yang dipilih tidak valid.',
            'catatan.max' => 'Catatan tambahan tidak boleh melebihi 500 karakter.',
        ];
    }
}
