import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem, type Floor, type Hostel, type User } from '@/types';
import { Head, useForm, router } from '@inertiajs/react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
    IconPlus,
    IconTrash,
    IconBuilding,
    IconDoor,
    IconUsers,
} from '@tabler/icons-react';
import { useState } from 'react';

interface SettingsProps {
    floors: { data: Floor[] } | Floor[];
    staff: User[];
    hostel: Hostel;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Settings', href: '/settings/hostel' },
];

export default function SettingsIndex({ floors: floorsData, staff, hostel }: SettingsProps) {
    const floors = Array.isArray(floorsData) ? floorsData : (floorsData?.data ?? []);
    const [showFloorDialog, setShowFloorDialog] = useState(false);
    const [showRoomDialog, setShowRoomDialog] = useState(false);
    const [showStaffDialog, setShowStaffDialog] = useState(false);

    const floorForm = useForm({
        name: '',
        order: floors.length.toString(),
    });

    const roomForm = useForm({
        floor_id: '',
        room_number: '',
        gender: 'any',
        base_price: '5000',
        capacity: '2',
    });

    const staffForm = useForm({
        name: '',
        email: '',
        password: '',
    });

    const handleAddFloor = (e: React.FormEvent) => {
        e.preventDefault();
        floorForm.post('/settings/floors', {
            onSuccess: () => {
                setShowFloorDialog(false);
                floorForm.reset();
            },
        });
    };

    const handleAddRoom = (e: React.FormEvent) => {
        e.preventDefault();
        roomForm.post('/settings/rooms', {
            onSuccess: () => {
                setShowRoomDialog(false);
                roomForm.reset();
            },
        });
    };

    const handleAddStaff = (e: React.FormEvent) => {
        e.preventDefault();
        staffForm.post('/settings/staff', {
            onSuccess: () => {
                setShowStaffDialog(false);
                staffForm.reset();
            },
        });
    };

    const handleDeleteFloor = (floorId: number) => {
        if (confirm('Delete this floor and all its rooms?')) {
            router.delete(`/settings/floors/${floorId}`);
        }
    };

    const handleDeleteRoom = (roomId: number) => {
        if (confirm('Delete this room and its beds?')) {
            router.delete(`/settings/rooms/${roomId}`);
        }
    };

    const handleDeleteStaff = (userId: number) => {
        if (confirm('Remove this staff member?')) {
            router.delete(`/settings/staff/${userId}`);
        }
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Settings" />

            <div className="flex flex-1 flex-col gap-6 p-4 md:p-6">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
                    <p className="text-muted-foreground">Manage your hostel configuration</p>
                </div>

                {/* Hostel Info */}
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <IconBuilding className="h-5 w-5" />
                            Hostel Information
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <Label className="text-muted-foreground">Hostel Name</Label>
                                <p className="text-lg font-medium">{hostel.name}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Address</Label>
                                <p>{hostel.address || 'Not set'}</p>
                            </div>
                            <div>
                                <Label className="text-muted-foreground">Phone</Label>
                                <p>{hostel.phone || 'Not set'}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Floors & Rooms */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <IconDoor className="h-5 w-5" />
                                    Floors & Rooms
                                </CardTitle>
                                <CardDescription>Manage your hostel structure</CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Dialog open={showFloorDialog} onOpenChange={setShowFloorDialog}>
                                    <DialogTrigger asChild>
                                        <Button variant="outline" size="sm">
                                            <IconPlus className="mr-1 h-4 w-4" />
                                            Add Floor
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Floor</DialogTitle>
                                            <DialogDescription>Create a new floor</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleAddFloor} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Floor Name</Label>
                                                <Input
                                                    placeholder="e.g., Ground Floor"
                                                    value={floorForm.data.name}
                                                    onChange={(e) => floorForm.setData('name', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Order</Label>
                                                <Input
                                                    type="number"
                                                    value={floorForm.data.order}
                                                    onChange={(e) => floorForm.setData('order', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <Button type="submit" className="w-full" disabled={floorForm.processing}>
                                                Add Floor
                                            </Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>

                                <Dialog open={showRoomDialog} onOpenChange={setShowRoomDialog}>
                                    <DialogTrigger asChild>
                                        <Button size="sm">
                                            <IconPlus className="mr-1 h-4 w-4" />
                                            Add Room
                                        </Button>
                                    </DialogTrigger>
                                    <DialogContent>
                                        <DialogHeader>
                                            <DialogTitle>Add Room</DialogTitle>
                                            <DialogDescription>Create a new room with beds</DialogDescription>
                                        </DialogHeader>
                                        <form onSubmit={handleAddRoom} className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Floor</Label>
                                                <Select
                                                    value={roomForm.data.floor_id}
                                                    onValueChange={(v) => roomForm.setData('floor_id', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue placeholder="Select floor" />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {floors.map((f) => (
                                                            <SelectItem key={f.id} value={f.id.toString()}>
                                                                {f.name}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Room Number</Label>
                                                <Input
                                                    placeholder="e.g., 101"
                                                    value={roomForm.data.room_number}
                                                    onChange={(e) => roomForm.setData('room_number', e.target.value)}
                                                    required
                                                />
                                            </div>
                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <Label>Capacity (beds)</Label>
                                                    <Input
                                                        type="number"
                                                        min="1"
                                                        max="10"
                                                        value={roomForm.data.capacity}
                                                        onChange={(e) => roomForm.setData('capacity', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                                <div className="space-y-2">
                                                    <Label>Base Price (रू)</Label>
                                                    <Input
                                                        type="number"
                                                        value={roomForm.data.base_price}
                                                        onChange={(e) => roomForm.setData('base_price', e.target.value)}
                                                        required
                                                    />
                                                </div>
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Gender</Label>
                                                <Select
                                                    value={roomForm.data.gender}
                                                    onValueChange={(v) => roomForm.setData('gender', v)}
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="any">Any</SelectItem>
                                                        <SelectItem value="male">Male Only</SelectItem>
                                                        <SelectItem value="female">Female Only</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                            <Button type="submit" className="w-full" disabled={roomForm.processing}>
                                                Add Room
                                            </Button>
                                        </form>
                                    </DialogContent>
                                </Dialog>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {floors.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No floors yet. Add your first floor to get started.
                            </p>
                        ) : (
                            <div className="space-y-4">
                                {floors.map((floor) => (
                                    <div key={floor.id} className="rounded-lg border p-4">
                                        <div className="flex items-center justify-between mb-3">
                                            <h3 className="font-medium">{floor.name}</h3>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600 hover:text-red-700"
                                                onClick={() => handleDeleteFloor(floor.id)}
                                            >
                                                <IconTrash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {floor.rooms?.map((room) => (
                                                <div
                                                    key={room.id}
                                                    className="flex items-center gap-2 rounded border bg-muted/50 px-3 py-2"
                                                >
                                                    <span className="font-medium">
                                                        {room.room_number}
                                                    </span>
                                                    <Badge variant="outline">
                                                        {room.beds?.length || 0} beds
                                                    </Badge>
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        className="h-6 w-6 p-0 text-red-600"
                                                        onClick={() => handleDeleteRoom(room.id)}
                                                    >
                                                        <IconTrash className="h-3 w-3" />
                                                    </Button>
                                                </div>
                                            ))}
                                            {(!floor.rooms || floor.rooms.length === 0) && (
                                                <span className="text-sm text-muted-foreground">
                                                    No rooms on this floor
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Staff Management */}
                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div>
                                <CardTitle className="flex items-center gap-2">
                                    <IconUsers className="h-5 w-5" />
                                    Staff Members
                                </CardTitle>
                                <CardDescription>Manage wardens and staff access</CardDescription>
                            </div>
                            <Dialog open={showStaffDialog} onOpenChange={setShowStaffDialog}>
                                <DialogTrigger asChild>
                                    <Button size="sm">
                                        <IconPlus className="mr-1 h-4 w-4" />
                                        Add Staff
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Add Staff Member</DialogTitle>
                                        <DialogDescription>Create a warden account</DialogDescription>
                                    </DialogHeader>
                                    <form onSubmit={handleAddStaff} className="space-y-4">
                                        <div className="space-y-2">
                                            <Label>Name</Label>
                                            <Input
                                                value={staffForm.data.name}
                                                onChange={(e) => staffForm.setData('name', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Email</Label>
                                            <Input
                                                type="email"
                                                value={staffForm.data.email}
                                                onChange={(e) => staffForm.setData('email', e.target.value)}
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Password</Label>
                                            <Input
                                                type="password"
                                                value={staffForm.data.password}
                                                onChange={(e) => staffForm.setData('password', e.target.value)}
                                                required
                                                minLength={8}
                                            />
                                        </div>
                                        <Button type="submit" className="w-full" disabled={staffForm.processing}>
                                            Add Staff
                                        </Button>
                                    </form>
                                </DialogContent>
                            </Dialog>
                        </div>
                    </CardHeader>
                    <CardContent>
                        {staff.length === 0 ? (
                            <p className="text-center text-muted-foreground py-8">
                                No staff members yet
                            </p>
                        ) : (
                            <div className="space-y-3">
                                {staff.map((user) => (
                                    <div
                                        key={user.id}
                                        className="flex items-center justify-between rounded-lg border p-3"
                                    >
                                        <div>
                                            <p className="font-medium">{user.name}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge>Warden</Badge>
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-red-600"
                                                onClick={() => handleDeleteStaff(user.id)}
                                            >
                                                <IconTrash className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
