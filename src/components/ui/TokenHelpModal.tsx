/**
 * TokenHelpModal - Explains what a Clinical Identity Token is
 * 
 * @component
 * @description Modal that helps confused patients understand what their
 * token is and where to find it on their appointment card. Includes
 * visual diagram and step-by-step instructions.
 * 
 * @troubleshooting
 * - Modal not closing: Check onClose callback
 * - Animation not working: Verify CSS animate utilities
 * - Backdrop not clickable: Check z-index layering
 */

import { X, CreditCard, Phone, ArrowRight } from 'lucide-react';
import { Button } from './Button';

interface TokenHelpModalProps {
    isOpen: boolean;
    onClose: () => void;
    onContinue?: () => void;
}

export function TokenHelpModal({ isOpen, onClose, onContinue }: TokenHelpModalProps) {
    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-sm" />

            {/* Modal */}
            <div
                className="relative w-full max-w-md bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl animate-scale-in overflow-hidden"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="relative p-6 pb-4 border-b border-slate-800">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 text-slate-500 hover:text-white transition-colors rounded-lg hover:bg-slate-800"
                    >
                        <X className="w-5 h-5" />
                    </button>

                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center">
                            <CreditCard className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">Access Help</h2>
                            <p className="text-xs text-slate-400">Which login option is right for me?</p>
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                    {/* Role Explanation */}
                    <div className="space-y-4">
                        <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
                            <h3 className="text-sm font-bold text-blue-400 uppercase tracking-widest mb-1">
                                Are you a Patient?
                            </h3>
                            <p className="text-xs text-slate-300">
                                Use the <strong className="text-white">Patient Access</strong> button. You will need the "Clinical Identity Token" found on your appointment card.
                            </p>
                        </div>

                        <div className="bg-slate-800/80 rounded-lg p-4 border border-slate-700">
                            <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-1">
                                Are you Staff?
                            </h3>
                            <p className="text-xs text-slate-300">
                                Doctors, nurses, and admins should use the <strong className="text-white">Healthcare Provider</strong> button to log in with their email address.
                            </p>
                        </div>
                    </div>

                    {/* Visual Card Representation */}
                    <div className="relative bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 border border-slate-700">
                        {/* Fake Appointment Card */}
                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-500">
                                    Appointment Card
                                </span>
                                <span className="text-[10px] text-slate-600">Vector Health</span>
                            </div>

                            <div className="h-px bg-slate-700" />

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="w-16 text-slate-500">Date:</span>
                                    <span>January 28, 2026</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="w-16 text-slate-500">Time:</span>
                                    <span>2:30 PM</span>
                                </div>
                                <div className="flex items-center gap-2 text-xs text-slate-400">
                                    <span className="w-16 text-slate-500">Provider:</span>
                                    <span>Dr. Smith</span>
                                </div>
                            </div>

                            <div className="h-px bg-slate-700" />

                            {/* Token Section - Highlighted */}
                            <div className="relative">
                                <div className="absolute -inset-2 bg-blue-500/20 rounded-lg border-2 border-blue-500 border-dashed animate-pulse" />
                                <div className="relative flex items-center justify-between py-2">
                                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                                        Your Token:
                                    </span>
                                    <span className="text-lg font-black tracking-[0.15em] text-white font-mono">
                                        M-8821-X4
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Arrow pointing to token */}
                        <div className="absolute -right-2 top-[70%] flex items-center gap-1 text-blue-400 animate-bounce" style={{ animationDuration: '2s' }}>
                            <ArrowRight className="w-5 h-5 rotate-180" />
                            <span className="text-[10px] font-bold uppercase tracking-wider whitespace-nowrap">
                                Enter this!
                            </span>
                        </div>
                    </div>

                    {/* Instructions */}
                    <div className="space-y-3">
                        <h3 className="text-sm font-bold text-white uppercase tracking-wider">
                            Where to Find It:
                        </h3>
                        <ul className="space-y-2">
                            <li className="flex items-start gap-3 text-sm text-slate-300">
                                <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">1</span>
                                <span>Check your <strong className="text-white">printed appointment card</strong> from your last visit</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-300">
                                <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">2</span>
                                <span>Look in the <strong className="text-white">confirmation email</strong> you received</span>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-slate-300">
                                <span className="w-5 h-5 rounded-full bg-blue-900/50 text-blue-400 flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">3</span>
                                <span>Check any <strong className="text-white">SMS reminders</strong> from your provider</span>
                            </li>
                        </ul>
                    </div>

                    {/* Still Can't Find It */}
                    <div className="bg-slate-800/50 rounded-xl p-4 border border-slate-700">
                        <p className="text-xs text-slate-400 mb-3">
                            <strong className="text-slate-300">Still can't find your token?</strong> Contact your healthcare provider to request a new one.
                        </p>
                        <div className="flex items-center gap-2 text-xs text-blue-400">
                            <Phone className="w-3 h-3" />
                            <span>Call your provider's front desk</span>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 pt-0">
                    <Button
                        onClick={onContinue || onClose}
                        variant="gradient"
                        className="w-full"
                    >
                        I Found My Token
                    </Button>
                </div>
            </div>
        </div>
    );
}
