import AppLayout from '@/layouts/app-layout';
import Heading from '@/components/heading';
import { FileText, Plus, Search, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

export default function Documents() {
    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Documents', href: route('documents') },
            ]}
        >
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-primary" />
                        <div>
                            <Heading>Documents</Heading>
                            <p className="text-muted-foreground">
                                Manage and organize your project documents
                            </p>
                        </div>
                    </div>
                    <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Upload Document
                    </Button>
                </div>

                <div className="flex gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search documents..."
                            className="pl-10"
                        />
                    </div>
                    <Button variant="outline">
                        <Filter className="h-4 w-4 mr-2" />
                        Filter
                    </Button>
                </div>

                <div className="grid gap-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Documents</CardTitle>
                            <CardDescription>
                                Your latest uploaded and modified documents
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="flex items-center justify-center h-64 text-muted-foreground">
                                <div className="text-center">
                                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>No documents uploaded yet</p>
                                    <p className="text-sm">Upload your first document to get started</p>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">All Documents</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-sm text-muted-foreground">Total documents</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Shared</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0</div>
                                <p className="text-sm text-muted-foreground">Shared with team</p>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle className="text-lg">Storage Used</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">0 MB</div>
                                <p className="text-sm text-muted-foreground">of 1 GB available</p>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}
