@extends('emails.layout')

@section('title', 'Confirm your Crumb email address')

@section('content')
    <p style="margin:0 0 16px;">Hi {{ $name }},</p>

    <p style="margin:0 0 20px;">
        One quick step before Crumb starts planning your week: confirm this is really
        your address. Verified cooks get meal reminders and weekly recipe ideas.
    </p>

    <p style="margin:0 0 22px;">
        <a href="{{ $url }}"
           style="display:inline-block;background:#c1683c;color:#ffffff;text-decoration:none;
                  padding:13px 26px;border-radius:999px;font-weight:700;font-size:14px;">
            Confirm email address
        </a>
    </p>

    <p style="margin:0;font-size:12px;color:#8a7663;word-break:break-all;">{{ $url }}</p>
@endsection
