@extends('emails.layout')

@section('title', 'Reset your Crumb password')

@section('content')
    <p style="margin:0 0 16px;">Hi {{ $name }},</p>

    <p style="margin:0 0 20px;">
        We got a request to reset your password. Click below to choose a new one —
        this link works once and expires in {{ $minutes }} minutes.
    </p>

    <p style="margin:0 0 22px;">
        <a href="{{ $url }}"
           style="display:inline-block;background:#4b3524;color:#ffffff;text-decoration:none;
                  padding:13px 26px;border-radius:999px;font-weight:700;font-size:14px;">
            Reset password
        </a>
    </p>

    <p style="margin:0 0 6px;font-size:13px;color:#6b5946;">
        Button not working? Paste this into your browser:
    </p>
    <p style="margin:0;font-size:12px;color:#8a7663;word-break:break-all;">{{ $url }}</p>
@endsection
