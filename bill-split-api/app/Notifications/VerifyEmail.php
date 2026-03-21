<?php

namespace App\Notifications;

use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\URL;

class VerifyEmail extends Notification
{
    use Queueable;

    /**
     * The number of seconds the signed URL should be valid.
     * -1 means the URL never expires.
     */
    protected int $expirationSeconds = -1;

    /**
     * Create a new notification instance.
     */
    public function __construct(int $expirationSeconds = -1)
    {
        $this->expirationSeconds = $expirationSeconds;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $verificationUrl = $this->verificationUrl($notifiable);

        return (new MailMessage)
            ->subject('Verify Your Email Address')
            ->greeting('Hello ' . ($notifiable->first_name ?? 'User') . '!')
            ->line('Thank you for registering on Bill Split App!')
            ->line('Please click the button below to verify your email address.')
            ->action('Verify Email Address', $verificationUrl)
            ->line('If you did not create an account, no further action is required.')
            ->line('This verification link will expire ' . ($this->expirationSeconds === -1 ? 'never' : 'in ' . floor($this->expirationSeconds / 3600) . ' hours') . '.')
            ->salutation('Regards, Bill Split App Team');
    }

    /**
     * Get the verification URL for the notifiable.
     */
    protected function verificationUrl(object $notifiable): string
    {
        // Generate the signed URL with the API route
        if ($this->expirationSeconds === -1) {
            $url = URL::temporarySignedRoute(
                'verification.verify',
                Carbon::now()->addYears(10),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ]
            );
        } else {
            $url = URL::temporarySignedRoute(
                'verification.verify',
                Carbon::now()->addSeconds($this->expirationSeconds),
                [
                    'id' => $notifiable->getKey(),
                    'hash' => sha1($notifiable->getEmailForVerification()),
                ]
            );
        }

        // Parse the signed URL to extract query parameters (signature, expires)
        $parsedUrl = parse_url($url);
        parse_str($parsedUrl['query'] ?? '', $queryParams);

        // Build frontend URL with all parameters
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');
        
        // Include id and hash in the query params for the frontend
        $queryParams['id'] = $notifiable->getKey();
        $queryParams['hash'] = sha1($notifiable->getEmailForVerification());
        
        $frontendQuery = http_build_query($queryParams);

        return $frontendUrl . '/verify-email?' . $frontendQuery;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'email_verification',
            'email' => $notifiable->getEmailForVerification(),
        ];
    }
}
