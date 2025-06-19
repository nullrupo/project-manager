import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import MemberManagement from './MemberManagement';
import MemberPermissionModal from '@/components/member-permission-modal';
import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { Project } from '@/types/project-manager';
import { type SharedData } from '@/types';
import { Button } from '@/components/ui/button';
import { UserPlus } from 'lucide-react';

interface ProjectMemberListModalProps {
  project: Project;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onInvite: () => void;
}

export default function ProjectMemberListModal({ project, open, onOpenChange, onInvite }: ProjectMemberListModalProps) {
  const { auth } = usePage<SharedData>().props;
  const [permissionModalOpen, setPermissionModalOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const isProjectOwner = auth.user.id === project.owner_id;
  const canEditMembers = isProjectOwner || (project.members?.some(m => m.id === auth.user.id && ['admin', 'owner'].includes(m.pivot?.role)));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Member Management</DialogTitle>
          <DialogDescription>View and manage project members, roles, and permissions.</DialogDescription>
          {canEditMembers && (
            <Button
              variant="default"
              size="sm"
              className="mt-2"
              onClick={onInvite}
            >
              <UserPlus className="h-4 w-4 mr-2" />
              Invite Member
            </Button>
          )}
        </DialogHeader>
        <MemberManagement
          project={project}
          canEdit={!!canEditMembers}
          onEditMember={member => { setSelectedMember(member); setPermissionModalOpen(true); }}
          onDeleteMember={member => {/* implement delete logic or open confirm dialog */}}
        />
        <MemberPermissionModal
          project={project}
          member={selectedMember}
          open={permissionModalOpen}
          onOpenChange={setPermissionModalOpen}
        />
      </DialogContent>
    </Dialog>
  );
} 