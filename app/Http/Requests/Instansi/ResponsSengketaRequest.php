<?php

namespace App\Http\Requests\Instansi;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ResponsSengketaRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->peran === 'instansi';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $pilihan = strtolower((string) $this->input('pilihan', ''));

        return [
            'pilihan' => ['required', 'in:kerjakan_ulang,sanggah'],
            'alasan_sanggah' => [
                $pilihan === 'sanggah' ? 'required' : 'nullable',
                'string',
                $pilihan === 'sanggah' ? 'min:10' : '',
            ],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'pilihan.required' => 'Pilihan jawaban sengketa ("kerjakan_ulang" atau "sanggah") wajib dipilih.',
            'pilihan.in' => 'Pilihan jawaban sengketa tidak valid.',
            'alasan_sanggah.required' => 'Alasan sanggahan teknis instansi wajib diisi jika memilih menyanggah warga.',
            'alasan_sanggah.min' => 'Alasan sanggahan teknis harus diisi minimal 10 karakter.',
        ];
    }
}
