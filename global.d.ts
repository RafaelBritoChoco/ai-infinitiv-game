// Global type declarations for window extensions
declare global {
    interface Window {
        hideLoadingScreen?: () => void;
        __DEVICE_INFO__?: {
            isMobile: boolean;
            isIOS: boolean;
        };
    }
}

export { };
