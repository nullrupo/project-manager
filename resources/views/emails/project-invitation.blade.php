@component('mail::message')
# You've been invited to join {{ $project->name }}

Hello!

{{ $invitedBy->name }} has invited you to collaborate on the project **{{ $project->name }}** as a **{{ $role }}**.

@if($invitation->message)
**Personal message:**
> {{ $invitation->message }}
@endif

## Project Details
- **Project:** {{ $project->name }}
- **Role:** {{ $role }}
- **Invited by:** {{ $invitedBy->name }}
@if($project->description)
- **Description:** {{ $project->description }}
@endif

## What you can do as a {{ $role }}:
@if($invitation->role === 'admin')
- Manage all aspects of the project except ownership transfer
- Add and remove team members
- Create and manage project boards and tasks
- Manage project labels and settings
@elseif($invitation->role === 'editor')
- Create and edit tasks
- Comment on tasks and collaborate with team
- View all project content
- Cannot manage project structure or members
@else
- View project content and progress
- Add comments and participate in discussions
- Cannot edit tasks or manage project settings
@endif

@component('mail::panel')
This invitation will expire on {{ $expiresAt->format('F j, Y \a\t g:i A') }}.
@endcomponent

@component('mail::button', ['url' => $acceptUrl, 'color' => 'success'])
Accept Invitation
@endcomponent

If you don't want to join this project, you can decline the invitation:

@component('mail::button', ['url' => $declineUrl, 'color' => 'error'])
Decline Invitation
@endcomponent

If you're having trouble clicking the buttons, copy and paste the following URLs into your browser:

**Accept:** {{ $acceptUrl }}

**Decline:** {{ $declineUrl }}

Thanks,<br>
{{ config('app.name') }} Team
@endcomponent
