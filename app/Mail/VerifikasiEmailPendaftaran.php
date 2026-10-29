<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class VerifikasiEmailPendaftaran extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $verificationUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Verifikasi Pendaftaran Akun Warga Jagains',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: '
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 8px;">
                    <h2 style="color: #18181b; margin-bottom: 16px;">Verifikasi Akun Warga Jagains</h2>
                    <p style="color: #3f3f46; font-size: 15px; line-height: 1.5;">
                        Terima kasih telah mendaftar di Jagains. Demi melindungi privasi Anda, alamat email ini tidak akan pernah disimpan di basis data kami setelah verifikasi selesai.
                    </p>
                    <p style="color: #3f3f46; font-size: 15px; line-height: 1.5;">
                        Klik tombol di bawah ini untuk melanjutkan pengisian username, kata sandi, dan kelurahan domisili Anda. Tautan ini hanya berlaku selama <strong>30 menit</strong> dan hanya dapat digunakan satu kali:
                    </p>
                    <div style="margin: 24px 0;">
                        <a href="'.htmlspecialchars($this->verificationUrl).'" style="background-color: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                            Lengkapi Pendaftaran Akun
                        </a>
                    </div>
                    <p style="color: #71717a; font-size: 13px;">
                        Jika Anda tidak pernah meminta pendaftaran ini, abaikan email ini. Tautan akan kedaluwarsa secara otomatis.
                    </p>
                </div>
            ',
        );
    }
}
