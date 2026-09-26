/**
 * Canvas Engine - Rendering & Transformations
 * Maintained by CANVAS-ENGINE-AGENT
 */

import { CONFIG } from '../config.js';
import { drawGrid, drawDiagonals, drawDiamond, drawCustomGridOverlay } from './drawing.js';

export function getDevicePixelRatio() {
    return window.devicePixelRatio || 1;
}

export function calculateCoverDimensions(imgWidth, imgHeight, canvasWidth, canvasHeight) {
    const imageRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;
    let drawWidth, drawHeight;

    if (imageRatio > canvasRatio) {
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * imageRatio;
    } else {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imageRatio;
    }

    return {
        drawWidth,
        drawHeight,
        baseX: (canvasWidth - drawWidth) / 2,
        baseY: (canvasHeight - drawHeight) / 2
    };
}

export function calculateFitDimensions(imgWidth, imgHeight, canvasWidth, canvasHeight) {
    const imageRatio = imgWidth / imgHeight;
    const canvasRatio = canvasWidth / canvasHeight;
    let drawWidth, drawHeight;

    if (imageRatio > canvasRatio) {
        drawWidth = canvasWidth;
        drawHeight = canvasWidth / imageRatio;
    } else {
        drawHeight = canvasHeight;
        drawWidth = canvasHeight * imageRatio;
    }

    return {
        drawWidth,
        drawHeight,
        baseX: (canvasWidth - drawWidth) / 2,
        baseY: (canvasHeight - drawHeight) / 2
    };
}

export function getPixelsPerCm(format, orientation, canvasLogicalWidth, imageDpi) {
    if (format === 'original') {
        return (imageDpi || CONFIG.DEFAULT_DPI) / CONFIG.INCH_TO_CM;
    }
    const dimensions = CONFIG.PAPER_SIZES.DIMENSIONS[format];
    if (!dimensions) return (imageDpi || CONFIG.DEFAULT_DPI) / CONFIG.INCH_TO_CM;

    const [wMm, hMm] = dimensions;
    const paperWidthMm = orientation === 'landscape' ? Math.max(wMm, hMm) : Math.min(wMm, hMm);
    return canvasLogicalWidth / (paperWidthMm / 10);
}

export function getEffectiveDPI(image, format, orientation, imageDpi) {
    if (!image || !image.src || !image.complete) return CONFIG.DEFAULT_DPI;
    if (format === 'original') return imageDpi || CONFIG.DEFAULT_DPI;

    const dimensions = CONFIG.PAPER_SIZES.DIMENSIONS[format];
    if (!dimensions) return imageDpi || CONFIG.DEFAULT_DPI;

    const [wMm, hMm] = dimensions;
    const paperWmm = orientation === 'landscape' ? Math.max(wMm, hMm) : Math.min(wMm, hMm);
    const paperHmm = orientation === 'landscape' ? Math.min(wMm, hMm) : Math.max(wMm, hMm);
    const imgRatio = image.width / image.height;
    const paperRatio = paperWmm / paperHmm;

    if (imgRatio > paperRatio) {
        return image.height / (paperHmm / 10 / CONFIG.INCH_TO_CM);
    } else {
        return image.width / (paperWmm / 10 / CONFIG.INCH_TO_CM);
    }
}

export function getMaxZoom(image, format, orientation, imageDpi) {
    const effectiveDPI = getEffectiveDPI(image, format, orientation, imageDpi);
    return Math.max(1, effectiveDPI / CONFIG.MIN_QUALITY_DPI);
}

export function clampZoomCenter(zoomLevel, centerNormX, centerNormY) {
    const mx = 0.5 / zoomLevel;
    const my = 0.5 / zoomLevel;
    const clampedX = Math.max(mx, Math.min(1 - mx, centerNormX));
    const clampedY = Math.max(my, Math.min(1 - my, centerNormY));
    return { clampedX, clampedY };
}

