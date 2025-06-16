@component('mail::message')
# ⚠️ Urgent: Your invitation expires soon!

Hello!

Your invitation to join **{{ $project->name }}** is about to expire.

@component('mail::panel', ['type' => 'warning'])
🕐 **Time remaining:** {{ $invitation->expires_at->diffForHumans() }}

**Expires on:** {{ $invitation->expires_at->format('F j, Y \a\t g:i A') }}
@endcomponent

## Project Details
- **Project:** {{ $project->name }}
- **Role:** {{ ucfirst($invitation->role) }}
- **Invited by:** {{ $invitedBy->name }}

Don't let this opportunity slip away! Accept your invitation now to start collaborating.

@component('mail::button', ['url' => $acceptUrl, 'color' => 'success'])
Accept Invitation Now
@endcomponent

@component('mail::button', ['url' => $declineUrl, 'color' => 'error'])
Decline Invitation
@endcomponent

If you need more time or have questions about this invitation, please contact {{ $invitedBy->name }} directly.

**Quick Links:**
- Accept: {{ $acceptUrl }}
- Decline: {{ $declineUrl }}
- View Details: {{ $viewUrl }}

Thanks,<br>
{{ config('app.name') }} Team
@endcomponent
