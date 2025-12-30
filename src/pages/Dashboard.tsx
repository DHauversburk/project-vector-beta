import { useAuth } from '../contexts/AuthContext';
import MemberDashboard from './MemberDashboard';
import ProviderDashboard from './ProviderDashboard';
import AdminDashboard from './AdminDashboard';

export default function Dashboard() {
    const { role } = useAuth();

    // Admin has a completely separate layout (Mission Control)
    if (role === 'admin') {
        return <AdminDashboard />;
    }

    return role === 'provider' ? <ProviderDashboard /> : <MemberDashboard />;
}
