<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Notifications\Notification;

class PasswordResetLink extends Notification
{
    use Queueable;

    public function __construct(public string $token, public string $email) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): Mailable
    {
        $url = rtrim(config('crumb.frontend_url'), '/').'/reset-password'
            .'?token='.$this->token
            .'&email='.urlencode($this->email);

        return (new Mailable)
            ->to($notifiable->email, $notifiable->name)
            ->subject('Reset your Crumb password')
            ->view('emails.password-reset', [
                'name' => $notifiable->name,
                'url' => $url,
                'minutes' => config('auth.passwords.'.config('auth.defaults.passwords').'.expire'),
            ]);
    }
}
