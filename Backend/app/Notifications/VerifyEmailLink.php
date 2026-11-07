<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Notifications\Notification;
use Illuminate\Support\Facades\URL;

class VerifyEmailLink extends Notification
{
    use Queueable;

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): Mailable
    {
        $signed = URL::temporarySignedRoute(
            'api.verification.verify',
            now()->addDays(2),
            ['id' => $notifiable->getKey(), 'hash' => sha1($notifiable->getEmailForVerification())]
        );

        return (new Mailable)
            ->to($notifiable->email, $notifiable->name)
            ->subject('Confirm your Crumb email address')
            ->view('emails.email-verification', [
                'name' => $notifiable->name,
                'url' => $signed,
            ]);
    }
}
