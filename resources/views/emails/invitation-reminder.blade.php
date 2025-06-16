@component('mail::message')
# Reminder: You're invited to join {{ $project->name }}

Hello!

This is a friendly reminder that {{ $invitedBy->name }} has invited you to collaborate on **{{ $project->name }}**.

@if($invitation->message)
**Personal message:**
> {{ $invitation->message }}
@endif

## Project Details
- **Project:** {{ $project->name }}
- **Role:** {{ ucfirst($invitation->role) }}
- **Invited by:** {{ $invitedBy->name }}
@if($project->description)
- **Description:** {{ $project->description }}
@endif

@component('mail::panel')
⏰ This invitation will expire on {{ $invitation->expires_at->format('F j, Y \a\t g:i A') }}.
@endcomponent

Don't miss out on this collaboration opportunity!

@component('mail::button', ['url' => $acceptUrl, 'color' => 'success'])
Accept Invitation
@endcomponent

@component('mail::button', ['url' => $declineUrl, 'color' => 'error'])
Decline Invitation
@endcomponent

You can also view the full invitation details:

@component('mail::button', ['url' => $viewUrl])
View Invitation Details
@endcomponent

If you're having trouble clicking the buttons, copy and paste the following URLs into your browser:

**Accept:** {{ $acceptUrl }}

**Decline:** {{ $declineUrl }}

**View Details:** {{ $viewUrl }}

Thanks,<br>
{{ config('app.name') }} Team
@endcomponent
