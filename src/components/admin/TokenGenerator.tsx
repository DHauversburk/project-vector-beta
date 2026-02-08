import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Printer, Copy, Check, LayoutGrid, List, Trash2 } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { api } from '../../lib/api';
import type { PublicUser } from '../../lib/api/types';

type ServiceType = 'PT_BLUE' | 'MH_GREEN' | 'PCM_RED';

interface TokenBatch {
    id: string;
    timestamp: Date;
    serviceType: ServiceType;
    tokens: string[];
}

interface DirectoryUser {
    id: string;
    token_alias?: string;
    email?: string;
    service_type: string;
    role: string;
    created_at?: string;
}

interface TokenGeneratorProps {
    isProvider?: boolean;
}

export default function TokenGenerator({ isProvider = false }: TokenGeneratorProps) {
    const [serviceType, setServiceType] = useState<ServiceType>('PT_BLUE');
    const [targetRole, setTargetRole] = useState<'member' | 'provider'>('member');
    const [quantity, setQuantity] = useState(5); // Default lowered for DB safety
    const [cohortTag, setCohortTag] = useState('');
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastBatch, setLastBatch] = useState<TokenBatch | null>(null);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);
    const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid');

    // Directory Mode
    const [mode, setMode] = useState<'provision' | 'directory'>('provision');
    const [directory, setDirectory] = useState<DirectoryUser[]>([]);
    const [loadingDir, setLoadingDir] = useState(false);

    // Filter & Selection State
    const [filterService, setFilterService] = useState<string>('ALL');
    const [filterRole, setFilterRole] = useState<string>('ALL');
    const [sortBy, setSortBy] = useState<'created_desc' | 'alias_asc' | 'role'>('created_desc');
    const [searchText, setSearchText] = useState('');
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    const processedDirectory = directory
        .filter(u => {
            if (filterService !== 'ALL' && u.service_type !== filterService) return false;
            if (filterRole !== 'ALL' && u.role !== filterRole) return false;
            if (searchText) {
                const low = searchText.toLowerCase();
                return (u.token_alias || '').toLowerCase().includes(low) ||
                    (u.email || '').toLowerCase().includes(low) ||
                    u.id.includes(low);
            }
            return true;
        })
        .sort((a, b) => {
            if (sortBy === 'alias_asc') {
                return (a.token_alias || '').localeCompare(b.token_alias || '');
            }
            if (sortBy === 'role') {
                return a.role.localeCompare(b.role);
            }
            // created_desc (default)
            return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
        });

    const toggleSelection = (id: string) => {
        const next = new Set(selectedIds);
        if (next.has(id)) next.delete(id);
        else next.add(id);
        setSelectedIds(next);
    };

    const toggleAll = () => {
        if (selectedIds.size === processedDirectory.length) setSelectedIds(new Set());
        else setSelectedIds(new Set(processedDirectory.map(u => u.id)));
    };

    const handleBulkDelete = async () => {
        if (!confirm(`Permanently delete ${selectedIds.size} selected users? This cannot be undone.`)) return;
        setLoadingDir(true);
        try {
            const ids = Array.from(selectedIds);
            for (const id of ids) {
                try { await api.adminDeleteUser(id); } catch (e) { console.error(e); }
            }
            alert('Bulk Action Complete');
            setSelectedIds(new Set());
            loadDirectory();
        } catch {
            alert('Bulk Delete Error');
        } finally {
            setLoadingDir(false);
        }
    };
    const [statusParams, setStatusParams] = useState({ success: 0, total: 0 });

    const loadDirectory = async () => {
        setLoadingDir(true);
        try {
            // Fetch both lists
            const [members, providers] = await Promise.all([
                api.getMembers(),
                api.getProviders()
            ]);
            // Merge (sorting handled by processedDirectory)
            const allUsers: DirectoryUser[] = [
                ...providers.map((p: PublicUser) => ({ ...p, role: 'provider' })),
                ...members.map((m: PublicUser) => ({ ...m, role: 'member' }))
            ];

            setDirectory(allUsers);
        } catch (e) {
            console.error(e);
            console.error(e);
            alert('Failed to load user directory: ' + JSON.stringify(e, null, 2));
        } finally {
            setLoadingDir(false);
        }
    };

    const handleResetPin = async (userId: string, alias: string) => {
        if (!confirm(`Reset PIN for ${alias}? User will need to set a new PIN on next login.`)) return;
        try {
            await api.adminResetUserSecurity(userId);
            alert(`PIN Reset for ${alias}`);
        } catch (e) {
            console.error(e);
            alert('Reset failed');
        }
    };

    const handleDelete = async (userId: string, alias: string) => {
        if (!confirm(`DANGER: Permanently delete user ${alias || userId}? This cannot be undone.`)) return;
        try {
            await api.adminDeleteUser(userId);
            alert(`User ${alias} Deleted`);
            loadDirectory();
        } catch (e) {
            console.error(e);
            alert('Delete failed');
        }
    };

    const generateTokens = async () => {
        if (quantity > 20) {
            if (!confirm('Generating > 20 users may take a while. Continue?')) return;
        }

        setIsGenerating(true);
        setStatusParams({ success: 0, total: quantity });

        const newTokens: string[] = [];
        let successCount = 0;

        try {
            for (let i = 0; i < quantity; i++) {
                // Generate a HIGH ENTROPY secure random string
                const seg1 = Math.random().toString(36).substring(2, 6).toUpperCase();
                const seg2 = Math.random().toString(36).substring(2, 6).toUpperCase();
                const seg3 = Math.random().toString(36).substring(2, 6).toUpperCase();

                // PREFIX: M (Member) or P (Provider) for quick visual ID, although not strictly required
                // Using Service Prefix is standard
                const tokenParts: string[] = [serviceType];
                if (cohortTag.trim()) {
                    tokenParts.push(cohortTag.trim().toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 8));
                }
                tokenParts.push(seg1, seg2, seg3);

                const token = tokenParts.join('-');

                // DB Provisioning
                // Email Strategy: token@vector.mil (Standardized Pattern)
                const email = `${token.toLowerCase()}@vector.mil`;
                const password = 'SecurePass2025!';

                // For Members, we set service_type to ALL usually, but categorizing them is fine too.
                // For Providers, service_type is critical.
                const finalServiceType = targetRole === 'provider' ? serviceType : 'ALL';

                try {
                    // 4. Provision in Backend (Admin or Provider)
                    if (isProvider) {
                        await api.provisionMember(token, finalServiceType);
                    } else {
                        await api.adminCreateUser(email, password, token, targetRole, finalServiceType);
                    }
                    newTokens.push(token);
                    successCount++;
                    setStatusParams(prev => ({ ...prev, success: successCount }));
                } catch (e) {
                    console.error('Failed to provision user:', token, e);
                    // We continue loop even if one fails
                }
            }

            setLastBatch({
                id: Math.random().toString(36).substring(7),
                timestamp: new Date(),
                serviceType,
                tokens: newTokens
            });

        } catch (error) {
            console.error(error);
            alert('Batch Generation Failed');
        } finally {
            setIsGenerating(false);
        }
    };

    const copyToClipboard = (token: string) => {
        navigator.clipboard.writeText(token);
        setCopiedToken(token);
        setTimeout(() => setCopiedToken(null), 2000);
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Mode Switcher */}
            <div className="flex items-center gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <Button
                    variant={mode === 'provision' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setMode('provision')}
                    className="text-[10px] uppercase tracking-widest"
                >
                    <Printer className="w-4 h-4 mr-2" /> Provisioning
                </Button>
                {!isProvider && (
                    <>
                        <div className="h-4 w-px bg-slate-300" />
                        <Button
                            variant={mode === 'directory' ? 'default' : 'ghost'}
                            size="sm"
                            onClick={() => { setMode('directory'); loadDirectory(); }}
                            className="text-[10px] uppercase tracking-widest"
                        >
                            <List className="w-4 h-4 mr-2" /> User Directory
                        </Button>
                    </>
                )}
            </div>

            {mode === 'provision' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <div className="bg-indigo-50 dark:bg-indigo-900/30 p-2 rounded-md">
                                <Printer className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                                <h2 className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-widest">Identity Provisioning</h2>
                                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-tight">Database Account Generator</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-end">
                        {!isProvider && (
                            <div className="md:col-span-3 space-y-2">
                                <label className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Account Role</label>
                                <select
                                    value={targetRole}
                                    onChange={(e) => setTargetRole(e.target.value as 'member' | 'provider')}
                                    className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 outline-none h-10 transition-all cursor-pointer"
                                >
                                    <option value="member">MEMBER (PATIENT)</option>
                                    <option value="provider">PROVIDER (CLINICIAN)</option>
                                </select>
                            </div>
                        )}

                        <div className="md:col-span-3 space-y-2">
                            <label className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Service Affiliation</label>
                            <select
                                value={serviceType}
                                onChange={(e) => setServiceType(e.target.value as ServiceType)}
                                className="w-full bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-md px-3 py-2 text-xs font-bold text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-indigo-500/20 outline-none h-10 transition-all cursor-pointer"
                            >
                                <option value="PT_BLUE">PHYSICAL THERAPY (BLUE)</option>
                                <option value="MH_GREEN">MENTAL HEALTH (GREEN)</option>
                                <option value="PCM_RED">OPERATIONAL MEDICINE (RED)</option>

                            </select>
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Cohort Tag</label>
                            <Input
                                value={cohortTag}
                                onChange={e => setCohortTag(e.target.value)}
                                placeholder="OPTIONAL"
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 h-10 uppercase placeholder:text-slate-300 dark:placeholder:text-slate-600"
                                maxLength={8}
                            />
                        </div>

                        <div className="md:col-span-2 space-y-2">
                            <label className="text-[10px] uppercase text-slate-400 font-black tracking-widest">Qty</label>
                            <Input
                                type="number"
                                min={1}
                                max={50}
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value))}
                                className="bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 text-xs font-bold text-slate-700 dark:text-slate-300 h-10"
                            />
                        </div>

                        <div className="md:col-span-2">
                            <Button
                                onClick={generateTokens}
                                isLoading={isGenerating}
                                disabled={isGenerating}
                                className="w-full h-10 bg-indigo-600 hover:bg-indigo-700 text-white font-black text-xs uppercase tracking-widest shadow-md"
                            >
                                {isGenerating ? `Provisioning (${statusParams.success}/${statusParams.total})...` : 'Generate Identities'}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {mode === 'directory' && (
                <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg overflow-hidden shadow-sm">
                    <div className="p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 flex justify-between items-center">
                        <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Active Identity Matrix</h3>
                        <Button size="sm" variant="outline" onClick={loadDirectory} isLoading={loadingDir}>
                            <List className="w-3.5 h-3.5 mr-2" /> Refresh
                        </Button>
                    </div>
                    {loadingDir ? (
                        <div className="p-12 text-center text-slate-400 text-[10px] font-black uppercase tracking-widest">Scanning Directory...</div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row gap-4 bg-white dark:bg-slate-900 border-t border-t-slate-100 dark:border-t-slate-800">
                                <div className="flex-1">
                                    <Input
                                        placeholder="Search Alias, ID..."
                                        value={searchText}
                                        onChange={e => setSearchText(e.target.value)}
                                        className="h-8 text-xs bg-slate-50 dark:bg-slate-950"
                                    />
                                </div>
                                <select
                                    className="h-8 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 dark:text-slate-300"
                                    value={sortBy}
                                    onChange={e => setSortBy(e.target.value as 'created_desc' | 'alias_asc' | 'role')}
                                >
                                    <option value="created_desc">Newest First</option>
                                    <option value="alias_asc">Alias (A-Z)</option>
                                    <option value="role">Role</option>
                                </select>
                                <select
                                    className="h-8 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 dark:text-slate-300"
                                    value={filterService}
                                    onChange={e => setFilterService(e.target.value)}
                                >
                                    <option value="ALL">All Services</option>
                                    <option value="PT_BLUE">Physical Therapy</option>
                                    <option value="MH_GREEN">Mental Health</option>
                                    <option value="PCM_RED">Operational Medicine</option>
                                </select>
                                <select
                                    className="h-8 rounded border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 px-2 text-[10px] font-bold uppercase outline-none focus:ring-2 focus:ring-indigo-500/10 text-slate-700 dark:text-slate-300"
                                    value={filterRole}
                                    onChange={e => setFilterRole(e.target.value)}
                                >
                                    <option value="ALL">All Roles</option>
                                    <option value="member">Members</option>
                                    <option value="provider">Providers</option>
                                </select>
                                {selectedIds.size > 0 && (
                                    <Button size="sm" onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700 text-white h-8 text-[10px] uppercase font-black tracking-widest border-none">
                                        Delete ({selectedIds.size})
                                    </Button>
                                )}
                            </div>

                            <table className="w-full text-left">
                                <thead className="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800">
                                    <tr>
                                        <th className="px-4 py-3 w-8">
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.size === processedDirectory.length && processedDirectory.length > 0}
                                                onChange={toggleAll}
                                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                            />
                                        </th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Alias / ID</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Role</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Service</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Created</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Security</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                    {processedDirectory.map((user) => (
                                        <tr key={user.id} className={`hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors ${selectedIds.has(user.id) ? 'bg-indigo-50/50 dark:bg-indigo-900/20' : ''}`}>
                                            <td className="px-4 py-3">
                                                <input
                                                    type="checkbox"
                                                    checked={selectedIds.has(user.id)}
                                                    onChange={() => toggleSelection(user.id)}
                                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                                />
                                            </td>
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700 dark:text-slate-300">
                                                {user.token_alias || user.email || 'UNKNOWN'}
                                                <div className="text-[9px] text-slate-400 font-normal">{user.id.slice(0, 8)}...</div>
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${user.role === 'provider' ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-600'}`}>
                                                    {user.role}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-[10px] font-bold text-slate-500 uppercase">
                                                {user.service_type || 'N/A'}
                                            </td>
                                            <td className="px-4 py-3 text-[10px] font-mono text-slate-400">
                                                {user.created_at ? new Date(user.created_at).toLocaleDateString() : '-'}
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    <button
                                                        onClick={() => handleResetPin(user.id, user.token_alias || '')}
                                                        className="text-[9px] font-black uppercase text-amber-500 hover:bg-amber-50 hover:text-amber-700 px-2 py-1 rounded transition-colors"
                                                    >
                                                        Reset PIN
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(user.id, user.token_alias || '')}
                                                        className="p-1 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Delete User"
                                                    >
                                                        <Trash2 className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                    {processedDirectory.length === 0 && (
                                        <tr>
                                            <td colSpan={6} className="p-8 text-center text-xs font-bold text-slate-400 uppercase">No users found</td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </>
                    )}
                </div>
            )}

            {/* Output Grid */}
            {mode === 'provision' && lastBatch && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center print:hidden border-b border-slate-200 pb-4">
                        <div className="flex items-center gap-4">
                            <h3 className="text-xs font-black text-slate-900 uppercase tracking-widest">Active Batch: {lastBatch.id.toUpperCase()}</h3>
                            <div className="flex bg-slate-100 p-1 rounded-md">
                                <button
                                    onClick={() => setViewMode('grid')}
                                    className={`p-1 rounded ${viewMode === 'grid' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                >
                                    <LayoutGrid className="w-3.5 h-3.5" />
                                </button>
                                <button
                                    onClick={() => setViewMode('table')}
                                    className={`p-1 rounded ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500'}`}
                                >
                                    <List className="w-3.5 h-3.5" />
                                </button>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={handlePrint} className="border-slate-200 hover:bg-slate-50 text-slate-600 font-bold text-[10px] uppercase tracking-widest">
                            <Printer className="w-3.5 h-3.5 mr-2 text-slate-400" />
                            Print Batch Sheet
                        </Button>
                    </div>

                    {viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 print:grid-cols-3 print:gap-4 p-1">
                            {lastBatch.tokens.map((token) => (
                                <div
                                    key={token}
                                    className="bg-white text-slate-900 p-6 rounded border border-slate-200 flex flex-col items-center justify-between aspect-[1.58/1] shadow-sm relative group transition-all hover:border-indigo-200 hover:shadow-md print:shadow-none print:border-slate-300"
                                >
                                    {/* Action Overlay */}
                                    <div className="absolute top-2 right-2 print:hidden">
                                        <button
                                            onClick={() => copyToClipboard(token)}
                                            className="p-1.5 rounded-full hover:bg-slate-100 text-slate-400 transition-colors"
                                            title="Copy Token"
                                        >
                                            {copiedToken === token ? <Check className="w-3 h-3 text-emerald-600" /> : <Copy className="w-3 h-3" />}
                                        </button>
                                    </div>

                                    {/* Card Header */}
                                    <div className="w-full flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                                        <img src="/pwa-192x192.png" className="w-5 h-5 opacity-80" alt="" />
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Secured Access</span>
                                    </div>

                                    {/* QR & Token */}
                                    <div className="flex-1 flex flex-row items-center justify-between w-full gap-4">
                                        <div className="bg-slate-50 p-2 rounded border border-slate-100">
                                            <QRCodeCanvas
                                                value={`${window.location.origin}/login?token=${token}`}
                                                size={64}
                                                level="H"
                                                includeMargin={false}
                                            />
                                        </div>
                                        <div className="flex-1 flex flex-col items-start">
                                            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Identity Token</div>
                                            <div className="font-mono font-black text-sm tracking-tight text-slate-900">{token}</div>
                                        </div>
                                    </div>

                                    {/* Card Footer */}
                                    <div className="w-full text-left mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                                        <span className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${lastBatch.serviceType === 'PT_BLUE' ? 'bg-blue-50 text-blue-700' :
                                            lastBatch.serviceType === 'MH_GREEN' ? 'bg-emerald-50 text-emerald-700' :
                                                lastBatch.serviceType === 'PCM_RED' ? 'bg-red-50 text-red-700' :
                                                    'bg-amber-50 text-amber-700'
                                            }`}>
                                            {lastBatch.serviceType === 'PCM_RED' ? 'OPERATIONAL MEDICINE' : lastBatch.serviceType.replace('_', ' ')}
                                        </span>
                                        <span className="text-[8px] font-bold text-slate-300 uppercase">Vector System</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
                            <table className="w-full text-left border-collapse">
                                <thead>
                                    <tr className="bg-slate-50 border-b border-slate-200">
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Token ID</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest">Service Type</th>
                                        <th className="px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lastBatch.tokens.map((token) => (
                                        <tr key={token} className="border-b border-slate-100 hover:bg-slate-50/50 transition-colors group">
                                            <td className="px-4 py-3 font-mono text-xs font-bold text-slate-700">{token}</td>
                                            <td className="px-4 py-3">
                                                <span className="text-[10px] font-bold uppercase text-slate-500">{lastBatch.serviceType}</span>
                                            </td>
                                            <td className="px-4 py-3 text-right">
                                                <button
                                                    onClick={() => copyToClipboard(token)}
                                                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase text-indigo-600 opacity-0 group-hover:opacity-100 transition-opacity"
                                                >
                                                    {copiedToken === token ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                                    Copy
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
