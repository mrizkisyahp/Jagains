<?php

namespace App\Http\Requests\Warga;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class BuatLaporanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user() !== null && $this->user()->peran === 'warga';
    }

    /**
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'kategori_id' => ['required', 'integer', 'exists:kategori,id'],
            'keparahan' => ['nullable', 'string', 'in:ringan,sedang,berat'],
            'keterangan' => ['required', 'string', 'min:10', 'max:2000'],
            'lintang' => ['required', 'numeric', 'between:-90,90'],
            'bujur' => ['required', 'numeric', 'between:-180,180'],
            'lokasi_sumber' => ['required', 'string', 'in:gps,manual'],
            'akurasi_gps_m' => ['nullable', 'numeric', 'min:0', 'required_if:lokasi_sumber,gps'],
            'foto' => ['required', 'string'],
        ];
    }

    /**
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'kategori_id.required' => 'Kategori kerusakan fasilitas publik wajib dipilih.',
            'keterangan.required' => 'Uraian keterangan kerusakan wajib diisi.',
            'keterangan.min' => 'Uraian keterangan kerusakan minimal 10 karakter agar informatif bagi dinas.',
            'lintang.required' => 'Titik koordinat lokasi kerusakan wajib ditentukan di peta.',
            'bujur.required' => 'Titik koordinat lokasi kerusakan wajib ditentukan di peta.',
            'lokasi_sumber.required' => 'Sumber penentuan lokasi wajib dipilih (GPS atau manual).',
            'akurasi_gps_m.required_if' => 'Tingkat akurasi GPS wajib tersedia saat menggunakan sumber GPS.',
            'foto.required' => 'Laporan wajib menyertakan foto bukti langsung dari kamera peramban.',
        ];
    }
}
