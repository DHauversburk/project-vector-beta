import { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { QrCode, Printer, RefreshCw, Copy, Check } from 'lucide-react';

type ServiceType = 'PT_BLUE' | 'MH_GREEN' | 'PCM_RED' | 'OPT_YELLOW';

interface TokenBatch {
    id: string;
    timestamp: Date;
    serviceType: ServiceType;
    tokens: string[];
}

export default function TokenGenerator() {
    const [serviceType, setServiceType] = useState<ServiceType>('PT_BLUE');
    const [quantity, setQuantity] = useState(12);
    const [isGenerating, setIsGenerating] = useState(false);
    const [lastBatch, setLastBatch] = useState<TokenBatch | null>(null);
    const [copiedToken, setCopiedToken] = useState<string | null>(null);

    const generateTokens = async () => {
        setIsGenerating(true);
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 800));

        const newTokens: string[] = [];
        for (let i = 0; i < quantity; i++) {
            // Generate a secure-looking random string
            const randomId = Math.random().toString(36).substring(2, 10).toUpperCase();
            newTokens.push(`${serviceType}-${randomId}`);
        }

        setLastBatch({
            id: Math.random().toString(36).substring(7),
            timestamp: new Date(),
            serviceType,
            tokens: newTokens
        });
        setIsGenerating(false);
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
        <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Control Panel */}
            <div className="bg-[#0B1121] border border-slate-800 rounded-xl p-6 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                    <QrCode className="w-32 h-32 text-cyan-500" />
                </div>

                <h2 className="text-xl font-bold text-slate-100 flex items-center gap-2 mb-6">
                    <Printer className="w-5 h-5 text-cyan-500" />
                    Token Generation Station
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-end">
                    <div className="space-y-2 relative z-10">
                        <label className="text-xs uppercase text-slate-500 font-bold tracking-wider">Service Type</label>
                        <select
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value as ServiceType)}
                            className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-slate-200 focus:ring-1 focus:ring-cyan-500 outline-none h-10"
                        >
                            <option value="PT_BLUE">Physical Therapy (BLUE)</option>
                            <option value="MH_GREEN">Mental Health (GREEN)</option>
                            <option value="PCM_RED">Primary Care (RED)</option>
                            <option value="OPT_YELLOW">Optometry (YELLOW)</option>
                        </select>
                    </div>

                    <div className="space-y-2 relative z-10">
                        <label className="text-xs uppercase text-slate-500 font-bold tracking-wider">Batch Quantity</label>
                        <Input
                            type="number"
                            min={1}
                            max={50}
                            value={quantity}
                            onChange={(e) => setQuantity(parseInt(e.target.value))}
                            className="bg-slate-950 border-slate-800 text-slate-200"
                        />
                    </div>

                    <Button
                        onClick={generateTokens}
                        isLoading={isGenerating}
                        className="w-full h-10 bg-cyan-600 hover:bg-cyan-500 text-white font-bold relative z-10"
                    >
                        {isGenerating ? 'Forging Tokens...' : 'Generate Batch'}
                    </Button>
                </div>
            </div>

            {/* Output Grid */}
            {lastBatch && (
                <div className="space-y-4">
                    <div className="flex justify-between items-center print:hidden">
                        <div className="text-sm text-slate-400">
                            Generated <span className="text-cyan-400 font-bold">{lastBatch.tokens.length}</span> tokens for {lastBatch.serviceType}
                        </div>
                        <Button variant="outline" size="sm" onClick={handlePrint} className="border-slate-700 hover:bg-slate-800 text-slate-300">
                            <Printer className="w-4 h-4 mr-2" />
                            Print Sheet
                        </Button>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 print:grid-cols-3 print:gap-8 p-1">
                        {lastBatch.tokens.map((token) => (
                            <div
                                key={token}
                                className="bg-slate-100 text-slate-900 p-4 rounded-lg flex flex-col items-center justify-between aspect-[1.58/1] shadow-lg border-2 border-slate-200 relative group overflow-hidden"
                            >
                                <div className="absolute inset-0 bg-white/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center print:hidden backdrop-blur-sm z-10">
                                    <Button size="sm" variant="ghost" className="h-8 w-8 p-0 bg-slate-200 hover:bg-slate-300 rounded-full" onClick={() => copyToClipboard(token)}>
                                        {copiedToken === token ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-600" />}
                                    </Button>
                                </div>

                                <div className="w-full flex justify-between items-start border-b border-slate-300 pb-2 mb-2">
                                    <Shield className="w-4 h-4 text-slate-400" />
                                    <span className="text-[0.6rem] uppercase tracking-wider font-bold text-slate-400">Project Vector</span>
                                </div>

                                <div className="flex-1 flex flex-col items-center justify-center w-full space-y-2">
                                    <div className="bg-slate-900 p-1 rounded">
                                        <QrCode className="w-12 h-12 text-white" />
                                    </div>
                                    <div className="font-mono font-bold text-lg tracking-wider text-slate-800">{token}</div>
                                </div>

                                <div className="w-full text-center mt-2 pt-1 border-t border-slate-300">
                                    <span className={`text-[0.65rem] uppercase font-bold px-2 py-0.5 rounded-full ${lastBatch.serviceType === 'PT_BLUE' ? 'bg-blue-100 text-blue-800' :
                                            lastBatch.serviceType === 'MH_GREEN' ? 'bg-green-100 text-green-800' :
                                                lastBatch.serviceType === 'PCM_RED' ? 'bg-red-100 text-red-800' :
                                                    'bg-yellow-100 text-yellow-800'
                                        }`}>
                                        {lastBatch.serviceType.replace('_', ' ')}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
