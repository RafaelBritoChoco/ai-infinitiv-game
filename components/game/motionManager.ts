/**
 * Unified Motion Control Manager
 * Single source of truth for device motion/orientation
 * Prevents code duplication and conflicts
 */

type MotionPermissionStatus = 'granted' | 'denied' | 'prompt' | 'not-required';

class MotionControlManager {
    private static instance: MotionControlManager;
    private permissionStatus: MotionPermissionStatus = 'prompt';
    private isListening: boolean = false;
    private listeners: Set<(event: DeviceOrientationEvent) => void> = new Set();

    private constructor() { }

    static getInstance(): MotionControlManager {
        if (!MotionControlManager.instance) {
            MotionControlManager.instance = new MotionControlManager();
        }
        return MotionControlManager.instance;
    }

    /**
     * Request permission if needed (iOS 13+)
     * Returns permission status
     */
    async requestPermission(): Promise<MotionPermissionStatus> {
        // Check if permission API exists (iOS 13+)
        if (typeof DeviceOrientationEvent !== 'undefined' &&
            typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission();
                this.permissionStatus = permission;
                return permission;
            } catch (error) {
                console.error('Motion permission error:', error);
                this.permissionStatus = 'denied';
                return 'denied';
            }
        } else {
            // Android or older iOS - no permission needed
            this.permissionStatus = 'not-required';
            return 'not-required';
        }
    }

    /**
     * Check if motion is available and permitted
     */
    isAvailable(): boolean {
        return this.permissionStatus === 'granted' || this.permissionStatus === 'not-required';
    }

    /**
     * Start listening to device orientation
     */
    startListening(callback: (event: DeviceOrientationEvent) => void): void {
        if (!this.isAvailable()) {
            console.warn('Motion not available or not permitted');
            return;
        }

        this.listeners.add(callback);

        if (!this.isListening) {
            this.isListening = true;
            window.addEventListener('deviceorientation', this.handleOrientation);
            console.log('Motion controls started');
        }
    }

    /**
     * Stop listening to device orientation
     */
    stopListening(callback?: (event: DeviceOrientationEvent) => void): void {
        if (callback) {
            this.listeners.delete(callback);
        } else {
            this.listeners.clear();
        }

        if (this.listeners.size === 0 && this.isListening) {
            this.isListening = false;
            window.removeEventListener('deviceorientation', this.handleOrientation);
            console.log('Motion controls stopped');
        }
    }

    /**
     * Internal handler that distributes events to all listeners
     */
    private handleOrientation = (event: DeviceOrientationEvent) => {
        this.listeners.forEach(callback => callback(event));
    }

    /**
     * Get current permission status
     */
    getPermissionStatus(): MotionPermissionStatus {
        return this.permissionStatus;
    }

    /**
     * Show permission dialog with user-friendly message
     */
    async requestWithUI(): Promise<boolean> {
        const status = await this.requestPermission();

        if (status === 'denied') {
            alert('⚠️ Motion controls disabled.\n\nPlease enable sensors in your browser settings and reload the page.');
            return false;
        }

        if (status === 'granted' || status === 'not-required') {
            return true;
        }

        return false;
    }
}

export const motionManager = MotionControlManager.getInstance();
