import { useEffect, useState } from 'react';
import { api, type Appointment } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Loader2, Check, X, ClipboardCheck } from 'lucide-react';

export default function ProviderDashboard() {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [loading, setLoading] = useState(true);

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

    const handleStatusChange = async (id: string, status: Appointment['status']) => {
        try {
            await api.updateAppointmentStatus(id, status);
            loadAppointments(); // Refresh list
        } catch (error) {
            console.error('Failed to update status', error);
        }
    };

    if (loading) return <div className="flex justify-center p-8"><Loader2 className="animate-spin" /></div>;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold tracking-tight">Provider Schedule</h2>
            </div>

            <div className="grid gap-4">
                {appointments.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground border rounded-lg border-dashed">
                        No active appointments.
                    </div>
                ) : (
                    appointments.map((apt) => (
                        <div key={apt.id} className="flex flex-col md:flex-row md:items-center justify-between p-4 border rounded-lg bg-card gap-4">
                            <div>
                                <div className="font-medium text-lg">
                                    {new Date(apt.start_time).toLocaleString()}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                    Member ID: {apt.member_id.slice(0, 8)}...
                                </div>
                                <div className={`mt-2 text-sm inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium w-fit
                  ${apt.status === 'confirmed' ? 'bg-green-100 text-green-800' :
                                        apt.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                                            apt.status === 'completed' ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'}`}>
                                    {apt.status.charAt(0).toUpperCase() + apt.status.slice(1)}
                                </div>
                                {apt.notes && <div className="mt-2 text-sm text-muted-foreground bg-muted p-2 rounded">{apt.notes}</div>}
                            </div>

                            <div className="flex gap-2">
                                {apt.status === 'pending' && (
                                    <>
                                        <Button size="sm" onClick={() => handleStatusChange(apt.id, 'confirmed')} className="bg-green-600 hover:bg-green-700">
                                            <Check className="mr-2 h-4 w-4" /> Confirm
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => handleStatusChange(apt.id, 'cancelled')} className="text-red-600 hover:bg-red-50 hover:text-red-700">
                                            <X className="mr-2 h-4 w-4" /> Decline
                                        </Button>
                                    </>
                                )}
                                {apt.status === 'confirmed' && (
                                    <Button size="sm" onClick={() => handleStatusChange(apt.id, 'completed')} className="bg-blue-600 hover:bg-blue-700">
                                        <ClipboardCheck className="mr-2 h-4 w-4" /> Complete
                                    </Button>
                                )}
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
}