export function computeLogicalCanvasSize(image, format, orientation) {
    if (!image || !image.src || format === 'original') {
        return {
            width: image ? image.width : 0,
            height: image ? image.height : 0
        };
    }

    const formatRatio = orientation === 'portrait'
        ? CONFIG.PAPER_SIZES.A_PORTRAIT_RATIO
        : CONFIG.PAPER_SIZES.A_LANDSCAPE_RATIO;
    const imageRatio = image.width / image.height;

    let newWidth, newHeight;
    if (imageRatio > formatRatio) {
        newWidth = image.width;
        newHeight = image.width / formatRatio;
    } else {
        newHeight = image.height;
        newWidth = image.height * formatRatio;
    }

    const landscapeHeight = imageRatio > CONFIG.PAPER_SIZES.A_LANDSCAPE_RATIO
        ? image.width / CONFIG.PAPER_SIZES.A_LANDSCAPE_RATIO
        : image.height;

    if (newHeight > landscapeHeight) {
        const scale = landscapeHeight / newHeight;
        newWidth = Math.round(newWidth * scale);
        newHeight = Math.round(landscapeHeight);
    } else {
        newWidth = Math.round(newWidth);
        newHeight = Math.round(newHeight);
    }

    return { width: newWidth, height: newHeight };
}

/**
 * Render canvas contents.
 * @param {CanvasRenderingContext2D} ctx
 * @param {HTMLCanvasElement} canvas
 * @param {Object} stateData
 * @param {Object} options { isPreview: boolean, applyZoom: boolean }
 */
export function renderCanvas(ctx, canvas, stateData, options = { isPreview: true, applyZoom: true }) {
    const {
        image,
        imageDpi,
        outputFormat,
        orientation,
        fitMode = 'cover',
        lineColor,
        drawingStack,
        isGrayscale,
        imageOffsetNormX,
        imageOffsetNormY,
        zoomLevel,
        zoomCenterNormX,
        zoomCenterNormY
    } = stateData;

    if (!image || !image.src || !image.complete) return;

    const dpr = options.isPreview ? getDevicePixelRatio() : 1;
    const logicalWidth = canvas.width / dpr;
    const logicalHeight = canvas.height / dpr;

    ctx.save();
    if (options.isPreview && dpr !== 1) {
        ctx.scale(dpr, dpr);
    }

    const dynamicLineWidth = Math.max(3, logicalWidth / 500);

    // Fill background (pure white #FFFFFF)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, logicalWidth, logicalHeight);

    const useZoom = options.applyZoom && zoomLevel > 1;
    if (useZoom) {
        const cx = zoomCenterNormX * logicalWidth;
        const cy = zoomCenterNormY * logicalHeight;
        ctx.save();
        ctx.translate(cx, cy);
        ctx.scale(zoomLevel, zoomLevel);
        ctx.translate(-cx, -cy);
    }

    if (isGrayscale) {
        ctx.filter = 'grayscale(1)';
    }

    if (outputFormat === 'original') {
        ctx.drawImage(image, 0, 0);
    } else if (fitMode === 'fit') {
        const fit = calculateFitDimensions(image.width, image.height, logicalWidth, logicalHeight);
        ctx.drawImage(image, fit.baseX, fit.baseY, fit.drawWidth, fit.drawHeight);
    } else {
        const cover = calculateCoverDimensions(image.width, image.height, logicalWidth, logicalHeight);
        const offsetX = imageOffsetNormX * logicalWidth;
        const offsetY = imageOffsetNormY * logicalHeight;
        const rawX = cover.baseX + offsetX;
        const rawY = cover.baseY + offsetY;

        const drawX = Math.min(0, Math.max(logicalWidth - cover.drawWidth, rawX));
        const drawY = Math.min(0, Math.max(logicalHeight - cover.drawHeight, rawY));

        ctx.drawImage(image, drawX, drawY, cover.drawWidth, cover.drawHeight);
    }

    ctx.filter = 'none';

    drawingStack.forEach(command => {
        if (command.type === 'grid') {
            drawGrid(ctx, logicalWidth, logicalHeight, command.param, lineColor, dynamicLineWidth);
        } else if (command.type === 'diagonals') {
            drawDiagonals(ctx, logicalWidth, logicalHeight, lineColor, dynamicLineWidth);
        } else if (command.type === 'diamond') {
            drawDiagonals(ctx, logicalWidth, logicalHeight, lineColor, dynamicLineWidth);
            drawDiamond(ctx, logicalWidth, logicalHeight, command.param, lineColor, dynamicLineWidth);
        } else if (command.type === 'customGrid') {
            const pixelsPerCm = getPixelsPerCm(outputFormat, orientation, logicalWidth, imageDpi);
            const spacingPx = command.spacing * pixelsPerCm;
            drawCustomGridOverlay(ctx, logicalWidth, logicalHeight, spacingPx, lineColor, dynamicLineWidth);
        }
    });

    if (useZoom) {
        ctx.restore();
    }

    ctx.restore();
}
