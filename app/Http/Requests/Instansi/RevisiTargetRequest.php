<?php

namespace App\Http\Requests\Instansi;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class RevisiTargetRequest extends FormRequest
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
            'tanggal_target_baru' => [
                'required',
                'date',
                'after_or_equal:today',
                'before_or_equal:'.now()->addDays(180)->toDateString(),
            ],
            'alasan' => ['required', 'string', 'min:10', 'max:1500'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'tanggal_target_baru.required' => 'Tanggal target baru wajib ditentukan.',
            'tanggal_target_baru.after_or_equal' => 'Tanggal target tidak boleh tanggal di masa lalu.',
            'tanggal_target_baru.before_or_equal' => 'Tanggal target baru maksimal 180 hari dari hari ini.',
            'alasan.required' => 'Alasan revisi janji target publik wajib diisi.',
            'alasan.min' => 'Alasan revisi minimal 10 karakter.',
        ];
    }
}
