export const SCALING_CONFIG = {
    baseWidth: 1500,
    baseHeight: 1000,
    minBoardScale: 0.2,
    padding: 80,
    minSize: 200,
}

export function computeBoardScale(width: number, height: number): number {
    const config = SCALING_CONFIG;
    const availableWidth = Math.max(width - config.padding, config.minSize);
    const availableHeight = Math.max(height - config.padding, config.minSize);
    const rawScale = Math.min(availableWidth / config.baseWidth, availableHeight / config.baseHeight);
    const clamped = Math.min(rawScale, 1);
    return Math.max(clamped, config.minBoardScale);
};