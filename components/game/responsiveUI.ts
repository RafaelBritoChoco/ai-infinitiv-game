/**
 * Responsive UI Scaling System
 * Automatically adjusts UI sizes based on device viewport
 * Uses CSS custom properties for consistent scaling
 */

export const initResponsiveUI = () => {
    const updateUIScale = () => {
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Calculate base scale factor (1 = desktop, <1 = mobile)
        const baseScale = Math.min(vw / 1920, 1); // Reference: 1920px desktop

        // Icon sizes (in rem units for better scaling)
        const iconSizeSmall = Math.max(0.875, baseScale * 1.25); // min 14px
        const iconSizeMedium = Math.max(1.25, baseScale * 1.75); // min 20px
        const iconSizeLarge = Math.max(1.75, baseScale * 2.5);   // min 28px

        // Touch target sizes (at least 44x44px for mobile usability)
        const touchTargetMin = Math.max(44, vw * 0.08); // 8% of viewport width

        // Font sizes
        const fontSizeBase = Math.max(14, vw * 0.012);  // min 14px
        const fontSizeSmall = fontSizeBase * 0.875;
        const fontSizeLarge = fontSizeBase * 1.25;
        const fontSizeXLarge = fontSizeBase * 1.75;

        // Spacing
        const spacingBase = Math.max(8, vw * 0.008);    // min 8px
        const spacingSmall = spacingBase * 0.5;
        const spacingMedium = spacingBase * 1.5;
        const spacingLarge = spacingBase * 2.5;

        // UI element sizes
        const buttonHeight = Math.max(44, vh * 0.065);   // min 44px (touch target)
        const modalWidth = Math.min(600, vw * 0.9);      // max 600px, or 90% viewport
        const sidebarWidth = Math.min(320, vw * 0.35);   // max 320px, or 35% viewport

        // Apply to CSS custom properties
        const root = document.documentElement;
        root.style.setProperty('--ui-scale', baseScale.toString());
        root.style.setProperty('--icon-sm', `${iconSizeSmall}rem`);
        root.style.setProperty('--icon-md', `${iconSizeMedium}rem`);
        root.style.setProperty('--icon-lg', `${iconSizeLarge}rem`);
        root.style.setProperty('--touch-target', `${touchTargetMin}px`);
        root.style.setProperty('--font-base', `${fontSizeBase}px`);
        root.style.setProperty('--font-sm', `${fontSizeSmall}px`);
        root.style.setProperty('--font-lg', `${fontSizeLarge}px`);
        root.style.setProperty('--font-xl', `${fontSizeXLarge}px`);
        root.style.setProperty('--spacing-base', `${spacingBase}px`);
        root.style.setProperty('--spacing-sm', `${spacingSmall}px`);
        root.style.setProperty('--spacing-md', `${spacingMedium}px`);
        root.style.setProperty('--spacing-lg', `${spacingLarge}px`);
        root.style.setProperty('--button-height', `${buttonHeight}px`);
        root.style.setProperty('--modal-width', `${modalWidth}px`);
        root.style.setProperty('--sidebar-width', `${sidebarWidth}px`);

        // Device class for specific adjustments
        if (vw < 640) {
            root.classList.add('device-mobile');
            root.classList.remove('device-tablet', 'device-desktop');
        } else if (vw < 1024) {
            root.classList.add('device-tablet');
            root.classList.remove('device-mobile', 'device-desktop');
        } else {
            root.classList.add('device-desktop');
            root.classList.remove('device-mobile', 'device-tablet');
        }
    };

    // Initial calculation
    updateUIScale();

    // Update on resize/orientation change
    window.addEventListener('resize', updateUIScale);
    window.addEventListener('orientationchange', updateUIScale);

    // Cleanup function
    return () => {
        window.removeEventListener('resize', updateUIScale);
        window.removeEventListener('orientationchange', updateUIScale);
    };
};
