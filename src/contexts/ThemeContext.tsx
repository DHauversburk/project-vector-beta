import { createContext, useContext, useEffect, useState } from "react"

type Theme = "dark" | "light" | "system"

type ThemeProviderProps = {
    children: React.ReactNode
    defaultTheme?: Theme
    storageKey?: string
}

type ThemeProviderState = {
    theme: Theme
    setTheme: (theme: Theme) => void
    highContrast: boolean
    setHighContrast: (enabled: boolean) => void
}

const initialState: ThemeProviderState = {
    theme: "system",
    setTheme: () => null,
    highContrast: false,
    setHighContrast: () => null,
}

const ThemeProviderContext = createContext<ThemeProviderState>(initialState)

export function ThemeProvider({
    children,
    defaultTheme = "system",
    storageKey = "vite-ui-theme",
}: ThemeProviderProps) {
    const [theme, setTheme] = useState<Theme>(
        () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
    )

    const [highContrast, setHighContrastState] = useState<boolean>(
        () => localStorage.getItem('vite-ui-high-contrast') === 'true'
    )

    useEffect(() => {
        const root = window.document.documentElement

        root.classList.remove("light", "dark")

        if (theme === "system") {
            const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
                .matches
                ? "dark"
                : "light"

            root.classList.add(systemTheme)
            return
        }

        root.classList.add(theme)
    }, [theme])

    // Handle high contrast mode
    useEffect(() => {
        const root = window.document.documentElement

        if (highContrast) {
            root.classList.add("high-contrast")
        } else {
            root.classList.remove("high-contrast")
        }
    }, [highContrast])

    const setHighContrast = (enabled: boolean) => {
        localStorage.setItem('vite-ui-high-contrast', String(enabled))
        setHighContrastState(enabled)
    }

    const value = {
        theme,
        setTheme: (theme: Theme) => {
            localStorage.setItem(storageKey, theme)
            setTheme(theme)
        },
        highContrast,
        setHighContrast,
    }

    return (
        <ThemeProviderContext.Provider value={value}>
            {children}
        </ThemeProviderContext.Provider>
    )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useTheme = () => {
    const context = useContext(ThemeProviderContext)

    if (context === undefined)
        throw new Error("useTheme must be used within a ThemeProvider")

    return context
}

