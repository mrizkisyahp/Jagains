<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class PemulihanKataSandi extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(
        public string $resetUrl
    ) {}

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Permintaan Pemulihan Kata Sandi Akun Jagains',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: '
                <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e4e4e7; border-radius: 8px;">
                    <h2 style="color: #18181b; margin-bottom: 16px;">Pemulihan Kata Sandi Akun Warga</h2>
                    <p style="color: #3f3f46; font-size: 15px; line-height: 1.5;">
                        Kami menerima permintaan untuk mengatur ulang kata sandi akun Jagains Anda.
                    </p>
                    <p style="color: #3f3f46; font-size: 15px; line-height: 1.5;">
                        Klik tombol di bawah ini untuk memasukkan kata sandi baru. Tautan ini hanya berlaku selama <strong>30 menit</strong> dan hanya dapat digunakan 1 kali:
                    </p>
                    <div style="margin: 24px 0;">
                        <a href="'.htmlspecialchars($this->resetUrl).'" style="background-color: #18181b; color: #ffffff; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                            Atur Ulang Kata Sandi
                        </a>
                    </div>
                    <p style="color: #71717a; font-size: 13px;">
                        Jika Anda tidak pernah meminta pengaturan ulang kata sandi, abaikan email ini. Akun Anda tetap aman.
                    </p>
                </div>
            ',
        );
    }
}
