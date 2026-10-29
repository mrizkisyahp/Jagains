<?php

namespace App\Http\Requests\Warga;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class GantiKelurahanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() && $this->user()->peran === 'warga';
    }

    public function rules(): array
    {
        $user = $this->user();

        return [
            'kelurahan_id' => [
                'required',
                'integer',
                Rule::exists('wilayah', 'id')->where('tingkat', 'kelurahan'),
                function ($attribute, $value, $fail) use ($user) {
                    // 1. Tidak boleh sama dengan kelurahan saat ini
                    if ((int) $value === (int) $user->kelurahan_id) {
                        $fail('Kelurahan yang dipilih sama dengan kelurahan domisili Anda saat ini.');

                        return;
                    }

                    // 2. Pemeriksaan aturan jeda 90 hari kalender (P-14 & AS-10)
                    if ($user->kelurahan_diubah_pada) {
                        $diffDays = $user->kelurahan_diubah_pada->diffInDays(now());
                        if ($diffDays < 90) {
                            $tanggalBoleh = $user->kelurahan_diubah_pada->addDays(90)->format('d F Y');
                            $fail("Penggantian kelurahan hanya dapat dilakukan paling cepat 90 hari setelah pendaftaran atau penggantian terakhir. Anda baru dapat mengganti kembali pada tanggal {$tanggalBoleh}.");
                        }
                    }
                },
            ],
        ];
    }

    public function messages(): array
    {
        return [
            'kelurahan_id.exists' => 'Kelurahan yang dipilih tidak valid di wilayah Kota Depok.',
        ];
    }
}
