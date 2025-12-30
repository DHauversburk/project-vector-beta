import React, { useState, useMemo, useEffect } from 'react';
import { Phone, Mail, AlertTriangle, HelpCircle } from 'lucide-react';
import { Button } from '../ui/Button';

// Service types available in the system
const SERVICE_TYPES = [
    { id: 'FH', label: 'Family Health', description: 'Primary care and general medicine' },
    { id: 'MH', label: 'Mental Health', description: 'Behavioral health and counseling' },
    { id: 'PT', label: 'Physical Therapy', description: 'Rehabilitation and therapy services' },
];

// Team colors
const TEAM_COLORS = [
    { id: 'GREEN', label: 'Green Team', color: 'bg-emerald-500' },
    { id: 'BLUE', label: 'Blue Team', color: 'bg-blue-500' },
    { id: 'RED', label: 'Red Team', color: 'bg-red-500' },
    { id: 'GOLD', label: 'Gold Team', color: 'bg-amber-500' },
];

type Provider = {
    id: string;
    token_alias: string;
    service_type: string;
};

type ServiceTeamSelectorProps = {
    providers: Provider[];
    onProviderSelect: (providerId: string) => void;
    selectedProviderId: string;
};

export const ServiceTeamSelector: React.FC<ServiceTeamSelectorProps> = ({
    providers,
    onProviderSelect,
    // selectedProviderId is used for potential future highlighting
}) => {
    const [selectedService, setSelectedService] = useState<string>('');
    const [selectedTeam, setSelectedTeam] = useState<string>('');
    const [showUnknownHelp, setShowUnknownHelp] = useState(false);
    const [contactMethod, setContactMethod] = useState<'call' | 'message' | null>(null);

    // Parse provider service types to determine available teams per service
    const serviceTeamMap = useMemo(() => {
        const map: Record<string, Set<string>> = {};

        providers.forEach(provider => {
            const st = provider.service_type?.toUpperCase() || '';

            // Determine service
            let service = '';
            if (st.includes('MH') || st.includes('MENTAL')) service = 'MH';
            else if (st.includes('PT') || st.includes('PHYSICAL')) service = 'PT';
            else if (st.includes('FH') || st.includes('FAMILY') || st.includes('PRIMARY')) service = 'FH';

            if (!service) return;

            // Determine team color
            let team = '';
            if (st.includes('GREEN')) team = 'GREEN';
            else if (st.includes('BLUE')) team = 'BLUE';
            else if (st.includes('RED')) team = 'RED';
            else if (st.includes('GOLD') || st.includes('YELLOW')) team = 'GOLD';

            if (!team) return;

            if (!map[service]) map[service] = new Set();
            map[service].add(team);
        });

        return map;
    }, [providers]);

    // Get available teams for selected service
    const availableTeams = useMemo(() => {
        if (!selectedService || !serviceTeamMap[selectedService]) return [];
        return TEAM_COLORS.filter(tc => serviceTeamMap[selectedService].has(tc.id));
    }, [selectedService, serviceTeamMap]);

    // Find matching provider when service + team is selected
    useEffect(() => {
        if (!selectedService || !selectedTeam || selectedTeam === 'UNKNOWN') {
            return;
        }

        const matchingProvider = providers.find(p => {
            const st = p.service_type?.toUpperCase() || '';
            const matchesService =
                (selectedService === 'MH' && (st.includes('MH') || st.includes('MENTAL'))) ||
                (selectedService === 'PT' && (st.includes('PT') || st.includes('PHYSICAL'))) ||
                (selectedService === 'FH' && (st.includes('FH') || st.includes('FAMILY') || st.includes('PRIMARY')));

            const matchesTeam = st.includes(selectedTeam);

            return matchesService && matchesTeam;
        });

        if (matchingProvider) {
            onProviderSelect(matchingProvider.id);
        }
    }, [selectedService, selectedTeam, providers, onProviderSelect]);

    // Handle "Unknown Team" selection
    const handleUnknownTeam = () => {
        setSelectedTeam('UNKNOWN');
        setShowUnknownHelp(true);
        onProviderSelect(''); // Clear provider selection
    };

    // Close unknown help and reset
    const closeUnknownHelp = () => {
        setShowUnknownHelp(false);
        setContactMethod(null);
        setSelectedTeam('');
    };

    return (
        <div className="space-y-4">
            {/* Service Selection */}
            <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                    Select Service
                </label>
                <div className="grid grid-cols-3 gap-2">
                    {SERVICE_TYPES.map(service => {
                        const isAvailable = serviceTeamMap[service.id];
                        return (
                            <button
                                key={service.id}
                                type="button"
                                disabled={!isAvailable}
                                onClick={() => {
                                    setSelectedService(service.id);
                                    setSelectedTeam('');
                                    setShowUnknownHelp(false);
                                    onProviderSelect('');
                                }}
                                className={`p-3 rounded-lg border text-left transition-all ${selectedService === service.id
                                    ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
                                    : isAvailable
                                        ? 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-200 hover:bg-indigo-50/50'
                                        : 'bg-slate-100 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                                    }`}
                            >
                                <div className="text-xs font-black text-slate-900 dark:text-white uppercase tracking-wide">
                                    {service.label}
                                </div>
                                <div className="text-[9px] text-slate-500 mt-0.5">
                                    {isAvailable ? `${serviceTeamMap[service.id].size} team${serviceTeamMap[service.id].size > 1 ? 's' : ''} available` : 'No providers'}
                                </div>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Team Selection (only show after service selected) */}
            {selectedService && (
                <div className="space-y-1.5 animate-in slide-in-from-top-2 duration-200">
                    <label className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Select Team
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {availableTeams.map(team => (
                            <button
                                key={team.id}
                                type="button"
                                onClick={() => {
                                    setSelectedTeam(team.id);
                                    setShowUnknownHelp(false);
                                }}
                                className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${selectedTeam === team.id
                                    ? 'bg-indigo-50 dark:bg-indigo-950 border-indigo-300 dark:border-indigo-700 ring-2 ring-indigo-500/20'
                                    : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-indigo-200'
                                    }`}
                            >
                                <div className={`w-3 h-3 rounded-full ${team.color}`}></div>
                                <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                    {team.label}
                                </span>
                            </button>
                        ))}

                        {/* Unknown Team Option */}
                        <button
                            type="button"
                            onClick={handleUnknownTeam}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${selectedTeam === 'UNKNOWN'
                                ? 'bg-amber-50 dark:bg-amber-950 border-amber-300 dark:border-amber-700 ring-2 ring-amber-500/20'
                                : 'bg-slate-50 dark:bg-slate-950 border-slate-200 dark:border-slate-800 hover:border-amber-200'
                                }`}
                        >
                            <HelpCircle className="w-3 h-3 text-amber-600" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">
                                I Don't Know
                            </span>
                        </button>
                    </div>
                </div>
            )}

            {/* Unknown Team Help Panel */}
            {showUnknownHelp && (
                <div className="bg-amber-50 dark:bg-amber-950/50 border border-amber-200 dark:border-amber-800 rounded-lg p-4 space-y-4 animate-in slide-in-from-top-2 duration-200">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                        <div className="space-y-2">
                            <h4 className="text-xs font-black text-amber-800 dark:text-amber-200 uppercase tracking-wide">
                                Need Help Finding Your Team?
                            </h4>
                            <p className="text-[11px] text-amber-700 dark:text-amber-300">
                                Contact the {SERVICE_TYPES.find(s => s.id === selectedService)?.label} clinic to find out your assigned team color.
                            </p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setContactMethod('call')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${contactMethod === 'call'
                                ? 'bg-emerald-50 dark:bg-emerald-950 border-emerald-300 dark:border-emerald-700'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-emerald-200'
                                }`}
                        >
                            <Phone className="w-4 h-4 text-emerald-600" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Call Clinic</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setContactMethod('message')}
                            className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${contactMethod === 'message'
                                ? 'bg-blue-50 dark:bg-blue-950 border-blue-300 dark:border-blue-700'
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-200'
                                }`}
                        >
                            <Mail className="w-4 h-4 text-blue-600" />
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Request Callback</span>
                        </button>
                    </div>

                    {contactMethod === 'call' && (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 text-center space-y-2">
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-500">
                                {SERVICE_TYPES.find(s => s.id === selectedService)?.label} Clinic
                            </p>
                            <p className="text-lg font-black text-indigo-600">
                                (555) 123-4567
                            </p>
                            <p className="text-[9px] text-slate-400">
                                Mon-Fri 0730-1600
                            </p>
                        </div>
                    )}

                    {contactMethod === 'message' && (
                        <div className="bg-white dark:bg-slate-900 p-4 rounded-lg border border-slate-200 dark:border-slate-800 space-y-3">
                            <textarea
                                placeholder="Please contact me about my team assignment..."
                                className="w-full h-20 p-2 text-xs bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                            />
                            <div className="flex gap-2">
                                <Button size="sm" className="flex-1 text-[10px]">
                                    Request Callback
                                </Button>
                                <Button size="sm" variant="outline" className="flex-1 text-[10px]">
                                    Send Email
                                </Button>
                            </div>
                        </div>
                    )}

                    {/* Emergency Warning */}
                    <div className="bg-red-50 dark:bg-red-950/50 border border-red-200 dark:border-red-800 rounded p-3">
                        <div className="flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <div>
                                <p className="text-[10px] font-black text-red-800 dark:text-red-200 uppercase">
                                    Medical Emergency?
                                </p>
                                <p className="text-[9px] text-red-700 dark:text-red-300 mt-0.5">
                                    If this is a medical emergency, do not wait for a callback. Seek immediate medical care or call 911.
                                </p>
                            </div>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={closeUnknownHelp}
                        className="w-full text-[10px] font-bold text-slate-500 hover:text-slate-700 py-2"
                    >
                        ← Back to Team Selection
                    </button>
                </div>
            )}
        </div>
    );
};
