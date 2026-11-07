<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title')</title>
</head>
<body style="margin:0;padding:0;background:#f7f0e5;font-family:'Segoe UI',system-ui,-apple-system,Arial,sans-serif;color:#3b2a1d;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f7f0e5;padding:34px 16px;">
        <tr>
            <td align="center">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                       style="max-width:520px;background:#fffdf9;border:1px solid #e7dbc6;border-radius:18px;padding:30px 30px 26px;">
                    <tr>
                        <td style="padding-bottom:22px;">
                            <span style="display:inline-block;width:26px;height:26px;border-radius:8px;background:#c1683c;vertical-align:middle;"></span>
                            <span style="font-size:19px;font-weight:800;letter-spacing:-0.4px;color:#3b2a1d;vertical-align:middle;margin-left:9px;">crumb</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-size:15px;line-height:1.65;color:#4a3728;">
                            @yield('content')
                        </td>
                    </tr>
                    <tr>
                        <td style="padding-top:26px;font-size:12px;color:#a6998a;line-height:1.6;">
                            <hr style="border:0;border-top:1px solid #e7dbc6;margin:0 0 14px;">
                            @yield('footer', "You're getting this because someone asked Crumb for help with this address. If it wasn't you, nothing needs changing.")
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
