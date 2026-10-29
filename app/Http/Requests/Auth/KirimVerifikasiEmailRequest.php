<?php

namespace App\Http\Requests\Auth;

use App\Models\User;
use App\Services\EmailPrivacyService;
use Illuminate\Foundation\Http\FormRequest;

class KirimVerifikasiEmailRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'email' => [
                'required',
                'string',
                'email',
                'max:255',
                function ($attribute, $value, $fail) {
                    $service = app(EmailPrivacyService::class);

                    // 1. Tolak domain .go.id
                    if ($service->isGovernmentDomain($value)) {
                        $fail('Pendaftaran akun warga tidak mengizinkan penggunaan alamat email berdomain .go.id.');

                        return;
                    }

                    // 2. Normalisasi dan cek apakah hash sudah ada di database
                    $hash = $service->computeHash($value);
                    if (User::where('email_hash', $hash)->exists()) {
                        $fail('Alamat email ini sudah terdaftar sebagai akun warga.');
                    }
                },
            ],
        ];
    }
}
