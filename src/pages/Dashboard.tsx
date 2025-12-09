import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import MemberDashboard from './MemberDashboard';
import ProviderDashboard from './ProviderDashboard';
import AdminDashboard from './AdminDashboard';
import { ModeToggle } from '../components/ModeToggle';

export default function Dashboard() {
    const { user, role, signOut } = useAuth();

    // Admin has a completely separate layout (Mission Control)
    if (role === 'admin') {
        return <AdminDashboard />;
    }

    return (
        <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <header className="border-b">
                <div className="flex h-16 items-center px-4 md:px-8">
                    <h1 className="text-lg font-semibold">Project Vector</h1>
                    <div className="ml-auto flex items-center space-x-4">
                        <ModeToggle />
                        <span className="text-sm text-muted-foreground hidden md:inline-block">{user?.email} ({role})</span>
                        <Button onClick={signOut} variant="outline" size="sm">
                            Sign Out
                        </Button>
                    </div>
                </div>
            </header>
            <main className="p-4 md:p-8">
                {role === 'provider' ? <ProviderDashboard /> : <MemberDashboard />}
            </main>
        </div>
    );
}
