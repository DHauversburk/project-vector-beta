// Auth actions using localStorage for tactical PINs

export const authActions = {
    /**
     * Sets a tactical PIN in local storage for a specific user.
     */
    async setTacticalPin(userId: string, pin: string): Promise<void> {
        localStorage.setItem(`TACTICAL_PIN_${userId}`, pin);
    },

    /**
     * Retrieves the tactical PIN from local storage for a specific user.
     */
    async getTacticalPin(userId: string): Promise<string | null> {
        return localStorage.getItem(`TACTICAL_PIN_${userId}`);
    }
};
