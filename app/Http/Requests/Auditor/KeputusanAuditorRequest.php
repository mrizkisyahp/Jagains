<?php

namespace App\Http\Requests\Auditor;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class KeputusanAuditorRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->peran === 'auditor';
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        $jenis = strtoupper((string) $this->input('jenis', ''));

        return [
            'jenis' => ['required', 'in:PERINTAH,PERBAIKAN_SAH,KERJAKAN_ULANG'],
            'perintah' => [
                in_array($jenis, ['PERINTAH', 'KERJAKAN_ULANG'], true) ? 'required' : 'nullable',
                'string',
                in_array($jenis, ['PERINTAH', 'KERJAKAN_ULANG'], true) ? 'min:10' : '',
            ],
            'alasan' => [
                in_array($jenis, ['PERBAIKAN_SAH', 'KERJAKAN_ULANG'], true) ? 'required' : 'nullable',
                'string',
                in_array($jenis, ['PERBAIKAN_SAH', 'KERJAKAN_ULANG'], true) ? 'min:10' : '',
            ],
            'tenggat' => [
                in_array($jenis, ['PERINTAH', 'KERJAKAN_ULANG'], true) ? 'required' : 'nullable',
                'date',
                in_array($jenis, ['PERINTAH', 'KERJAKAN_ULANG'], true) ? 'after_or_equal:today' : '',
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
            'jenis.required' => 'Jenis keputusan sidang Auditor wajib dipilih.',
            'jenis.in' => 'Jenis keputusan yang dipilih tidak sah.',
            'perintah.required' => 'Instruksi/perintah tertulis Auditor wajib diisi minimal 10 karakter.',
            'perintah.min' => 'Instruksi/perintah tertulis Auditor wajib diisi minimal 10 karakter.',
            'alasan.required' => 'Alasan pertimbangan teknis/yuridis Auditor wajib diisi minimal 10 karakter.',
            'alasan.min' => 'Alasan pertimbangan teknis/yuridis Auditor wajib diisi minimal 10 karakter.',
            'tenggat.required' => 'Tenggat waktu tindak lanjut wajib ditentukan.',
            'tenggat.after_or_equal' => 'Tenggat waktu tidak boleh tanggal yang sudah lampau.',
        ];
    }
}
