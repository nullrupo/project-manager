import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { MessageSquare, Plus, Search, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function Messages() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Messages', href: route('messages') },
            ]}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <MessageSquare className="h-8 w-8 text-primary" />
                        <div>
                            <Heading>Messages</Heading>
                            <p className="text-muted-foreground">
                                Communicate with your team members
                            </p>
                        </div>
                    </div>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        New Message
                    </Button>
                </div>

                <div className="grid gap-6 lg:grid-cols-3">
                    <Card className="lg:col-span-1">
                        <CardHeader>
                            <CardTitle className="flex items-center justify-between">
                                Conversations
                                <Badge variant="secondary">0</Badge>
                            </CardTitle>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search conversations..."
                                    className="pl-10"
                                />
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-48 text-muted-foreground">
                                <div className="text-center">
                                    <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                    <p className="text-sm">No conversations yet</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="lg:col-span-2">
                        <CardHeader>
                            <CardTitle>Message Thread</CardTitle>
                            <CardDescription>
                                Select a conversation to view messages
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-col h-96">
                                <div className="flex-1 flex items-center justify-center text-muted-foreground">
                                    <div className="text-center">
                                        <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                        <p>Select a conversation to start messaging</p>
                                        <p className="text-sm">Your messages will appear here</p>
                                    </div>
                                </div>
                                <div className="border-t pt-4">
                                    <div className="flex gap-2">
                                        <Input
                                            placeholder="Type your message..."
                                            disabled
                                        />
                                        <Button disabled>
                                            <Send className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="grid gap-4 md:grid-cols-3">
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Unread Messages</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-sm text-muted-foreground">New messages</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Active Chats</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-sm text-muted-foreground">Ongoing conversations</p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Team Members</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">0</div>
                            <p className="text-sm text-muted-foreground">Available to chat</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </AppLayout>
    );
}
