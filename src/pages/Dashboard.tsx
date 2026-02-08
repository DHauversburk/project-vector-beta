/**
 * Dashboard - Terminal entry point for authenticated users
 * 
 * @component
 * @description Serves as the primary switchboard for the application's authenticated experience.
 * It detects the user's operational role and deploys the corresponding operational environment:
 * - Admin: Mission Control (AdminDashboard)
 * - Provider: Clinical Node (ProviderDashboard)
 * - Member: Patient Portal (MemberDashboard)
 * 
 * @returns {JSX.Element} The active dashboard based on user role
 */
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
