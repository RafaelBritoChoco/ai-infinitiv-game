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
    private lastGamma: number = 0;
    private smoothedGamma: number = 0;
    private readonly smoothingFactor: number = 0.4; // Increased for better responsiveness
    private hasTestedMotion: boolean = false;
    private motionAvailable: boolean = false;

    private constructor() {
        // Test if motion is available on this device
        this.testMotionAvailability();
    }

    /**
     * Test if motion sensors are available
     */
    private testMotionAvailability(): void {
        if (typeof window === 'undefined') return;
        
        const testHandler = (e: DeviceOrientationEvent) => {
            if (e.gamma !== null || e.beta !== null) {
                this.motionAvailable = true;
                console.log('Motion sensors detected!');
            }
            window.removeEventListener('deviceorientation', testHandler);
            this.hasTestedMotion = true;
        };
        
        window.addEventListener('deviceorientation', testHandler, { once: true });
        
        // Timeout fallback
        setTimeout(() => {
            if (!this.hasTestedMotion) {
                window.removeEventListener('deviceorientation', testHandler);
                this.hasTestedMotion = true;
                console.log('Motion sensor test timed out');
            }
        }, 1000);
    }

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
        // Check if we're in a secure context (HTTPS or localhost)
        if (typeof window !== 'undefined' && !window.isSecureContext) {
            console.warn('Motion controls require HTTPS');
            this.permissionStatus = 'denied';
            return 'denied';
        }

        // Check if DeviceOrientationEvent exists
        if (typeof DeviceOrientationEvent === 'undefined') {
            console.warn('DeviceOrientationEvent not supported');
            this.permissionStatus = 'denied';
            return 'denied';
        }

        // Check if permission API exists (iOS 13+)
        if (typeof (DeviceOrientationEvent as any).requestPermission === 'function') {
            try {
                const permission = await (DeviceOrientationEvent as any).requestPermission();
                this.permissionStatus = permission;
                console.log('iOS motion permission:', permission);
                return permission;
            } catch (error) {
                console.error('Motion permission error:', error);
                this.permissionStatus = 'denied';
                return 'denied';
            }
        } else {
            // Android or older iOS - no permission needed, assume granted
            this.permissionStatus = 'not-required';
            console.log('Motion permission not required (Android/older iOS)');
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
     * For Android, permission is auto-granted so we start immediately
     */
    startListening(callback: (event: DeviceOrientationEvent) => void): void {
        // For Android/non-iOS, we can start listening immediately
        // Permission status might still be 'prompt' but Android doesn't need permission
        const canListen = this.permissionStatus === 'granted' || 
                          this.permissionStatus === 'not-required' ||
                          this.permissionStatus === 'prompt'; // Allow prompt for Android

        if (!canListen) {
            console.warn('Motion not available or not permitted:', this.permissionStatus);
            return;
        }

        this.listeners.add(callback);
        console.log('Added motion listener, total listeners:', this.listeners.size);

        if (!this.isListening) {
            this.isListening = true;
            window.addEventListener('deviceorientation', this.handleOrientation, true);
            // Also try the absolute version for some Android devices
            window.addEventListener('deviceorientationabsolute', this.handleOrientation as any, true);
            console.log('Motion controls started - listening for deviceorientation events');
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
            window.removeEventListener('deviceorientation', this.handleOrientation, true);
            window.removeEventListener('deviceorientationabsolute', this.handleOrientation as any, true);
            console.log('Motion controls stopped');
        }
    }

    /**
     * Internal handler that distributes events to all listeners
     * Includes smoothing for better control feel
     */
    private handleOrientation = (event: DeviceOrientationEvent) => {
        // Check if we have valid data
        const rawGamma = event.gamma;
        const rawBeta = event.beta;
        
        if (rawGamma === null && rawBeta === null) {
            // No orientation data available
            return;
        }

        // Use gamma for left/right tilt (default)
        // Some devices might need beta depending on orientation
        const tiltValue = rawGamma ?? 0;
        
        // Apply smoothing to gamma value for less jittery controls
        this.smoothedGamma = this.smoothedGamma + (tiltValue - this.smoothedGamma) * this.smoothingFactor;
        this.lastGamma = this.smoothedGamma;
        
        // Create a new event-like object with smoothed values
        const smoothedEvent = {
            alpha: event.alpha,
            beta: event.beta,
            gamma: this.smoothedGamma,
            absolute: event.absolute,
            // Keep original event properties
            type: event.type,
            timeStamp: event.timeStamp
        } as DeviceOrientationEvent;
        
        this.listeners.forEach(callback => {
            try {
                callback(smoothedEvent);
            } catch (e) {
                console.error('Motion callback error:', e);
            }
        });
    }

    /**
     * Get current permission status
     */
    getPermissionStatus(): MotionPermissionStatus {
        return this.permissionStatus;
    }

    /**
     * Reset smoothing (call when starting a new game)
     */
    resetSmoothing(): void {
        this.smoothedGamma = 0;
        this.lastGamma = 0;
    }

    /**
     * Get the last smoothed gamma value
     */
    getSmoothedGamma(): number {
        return this.smoothedGamma;
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
