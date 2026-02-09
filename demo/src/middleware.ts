// Demo app middleware - empty (no authentication required)
// This file exists to prevent the parent directory's middleware from being used

export function middleware() {
    // No middleware logic needed for demo
    return;
}

export const config = {
    matcher: [],
};
