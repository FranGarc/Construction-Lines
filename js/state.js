/**
 * Centralized Application State Management
 * Maintained by ARCHITECT-AGENT & CLEAN-CODE-AGENT
 */

import { CONFIG } from './config.js';

class AppState {
    constructor() {
        this.listeners = new Set();
        this.reset();
    }

    reset() {
        this.image = null;
        this.imageDpi = CONFIG.DEFAULT_DPI;
        this.outputFormat = 'original';
        this.orientation = 'portrait';
        this.fitMode = 'cover';
        this.lineColor = CONFIG.DEFAULT_LINE_COLOR;
        this.drawingStack = [];
        this.customGridSpacing = 0;
        this.isGrayscale = false;
        this.imageOffsetNormX = 0;
        this.imageOffsetNormY = 0;
        this.zoomLevel = 1.0;
        this.zoomCenterNormX = 0.5;
        this.zoomCenterNormY = 0.5;
    }

    subscribe(listener) {
        this.listeners.add(listener);
        return () => this.listeners.delete(listener);
    }

    notify(event) {
        for (const listener of this.listeners) {
            listener(this, event);
        }
    }

    setImage(image, dpi = CONFIG.DEFAULT_DPI) {
        this.image = image;
        this.imageDpi = dpi || CONFIG.DEFAULT_DPI;
        this.outputFormat = 'original';
        this.orientation = image.width < image.height ? 'portrait' : 'landscape';
        this.fitMode = 'cover';
        this.drawingStack = [];
        this.customGridSpacing = 0;
        this.isGrayscale = false;
        this.imageOffsetNormX = 0;
        this.imageOffsetNormY = 0;
        this.zoomLevel = 1.0;
        this.zoomCenterNormX = 0.5;
        this.zoomCenterNormY = 0.5;
        this.notify('imageLoaded');
    }

    setOutputFormat(format) {
        this.outputFormat = format;
        this.imageOffsetNormX = 0;
        this.imageOffsetNormY = 0;
        this.resetZoom(false);
        if (format !== 'original' && this.image) {
            this.orientation = this.image.width < this.image.height ? 'portrait' : 'landscape';
        }
        this.notify('formatChanged');
    }

    setOrientation(orientation) {
        this.orientation = orientation;
        this.imageOffsetNormX = 0;
        this.imageOffsetNormY = 0;
        this.resetZoom(false);
        this.notify('orientationChanged');
    }

    setFitMode(fitMode) {
        this.fitMode = fitMode;
        this.imageOffsetNormX = 0;
        this.imageOffsetNormY = 0;
        this.resetZoom(false);
        this.notify('fitModeChanged');
    }

    setLineColor(color) {
        this.lineColor = color;
        this.notify('lineColorChanged');
    }

    addDrawingCommand(command) {
        this.drawingStack.push(command);
        if (command.type === 'customGrid') {
            this.customGridSpacing = command.spacing;
        }
        this.notify('drawingUpdated');
    }

    clearDrawingStack() {
        this.drawingStack = [];
        this.customGridSpacing = 0;
        this.notify('drawingCleared');
    }

    toggleGrayscale() {
        this.isGrayscale = !this.isGrayscale;
        this.notify('grayscaleToggled');
    }

    setPanOffset(normX, normY) {
        this.imageOffsetNormX = normX;
        this.imageOffsetNormY = normY;
        this.notify('panChanged');
    }

    setZoom(level, centerNormX, centerNormY) {
        this.zoomLevel = level;
        this.zoomCenterNormX = centerNormX;
        this.zoomCenterNormY = centerNormY;
        this.notify('zoomChanged');
    }

    resetZoom(shouldNotify = true) {
        this.zoomLevel = 1.0;
        this.zoomCenterNormX = 0.5;
        this.zoomCenterNormY = 0.5;
        if (shouldNotify) {
            this.notify('zoomChanged');
        }
    }

    hasImage() {
        return !!(this.image && this.image.src && this.image.complete);
    }
}

export const state = new AppState();
