import { useEffect, useState } from 'react';
import { api, type Appointment } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Loader2, Plus } from 'lucide-react';

export default function MemberDashboard() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);
    const [bookingOpen, setBookingOpen] = useState(false);

    // New Appointment Form State
    const [providerId, setProviderId] = useState(''); // In real app, this would be a select
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [notes, setNotes] = useState('');
    const [bookingLoading, setBookingLoading] = useState(false);

    const loadAppointments = async () => {
        try {
            const data = await api.getMyAppointments();
            setAppointments(data);
        } catch (error) {
            console.error('Failed to load appointments', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadAppointments();
    }, []);

    const handleBook = async (e: React.FormEvent) => {
        e.preventDefault();
        setBookingLoading(true);
        try {
            // NOTE: For MVP/Demo, user needs to manually input provider ID or we'd fetch list.
            // Since we don't have a UI for selecting providers yet, we'll assume the user knows one 
            // or we're just testing the flow. 
            // Ideally: Fetch providers -> Select Provider -> Select Time.

            await api.createAppointment({
                provider_id: providerId,
                start_time: new Date(startTime).toISOString(),
                end_time: new Date(endTime).toISOString(),
                notes
            });
            setBookingOpen(false);
            loadAppointments();
        } catch (error) {
            alert('Failed to book appointment');
            console.error(error);
        } finally {
            setBookingLoading(false);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Your Schedule</h2>
                <Button onClick={() => setBookingOpen(!bookingOpen)}>
                    <Plus className="mr-2 h-4 w-4" /> Book Appointment
                </Button>
            </div>

            {bookingOpen && (
                <div className="p-4 border rounded-lg bg-muted/50 space-y-4">
                    <h3 className="font-semibold">New Appointment</h3>
                    <form onSubmit={handleBook} className="grid gap-4 md:grid-cols-2">
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Provider ID (UUID)</label>
                            <Input
                                value={providerId}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setProviderId(e.target.value)}
                                placeholder="e.g. 550e8400-e29b-..."
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Notes</label>
                            <Input
                                value={notes}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNotes(e.target.value)}
                                placeholder="Brief reason for visit"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">Start Time</label>
                            <Input
                                type="datetime-local"
                                value={startTime}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setStartTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium">End Time</label>
                            <Input
                                type="datetime-local"
                                value={endTime}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEndTime(e.target.value)}
                                required
                            />
                        </div>
                        <div className="md:col-span-2">
                            <Button type="submit" isLoading={bookingLoading}>Confirm Booking</Button>
                        </div>
                    </form>
                </div>
            )}

            <div className="grid gap-4">
                {appointments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                        No appointments found.
                    </div>
                ) : (
                    appointments.map((apt) => (
                        <div key={apt.id} className="flex items-center justify-between p-4 border rounded-lg bg-card">
                            <div>
                                <div className="font-medium">
                                    {new Date(apt.start_time).toLocaleString()}
                                </div>
                                <div className={`text-sm inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                  ${apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                </div>
                            </div>
                            {apt.notes && <div className="text-sm text-muted-foreground max-w-md truncate hidden md:block">{apt.notes}</div>}
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
