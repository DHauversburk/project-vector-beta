/**
 * WebAuthn Utility for Project Vector
 * Implements native biometric session locking using the Web Authentication API.
 */

export const webauthn = {
    /**
     * Check if WebAuthn is supported and available on this device.
     */
    isSupported: async (): Promise<boolean> => {
        return (
            window.PublicKeyCredential !== undefined &&
            typeof window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable === 'function' &&
            await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
        );
    },

    /**
     * Register a new biometric credential (Passkey)
     */
    register: async (username: string): Promise<boolean> => {
        try {
            const challenge = crypto.getRandomValues(new Uint8Array(32));
            const userId = crypto.getRandomValues(new Uint8Array(16));

            const creationOptions: PublicKeyCredentialCreationOptions = {
                challenge,
                rp: {
                    name: "Project Vector",
                    id: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
                },
                user: {
                    id: userId,
                    name: username,
                    displayName: username,
                },
                pubKeyCredParams: [{ alg: -7, type: "public-key" }, { alg: -257, type: "public-key" }],
                authenticatorSelection: {
                    authenticatorAttachment: "platform",
                    userVerification: "required",
                    residentKey: "required",
                },
                timeout: 60000,
                attestation: "none",
            };

            const credential = await navigator.credentials.create({
                publicKey: creationOptions,
            });

            if (credential) {
                // In a real app, we would send 'credential' to the server for verification.
                // For this PoC, we store a 'locked' flag in localStorage to simulate enrollment.
                localStorage.setItem('vector_biometric_enrolled', 'true');
                return true;
            }
            return false;
        } catch (error) {
            console.error("Biometric registration failed", error);
            return false;
        }
    },

    /**
     * Authenticate using biometrics
     */
    authenticate: async (): Promise<boolean> => {
        try {
            const challenge = crypto.getRandomValues(new Uint8Array(32));

            const assertionOptions: PublicKeyCredentialRequestOptions = {
                challenge,
                timeout: 60000,
                userVerification: "required",
                rpId: window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname,
            };

            const assertion = await navigator.credentials.get({
                publicKey: assertionOptions,
            });

            return !!assertion;
        } catch (error) {
            console.error("Biometric authentication failed", error);
            return false;
        }
    }
};
