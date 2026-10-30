<?php

namespace App\Http\Requests\Wilayah;

use Illuminate\Foundation\Http\FormRequest;

class DeteksiKelurahanRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('lintang') && ! $this->has('latitude')) {
            $this->merge(['latitude' => $this->input('lintang')]);
        }
        if ($this->has('bujur') && ! $this->has('longitude')) {
            $this->merge(['longitude' => $this->input('bujur')]);
        }
    }

    public function rules(): array
    {
        return [
            'latitude' => ['required', 'numeric', 'between:-90,90'],
            'longitude' => ['required', 'numeric', 'between:-180,180'],
        ];
    }
}
