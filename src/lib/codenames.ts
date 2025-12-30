/**
 * Patient Codename Generator
 * 
 * Generates consistent, memorable codenames from patient IDs.
 * Uses a deterministic algorithm so the same ID always gets the same codename.
 * 
 * With ADJECTIVE + NOUN + NUMBER format (40 × 40 × 100 = 160,000+ combinations)
 */

// Adjective list (40 words)
const ADJECTIVES = [
    'ALPHA', 'BRAVE', 'CALM', 'DELTA', 'ECHO', 'FROST', 'GHOST', 'HAWK',
    'IRON', 'JADE', 'KEEN', 'LUNAR', 'MYSTIC', 'NOBLE', 'OMEGA', 'PRIME',
    'QUICK', 'RAVEN', 'SILENT', 'SWIFT', 'TITAN', 'ULTRA', 'VALOR', 'WINTER',
    'APEX', 'BOLD', 'COBALT', 'DAWN', 'EMBER', 'FORGE', 'GRANITE', 'HAVEN',
    'AZURE', 'CRIMSON', 'GOLDEN', 'SILVER', 'ONYX', 'IVORY', 'SCARLET', 'CYAN'
];

// Noun list (40 words) - 40x40x100 = 160,000 unique combinations
const NOUNS = [
    'FALCON', 'KNIGHT', 'PHOENIX', 'RANGER', 'SHADOW', 'STORM', 'THUNDER', 'VIPER',
    'WOLF', 'ARCHER', 'BLADE', 'CROWN', 'DRAGON', 'EAGLE', 'FLAME', 'GUARDIAN',
    'HUNTER', 'JAGUAR', 'LANCE', 'MUSTANG', 'NOVA', 'ORACLE', 'PANTHER', 'QUEST',
    'ROCKET', 'SABER', 'TIGER', 'VALKYRIE', 'WARRIOR', 'ZENITH', 'ATLAS', 'BARON',
    'COMET', 'DAGGER', 'ECHO', 'FURY', 'GRIFFIN', 'HERALD', 'JACKAL', 'SPHINX'
];

// Cache for generated codenames to ensure consistency
const codeNameCache = new Map<string, string>();

/**
 * Generates a deterministic hash from a string
 */
function simpleHash(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
        const char = str.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
}

/**
 * Generates a secondary hash for adjective selection
 */
function secondaryHash(str: string): number {
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) + hash) + str.charCodeAt(i);
    }
    return Math.abs(hash);
}

/**
 * Generates a tertiary hash for number selection
 */
function tertiaryHash(str: string): number {
    let hash = 31;
    for (let i = 0; i < str.length; i++) {
        hash = hash * 17 + str.charCodeAt(i);
    }
    return Math.abs(hash);
}

/**
 * Generates a memorable codename from a patient ID.
 * The same ID will always produce the same codename.
 * Uses ADJECTIVE + NOUN + NUMBER for 160,000+ unique combinations.
 * 
 * @param patientId - The patient's UUID or ID string
 * @returns A memorable codename like "IRON KNIGHT-42" or "SWIFT FALCON-07"
 */
export function generatePatientCodename(patientId: string): string {
    if (!patientId) return 'UNKNOWN';

    // Check cache first
    if (codeNameCache.has(patientId)) {
        return codeNameCache.get(patientId)!;
    }

    // Generate hashes from ID
    const hash1 = simpleHash(patientId);
    const hash2 = secondaryHash(patientId);
    const hash3 = tertiaryHash(patientId);

    // Use hashes to select adjective, noun, and number
    const adjIndex = hash1 % ADJECTIVES.length;
    const nounIndex = hash2 % NOUNS.length;
    const number = (hash3 % 100); // 00-99

    // Format number with leading zero for consistency
    const numStr = number.toString().padStart(2, '0');
    const codename = `${ADJECTIVES[adjIndex]} ${NOUNS[nounIndex]}-${numStr}`;

    // Cache and return
    codeNameCache.set(patientId, codename);
    return codename;
}

/**
 * Gets a short display ID from a patient UUID
 * @param patientId - Full UUID
 * @returns Short 4-character ID for reference
 */
export function getShortPatientId(patientId: string): string {
    if (!patientId) return '----';
    return patientId.substring(0, 4).toUpperCase();
}

/**
 * Gets both codename and short ID for display
 * @param patientId - Full UUID
 * @returns Object with codename and shortId
 */
export function getPatientDisplayInfo(patientId: string): { codename: string; shortId: string } {
    return {
        codename: generatePatientCodename(patientId),
        shortId: getShortPatientId(patientId)
    };
}
