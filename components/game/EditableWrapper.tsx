import React, { useRef, useEffect } from 'react';
import { uiRegistry } from './UIElementRegistry';

interface EditableWrapperProps {
    id: string;
    type: 'button' | 'text' | 'image' | 'container';
    isEditorActive: boolean;
    children: React.ReactNode;
    className?: string;
    style?: React.CSSProperties;
}

export const EditableWrapper: React.FC<EditableWrapperProps> = ({
    id,
    type,
    isEditorActive,
    children,
    className = '',
    style = {}
}) => {
    const ref = useRef<HTMLDivElement>(null);
    const [isSelected, setIsSelected] = React.useState(false);

    useEffect(() => {
        if (!isEditorActive) return;

        // Register element on mount
        if (ref.current) {
            const rect = ref.current.getBoundingClientRect();
            uiRegistry.register({
                id,
                type,
                position: { x: rect.left, y: rect.top },
                size: { width: rect.width, height: rect.height },
                properties: {},
            });
        }

        // Check if selected
        const checkSelection = () => {
            const selected = uiRegistry.getSelected();
            setIsSelected(selected?.id === id);
        };

        const interval = setInterval(checkSelection, 100);
        return () => clearInterval(interval);
    }, [id, type, isEditorActive]);

    const handleClick = (e: React.MouseEvent) => {
        if (isEditorActive) {
            e.stopPropagation();
            uiRegistry.select(id);
            setIsSelected(true);
        }
    };

    // Apply custom position from registry if exists
    const element = uiRegistry.get(id);
    const customStyle = element ? {
        position: 'absolute' as const,
        left: `${element.position.x}px`,
        top: `${element.position.y}px`,
        width: `${element.size.width}px`,
        height: `${element.size.height}px`,
    } : {};

    const finalStyle = {
        ...style,
        ...(isEditorActive && element ? customStyle : {}),
        ...(isSelected ? {
            outline: '2px solid #3b82f6',
            outlineOffset: '2px',
            cursor: 'move'
        } : {})
    };

    return (
        <div
            ref={ref}
            data-ui-element-id={id}
            className={className}
            style={finalStyle}
            onClick={handleClick}
        >
            {children}
        </div>
    );
};
