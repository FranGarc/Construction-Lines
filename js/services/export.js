/**
 * Export Service - High Resolution Export & Download
 * Maintained by ARCHITECT-AGENT & SERVICES
 */

import { CONFIG } from '../config.js';
import { renderCanvas } from '../canvas/engine.js';

export function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

export function generateFilename(format, orientation, customGridSpacing, fitMode = 'cover') {
    let filename;
    if (format === 'original') {
        filename = 'original-image';
    } else {
        filename = `image-${format}-${orientation}-${fitMode}`;
    }
    if (customGridSpacing > 0) {
        filename += `-${customGridSpacing}cm_grid`;
    }
    filename += '.png';
    return filename;
}

export function exportHighResImage(state) {
    const filename = generateFilename(state.outputFormat, state.orientation, state.customGridSpacing, state.fitMode);

    if (state.outputFormat === 'original') {
        const exportCanvas = document.createElement('canvas');
        exportCanvas.width = state.image.width;
        exportCanvas.height = state.image.height;
        const exportCtx = exportCanvas.getContext('2d');
        renderCanvas(exportCtx, exportCanvas, state, { isPreview: false, applyZoom: false });
        const url = exportCanvas.toDataURL('image/png');
        triggerDownload(url, filename);
        return;
    }

    const dpi = CONFIG.EXPORT_DPI;
    const dimensions = CONFIG.PAPER_SIZES.DIMENSIONS[state.outputFormat];
    let [wMm, hMm] = dimensions;

    if (state.orientation === 'landscape') {
        [wMm, hMm] = [Math.max(wMm, hMm), Math.min(wMm, hMm)];
    } else {
        [wMm, hMm] = [Math.min(wMm, hMm), Math.max(wMm, hMm)];
    }

    const targetWidth = Math.round((wMm / 10) / CONFIG.INCH_TO_CM * dpi);
    const targetHeight = Math.round((hMm / 10) / CONFIG.INCH_TO_CM * dpi);

    const exportCanvas = document.createElement('canvas');
    exportCanvas.width = targetWidth;
    exportCanvas.height = targetHeight;
    const exportCtx = exportCanvas.getContext('2d');

    renderCanvas(exportCtx, exportCanvas, state, { isPreview: false, applyZoom: false });
    const url = exportCanvas.toDataURL('image/png');
    triggerDownload(url, filename);
}
