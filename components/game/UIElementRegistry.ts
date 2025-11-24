// UI Element Registry - Tracks all editable UI elements
export interface UIElement {
    id: string;
    type: 'button' | 'text' | 'image' | 'container';
    position: { x: number; y: number };
    size: { width: number; height: number };
    properties: {
        text?: string;
        color?: string;
        fontSize?: number;
        backgroundColor?: string;
        borderColor?: string;
        [key: string]: any;
    };
    parent?: string;
    children?: string[];
}

class UIElementRegistry {
    private elements: Map<string, UIElement> = new Map();
    private selectedId: string | null = null;

    // Register a new element
    register(element: UIElement) {
        this.elements.set(element.id, element);
    }

    // Get element by ID
    get(id: string): UIElement | undefined {
        return this.elements.get(id);
    }

    // Get all elements
    getAll(): UIElement[] {
        return Array.from(this.elements.values());
    }

    // Update element position
    updatePosition(id: string, x: number, y: number) {
        const element = this.elements.get(id);
        if (element) {
            element.position = { x, y };
        }
    }

    // Update element size
    updateSize(id: string, width: number, height: number) {
        const element = this.elements.get(id);
        if (element) {
            element.size = { width, height };
        }
    }

    // Update element properties
    updateProperty(id: string, key: string, value: any) {
        const element = this.elements.get(id);
        if (element) {
            element.properties[key] = value;
        }
    }

    // Selection
    select(id: string) {
        this.selectedId = id;
    }

    getSelected(): UIElement | null {
        return this.selectedId ? this.elements.get(this.selectedId) || null : null;
    }

    clearSelection() {
        this.selectedId = null;
    }

    // Save to localStorage
    save() {
        const data = Array.from(this.elements.values());
        localStorage.setItem('NEON_UI_ELEMENTS', JSON.stringify(data));
    }

    // Load from localStorage
    load() {
        const data = localStorage.getItem('NEON_UI_ELEMENTS');
        if (data) {
            const elements: UIElement[] = JSON.parse(data);
            this.elements.clear();
            elements.forEach(el => this.register(el));
        }
    }

    // Clear all
    clear() {
        this.elements.clear();
        this.selectedId = null;
    }
}

// Singleton instance
export const uiRegistry = new UIElementRegistry();
