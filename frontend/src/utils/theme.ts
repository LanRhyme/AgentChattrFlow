export type ThemeMode = 'light' | 'dark' | 'system';
export type ThemeColor = 'green' | 'blue' | 'purple' | 'rose';
export type PaletteStyle = 'tonal_spot' | 'vibrant' | 'expressive' | 'neutral';

export const VALID_THEME_COLORS: ThemeColor[] = ['green', 'blue', 'purple', 'rose'];
export const VALID_PALETTE_STYLES: PaletteStyle[] = ['tonal_spot', 'vibrant', 'expressive', 'neutral'];
export const VALID_THEMES: ThemeMode[] = ['light', 'dark', 'system'];

export function applyThemeToDOM(theme: ThemeMode, themeColor: ThemeColor, paletteStyle: PaletteStyle): void {
    const root = document.documentElement;
    
    if (theme === 'light') {
        root.classList.add('light');
    } else if (theme === 'dark') {
        root.classList.remove('light');
    } else {
        const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (isDark) root.classList.remove('light');
        else root.classList.add('light');
    }
    
    root.setAttribute('data-theme-color', themeColor);
    root.setAttribute('data-palette-style', paletteStyle);
}

export function setupSystemThemeListener(callback: () => void): () => void {
    const media = window.matchMedia('(prefers-color-scheme: dark)');
    const listener = () => callback();
    media.addEventListener('change', listener);
    return () => media.removeEventListener('change', listener);
}
