import { Head } from '@inertiajs/react';
import { Inbox, Search, Plus, CheckCircle, Clock, Tag, MoreHorizontal } from 'lucide-react';
import { useState } from 'react';
import axios from 'axios';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

interface InboxItem {
    id: number;
    title: string;
    description: string;
    from: {
        name: string;
        avatar: string | null;
        initials: string;
    };
    date: string;
    project: string;
    tags: string[];
}

interface InboxProps {
    inboxItems: InboxItem[];
}

const breadcrumbs = [
    { title: 'Inbox', href: '/inbox' }
];

export default function InboxPage({ inboxItems }: InboxProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedItems, setSelectedItems] = useState<number[]>([]);

    const filteredItems = inboxItems.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    // Toggle item selection
    const toggleItemSelection = (itemId: number) => {
        if (selectedItems.includes(itemId)) {
            setSelectedItems(selectedItems.filter(id => id !== itemId));
        } else {
            setSelectedItems([...selectedItems, itemId]);
        }
    };

    // Toggle all items selection
    const toggleAllItems = () => {
        if (selectedItems.length === filteredItems.length) {
            setSelectedItems([]);
        } else {
            setSelectedItems(filteredItems.map(item => item.id));
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Inbox" />

            <div className="flex h-full flex-1 flex-col gap-4 rounded-xl p-4">
                {/* Header with search and actions */}
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-bold">Inbox</h1>
                        <Badge variant="secondary" className="ml-2">
                            {filteredItems.length}
                        </Badge>
                    </div>
                    <div className="flex gap-2">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search inbox..."
                                className="pl-8"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <Button>
                            <Plus className="mr-1 h-4 w-4" />
                            New Item
                        </Button>
                    </div>
                </div>

                {/* Inbox list */}
                <Card>
                    <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Checkbox
                                    checked={selectedItems.length === filteredItems.length && filteredItems.length > 0}
                                    onCheckedChange={toggleAllItems}
                                />
                                <CardTitle>Messages</CardTitle>
                            </div>
                            {selectedItems.length > 0 && (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={async () => {
                                            try {
                                                await axios.post('/api/inbox/mark-as-read', {
                                                    ids: selectedItems
                                                });
                                                // Clear selection after marking as read
                                                setSelectedItems([]);
                                                // Reload the page to get updated data
                                                window.location.reload();
                                            } catch (error) {
                                                console.error('Error marking items as read:', error);
                                            }
                                        }}
                                    >
                                        <CheckCircle className="mr-1 h-4 w-4" />
                                        Mark as Read
                                    </Button>
                                    <Button variant="outline" size="sm">
                                        <Tag className="mr-1 h-4 w-4" />
                                        Tag
                                    </Button>
                                </div>
                            )}
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {filteredItems.map((item) => (
                                <div key={item.id} className="flex gap-4 border-b pb-4">
                                    <Checkbox
                                        checked={selectedItems.includes(item.id)}
                                        onCheckedChange={() => toggleItemSelection(item.id)}
                                        className="mt-1"
                                    />
                                    <div className="flex-grow">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <h3 className="font-medium">{item.title}</h3>
                                                <p className="text-sm text-muted-foreground">{item.description}</p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-muted-foreground">{new Date(item.date).toLocaleDateString()}</span>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem onClick={async () => {
                                                            try {
                                                                await axios.post('/api/inbox/mark-as-read', {
                                                                    ids: [item.id]
                                                                });
                                                                // Reload the page to get updated data
                                                                window.location.reload();
                                                            } catch (error) {
                                                                console.error('Error marking item as read:', error);
                                                            }
                                                        }}>Mark as Read</DropdownMenuItem>
                                                        <DropdownMenuItem>Move to Project</DropdownMenuItem>
                                                        <DropdownMenuItem>Add Tag</DropdownMenuItem>
                                                        <DropdownMenuItem className="text-destructive">Delete</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                        </div>
                                        <div className="mt-2 flex items-center justify-between">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="h-6 w-6">
                                                    {item.from.avatar && <AvatarImage src={item.from.avatar} alt={item.from.name} />}
                                                    <AvatarFallback>{item.from.initials}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-sm">{item.from.name}</span>
                                                <span className="text-sm text-muted-foreground">•</span>
                                                <span className="text-sm text-muted-foreground">{item.project}</span>
                                            </div>
                                            <div className="flex gap-1">
                                                {item.tags.map((tag, index) => (
                                                    <Badge key={index} variant="outline" className="text-xs">
                                                        {tag}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
