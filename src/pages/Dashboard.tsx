import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/Button';
import MemberDashboard from './MemberDashboard';
import ProviderDashboard from './ProviderDashboard';

export default function Dashboard() {
    const { user, role, signOut } = useAuth();

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b">
                <div className="flex h-16 items-center px-4 md:px-8">
                    <h1 className="text-lg font-semibold">Project Vector</h1>
                    <div className="ml-auto flex items-center space-x-4">
                        <span className="text-sm text-muted-foreground">{user?.email} ({role})</span>
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
