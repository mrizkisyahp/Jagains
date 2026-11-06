<?php

namespace App\Exceptions;

use RuntimeException;

class FotoProcessingException extends RuntimeException
{
    /**
     * Pesan aman yang ramah pengguna tanpa membocorkan rincian internal server.
     */
    public const DEFAULT_MESSAGE = 'Layanan pemrosesan foto saat ini tidak tersedia pada server. Silakan hubungi administrator.';

    public function __construct(string $message = self::DEFAULT_MESSAGE, int $code = 0, ?\Throwable $previous = null)
    {
        parent::__construct($message, $code, $previous);
    }

    /**
     * Factory method saat dependensi ekstensi/fungsi GD tidak tersedia pada runtime.
     *
     * @param  array<int, string>  $missingFunctions
     */
    public static function gdUnavailable(array $missingFunctions = []): self
    {
        return new self(self::DEFAULT_MESSAGE);
    }
}
