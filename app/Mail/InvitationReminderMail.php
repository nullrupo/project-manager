<?php

namespace App\Mail;

use App\Models\InvitationNotification;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class InvitationReminderMail extends Mailable implements ShouldQueue
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public InvitationNotification $notification
    ) {}

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        $invitation = $this->notification->invitation;
        $subject = $this->getSubjectByType();

        return new Envelope(
            subject: $subject,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $template = $this->getTemplateByType();

        return new Content(
            markdown: $template,
            with: [
                'notification' => $this->notification,
                'invitation' => $this->notification->invitation,
                'project' => $this->notification->invitation->project,
                'invitedBy' => $this->notification->invitation->invitedBy,
                'acceptUrl' => route('invitations.accept', $this->notification->invitation->token),
                'declineUrl' => route('invitations.decline', $this->notification->invitation->token),
                'viewUrl' => route('invitations.show', $this->notification->invitation->token),
            ]
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }

    /**
     * Get email subject based on notification type.
     */
    private function getSubjectByType(): string
    {
        $invitation = $this->notification->invitation;
        $projectName = $invitation->project->name;

        return match($this->notification->type) {
            'reminder' => "Reminder: Invitation to join {$projectName}",
            'expiry_warning' => "Urgent: Your invitation to {$projectName} expires soon",
            'status_change' => "Invitation Update: {$projectName}",
            'follow_up' => "Follow-up: Invitation to {$projectName}",
            default => "Invitation Update: {$projectName}",
        };
    }

    /**
     * Get email template based on notification type.
     */
    private function getTemplateByType(): string
    {
        return match($this->notification->type) {
            'reminder' => 'emails.invitation-reminder',
            'expiry_warning' => 'emails.invitation-expiry-warning',
            'status_change' => 'emails.invitation-status-change',
            'follow_up' => 'emails.invitation-follow-up',
            default => 'emails.invitation-reminder',
        };
    }
}
