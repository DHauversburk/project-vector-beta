/**
 * System-wide tactical tips for loading states
 */
export const TACTICAL_TIPS = [
    "Use your 4-digit Tactical PIN for rapid dashboard access.",
    "The Offline Indicator confirms full PWA availability.",
    "Export appointments to .ics for external calendar sync.",
    "Urgent Help Requests trigger priority clinical alerts.",
    "Vector uses End-to-End Character Escaping for PHI safety.",
    "Mission Control allows providers to bulk-generate 14 days of slots.",
    "Biometric login can be enabled in the Security settings.",
    "Double-tap the system status bar for a quick theme toggle.",
    "Help requests are routed directly to your clinical team."
];

/**
 * Returns a random tactical tip
 */
export const getRandomTip = () => TACTICAL_TIPS[Math.floor(Math.random() * TACTICAL_TIPS.length)];
