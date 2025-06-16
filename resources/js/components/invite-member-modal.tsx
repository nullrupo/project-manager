import { useState, useEffect } from 'react';
import { useForm } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserPlus, Mail, Shield, Edit, Eye, Crown, Search, Users, X } from 'lucide-react';
import InputError from '@/components/input-error';
import { Project, User } from '@/types/project-manager';
import { route } from 'ziggy-js';
import { useShortName } from '@/hooks/use-initials';

interface InviteMemberModalProps {
    project: Project;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface InviteForm {
    user_id: number | null;
    email: string;
    role: 'admin' | 'editor' | 'viewer';
}

const roleDescriptions = {
    admin: 'Can manage all aspects of the project except ownership transfer',
    editor: 'Can create and edit tasks, but cannot manage project structure',
    viewer: 'Can view project content and add comments, but cannot edit',
};

const roleIcons = {
    admin: Crown,
    editor: Edit,
    viewer: Eye,
};

export default function InviteMemberModal({ project, open, onOpenChange }: InviteMemberModalProps) {
    const getShortName = useShortName();
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<User[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedUser, setSelectedUser] = useState<User | null>(null);
    const [activeTab, setActiveTab] = useState<'search' | 'email'>('search');

    const { data, setData, post, processing, errors, reset } = useForm<InviteForm>({
        user_id: null,
        email: '',
        role: 'viewer',
    });

    // Search for users
    useEffect(() => {
        console.log('Search effect triggered, query:', searchQuery, 'length:', searchQuery.length);
        if (searchQuery.length >= 2) {
            setIsSearching(true);
            const timeoutId = setTimeout(async () => {
                try {
                    const url = route('projects.members.search', { project: project.id }) + `?search=${encodeURIComponent(searchQuery)}`;
                    console.log('Making search request to:', url);

                    const response = await fetch(url, {
                        method: 'GET',
                        headers: {
                            'Accept': 'application/json',
                            'Content-Type': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest',
                            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                        },
                        credentials: 'same-origin'
                    });



                    if (!response.ok) {
                        const errorText = await response.text();
                        console.error('Response error text:', errorText);

                        // Try to parse as JSON to get more detailed error info
                        try {
                            const errorData = JSON.parse(errorText);
                            console.error('Error data:', errorData);
                            if (errorData.error) {
                                console.error('Permission error:', errorData.error);
                                if (errorData.debug) {
                                    console.error('Debug info:', errorData.debug);
                                }
                            }
                        } catch (e) {
                            console.error('Could not parse error response as JSON');
                        }

                        throw new Error(`HTTP error! status: ${response.status}`);
                    }

                    const data = await response.json();
                    console.log('Search response data:', data);
                    setSearchResults(data);
                } catch (error) {
                    console.error('Error searching users:', error);
                    setSearchResults([]);
                } finally {
                    setIsSearching(false);
                }
            }, 300);

            return () => clearTimeout(timeoutId);
        } else {
            setSearchResults([]);
            setIsSearching(false);
        }
    }, [searchQuery, project.id]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post(route('projects.members.store', project.id), {
            onSuccess: () => {
                handleClose();
            },
        });
    };

    const handleClose = () => {
        reset();
        setSearchQuery('');
        setSearchResults([]);
        setSelectedUser(null);
        setActiveTab('search');
        onOpenChange(false);
    };

    const handleUserSelect = (user: User) => {
        setSelectedUser(user);
        setData('user_id', user.id);
        setData('email', ''); // Clear email when user is selected
        setSearchQuery('');
        setSearchResults([]);
    };

    const handleClearSelection = () => {
        setSelectedUser(null);
        setData('user_id', null);
    };

    const handleTabChange = (tab: string) => {
        setActiveTab(tab as 'search' | 'email');
        // Clear form data when switching tabs
        if (tab === 'search') {
            setData('email', '');
        } else {
            setData('user_id', null);
            setSelectedUser(null);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        Invite Team Member
                    </DialogTitle>
                    <DialogDescription>
                        Add a new member to collaborate on "{project.name}"
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="search" className="flex items-center gap-2">
                                <Users className="h-4 w-4" />
                                Search Users
                            </TabsTrigger>
                            <TabsTrigger value="email" className="flex items-center gap-2">
                                <Mail className="h-4 w-4" />
                                By Email
                            </TabsTrigger>
                        </TabsList>

                        <TabsContent value="search" className="space-y-4">
                            {selectedUser ? (
                                <div className="space-y-3">
                                    <Label>Selected User</Label>
                                    <div className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                                        <div className="flex items-center gap-3">
                                            <Avatar className="h-10 w-10">
                                                <AvatarImage src={selectedUser.avatar} />
                                                <AvatarFallback>
                                                    {selectedUser.name.charAt(0).toUpperCase()}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{getShortName(selectedUser.name)}</p>
                                                <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                                            </div>
                                        </div>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleClearSelection}
                                        >
                                            <X className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <Label htmlFor="search" className="flex items-center gap-2">
                                        <Search className="h-4 w-4" />
                                        Search for Users
                                    </Label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                        <Input
                                            id="search"
                                            value={searchQuery}
                                            onChange={(e) => setSearchQuery(e.target.value)}
                                            placeholder="Type name or email to search..."
                                            className="pl-10"
                                        />
                                    </div>

                                    {isSearching && (
                                        <div className="text-sm text-muted-foreground">Searching...</div>
                                    )}

                                    {searchResults.length > 0 && (
                                        <div className="space-y-2 max-h-40 overflow-y-auto">
                                            {searchResults.map((user) => (
                                                <div
                                                    key={user.id}
                                                    className="flex items-center gap-3 p-2 hover:bg-muted/50 rounded-lg cursor-pointer"
                                                    onClick={() => handleUserSelect(user)}
                                                >
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={user.avatar} />
                                                        <AvatarFallback>
                                                            {user.name.charAt(0).toUpperCase()}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div>
                                                        <p className="font-medium text-sm">{getShortName(user.name)}</p>
                                                        <p className="text-xs text-muted-foreground">{user.email}</p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {searchQuery.length >= 2 && !isSearching && searchResults.length === 0 && (
                                        <div className="text-sm text-muted-foreground">No users found</div>
                                    )}
                                </div>
                            )}
                        </TabsContent>

                        <TabsContent value="email" className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    Email Address
                                </Label>
                                <Input
                                    id="email"
                                    type="email"
                                    value={data.email}
                                    onChange={(e) => setData('email', e.target.value)}
                                    placeholder="Enter email address"
                                />
                                <InputError message={errors.email} />
                            </div>
                        </TabsContent>
                    </Tabs>

                    <div className="space-y-3">
                        <Label className="flex items-center gap-2">
                            <Shield className="h-4 w-4" />
                            Role & Permissions
                        </Label>
                        <Select value={data.role} onValueChange={(value: 'admin' | 'editor' | 'viewer') => setData('role', value)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {Object.entries(roleDescriptions).map(([role, description]) => {
                                    const Icon = roleIcons[role as keyof typeof roleIcons];
                                    return (
                                        <SelectItem key={role} value={role}>
                                            <div className="flex items-center gap-2">
                                                <Icon className="h-4 w-4" />
                                                <div>
                                                    <div className="font-medium capitalize">{role}</div>
                                                    <div className="text-xs text-muted-foreground">{description}</div>
                                                </div>
                                            </div>
                                        </SelectItem>
                                    );
                                })}
                            </SelectContent>
                        </Select>
                        <InputError message={errors.role} />
                    </div>

                    <div className="bg-muted/30 rounded-lg p-3">
                        <div className="text-sm font-medium mb-2">Selected Role:</div>
                        <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="capitalize">
                                {data.role}
                            </Badge>
                            <span className="text-sm text-muted-foreground">
                                {roleDescriptions[data.role]}
                            </span>
                        </div>
                    </div>

                    {/* Show validation errors */}
                    <InputError message={errors.user} />

                    <DialogFooter className="gap-2">
                        <Button type="button" variant="outline" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={processing || (activeTab === 'search' && !selectedUser) || (activeTab === 'email' && !data.email)}
                        >
                            {processing ? 'Adding...' : 'Add Member'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
