"use client";

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface PortalProps {
    children: React.ReactNode;
}

/**
 * Portal component that renders children into document.body
 * This ensures modals are always rendered at the top level of the DOM,
 * making them appear in the center of the viewport regardless of scroll position.
 */
export const Portal: React.FC<PortalProps> = ({ children }) => {
    const [mounted, setMounted] = useState(false);
    const [container, setContainer] = useState<HTMLElement | null>(null);

    useEffect(() => {
        // Create a container element
        const portalContainer = document.createElement('div');
        portalContainer.id = 'portal-root';
        document.body.appendChild(portalContainer);

        setContainer(portalContainer);
        setMounted(true);

        return () => {
            // Clean up the container when unmounting
            if (portalContainer && document.body.contains(portalContainer)) {
                document.body.removeChild(portalContainer);
            }
        };
    }, []);

    if (!mounted || !container) {
        return null;
    }

    return createPortal(children, container);
};
