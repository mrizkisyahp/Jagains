<?php

namespace App\Services;

class EmailPrivacyService
{
    public function __construct(
        private ?string $hmacKey = null
    ) {
        $this->hmacKey = $this->hmacKey ?: (string) config('auth.email_hmac_key', config('app.key'));
    }

    /**
     * Memeriksa apakah domain email adalah domain instansi pemerintah (.go.id).
     */
    public function isGovernmentDomain(string $email): bool
    {
        $domain = strtolower(substr(strrchr($email, '@') ?: '', 1));

        return $domain === 'go.id' || str_ends_with($domain, '.go.id');
    }

    /**
     * Menormalkan email:
     * - lowercase
     * - membuang tag plus (+tag)
     * - mengabaikan titik untuk domain Gmail / Googlemail
     */
    public function normalizeEmail(string $email): string
    {
        $email = trim(strtolower($email));
        $atPos = strrpos($email, '@');

        if ($atPos === false) {
            return $email;
        }

        $localPart = substr($email, 0, $atPos);
        $domain = substr($email, $atPos + 1);

        // Buang tag setelah tanda plus
        $plusPos = strpos($localPart, '+');
        if ($plusPos !== false) {
            $localPart = substr($localPart, 0, $plusPos);
        }

        // Untuk provider gmail/googlemail, titik pada local part diabaikan
        if ($domain === 'gmail.com' || $domain === 'googlemail.com') {
            $localPart = str_replace('.', '', $localPart);
        }

        return $localPart.'@'.$domain;
    }

    /**
     * Menghitung HMAC-SHA256 dari email yang sudah dinormalkan.
     * Hasilnya tepat 64 karakter heksadesimal.
     */
    public function computeHash(string $email): string
    {
        $normalized = $this->normalizeEmail($email);

        return hash_hmac('sha256', $normalized, (string) $this->hmacKey);
    }
}
