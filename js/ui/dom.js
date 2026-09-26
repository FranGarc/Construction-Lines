/**
 * UI & DOM Interaction Controller
 * Maintained by UI-UX-AGENT & CLEAN-CODE-AGENT
 */

import { CONFIG } from '../config.js';
import { t, setLanguage, updateI18nDOM, getLanguage } from '../i18n.js';
import {
    computeLogicalCanvasSize,
    getDevicePixelRatio,
    renderCanvas,
    getMaxZoom,
    clampZoomCenter
} from '../canvas/engine.js';
import { exportHighResImage, generateFilename } from '../services/export.js';

export function initUI(state) {
    // DOM Elements
    const canvas = document.getElementById('canvas');
    const ctx = canvas.getContext('2d');

    const languageSelect = document.getElementById('languageSelect');
    const uploadInput = document.getElementById('upload');
    const outputFormatSelect = document.getElementById('outputFormat');
    const orientationContainer = document.getElementById('orientationContainer');
    const orientationPortrait = document.getElementById('orientationPortrait');
    const orientationLandscape = document.getElementById('orientationLandscape');
    const toggleGrayscaleBtn = document.getElementById('toggleGrayscale');
    const downloadLink = document.getElementById('downloadLink');

    const imageDimensions = document.getElementById('imageDimensions');
    const panHint = document.getElementById('panHint');
    const scrollHint = document.getElementById('scrollHint');

    const zoomControls = document.getElementById('zoomControls');
    const zoomInBtn = document.getElementById('zoomIn');
    const zoomOutBtn = document.getElementById('zoomOut');
    const zoomResetBtn = document.getElementById('zoomReset');
    const zoomDisplay = document.getElementById('zoomDisplay');
    const zoomMaxDisplay = document.getElementById('zoomMaxDisplay');

    const lineColorInput = document.getElementById('lineColor');
    const gridSpacingInput = document.getElementById('gridSpacing');
    const applyGridBtn = document.getElementById('applyGridButton');
    const clearLinesBtn = document.getElementById('clearLines');

    // Preset buttons
    const presetButtons = {
        drawCross: { type: 'grid', param: 2 },
        drawDiagonal: { type: 'diagonals' },
        drawDiamond1: { type: 'diamond', param: 2 },
        drawDiamond2: { type: 'diamond', param: 4 },
        drawDiamond3: { type: 'diamond', param: 8 },
        drawDiamond4: { type: 'diamond', param: 16 },
        drawGrid3: { type: 'grid', param: 4 },
        drawGrid7: { type: 'grid', param: 8 },
        drawGrid15: { type: 'grid', param: 16 },
        drawGrid31: { type: 'grid', param: 32 }
    };

    // Helper: Verify image is loaded before performing drawing operations
    function requireImage() {
        if (!state.hasImage()) {
            alert(t('alertNoImage'));
            return false;
        }
        return true;
    }

    // Update canvas size and render
    function refreshCanvas() {
        if (!state.hasImage()) return;

        const { width: logicalWidth, height: logicalHeight } = computeLogicalCanvasSize(
            state.image,
            state.outputFormat,
            state.orientation
        );

        const dpr = getDevicePixelRatio();
        canvas.width = Math.round(logicalWidth * dpr);
        canvas.height = Math.round(logicalHeight * dpr);

        renderCanvas(ctx, canvas, state, { isPreview: true, applyZoom: true });
    }

    // Sync all UI element states from AppState
    function updateUIState() {
        const hasImg = state.hasImage();

        // 1. Image Dimensions Display
        if (!hasImg) {
            imageDimensions.textContent = t('uploadPrompt');
        } else {
            const widthPx = state.image.width;
            const heightPx = state.image.height;
            const widthCm = (widthPx / state.imageDpi) * CONFIG.INCH_TO_CM;
            const heightCm = (heightPx / state.imageDpi) * CONFIG.INCH_TO_CM;
            imageDimensions.innerHTML = `
                ${t('imgDimPx')}: ${widthPx}px x ${heightPx}px<br>
                ${t('imgDimCm')}: ${widthCm.toFixed(2)}cm x ${heightCm.toFixed(2)}cm (DPI: ${state.imageDpi})
            `;
        }

        // 2. Format & Orientation
        outputFormatSelect.value = state.outputFormat;
        if (state.outputFormat === 'original') {
            orientationContainer.classList.add('hidden');
            orientationContainer.style.display = 'none';
        } else {
            orientationContainer.classList.remove('hidden');
            orientationContainer.style.display = 'flex';
            if (state.orientation === 'portrait') {
                orientationPortrait.checked = true;
            } else {
                orientationLandscape.checked = true;
            }
        }

        // 3. Pan hint & Cursor
        panHint.style.display = (state.outputFormat !== 'original' && hasImg) ? 'block' : 'none';
        const canInteract = hasImg && (state.outputFormat !== 'original' || state.zoomLevel > 1);
        canvas.style.cursor = canInteract ? 'grab' : 'default';

        // 4. Zoom UI
        const maxZoom = getMaxZoom(state.image, state.outputFormat, state.orientation, state.imageDpi);
        const zoomVisible = !!(hasImg && maxZoom > 1);
        if (zoomControls) zoomControls.style.display = zoomVisible ? 'flex' : 'none';
        if (scrollHint) scrollHint.style.display = zoomVisible ? 'block' : 'none';

        if (zoomVisible) {
            if (zoomDisplay) zoomDisplay.textContent = `${state.zoomLevel.toFixed(1)}×`;
            if (zoomMaxDisplay) zoomMaxDisplay.textContent = `/ ${maxZoom.toFixed(1)}× ${t('zoomMax')}`;
            if (zoomInBtn) zoomInBtn.disabled = state.zoomLevel >= maxZoom - 0.01;
            if (zoomOutBtn) zoomOutBtn.disabled = state.zoomLevel <= 1;
        }

        // 5. Grayscale button
        if (toggleGrayscaleBtn) {
            toggleGrayscaleBtn.textContent = t(state.isGrayscale ? 'colorBtn' : 'grayscaleBtn');
        }

        // 6. Clear lines button
        if (clearLinesBtn) {
            clearLinesBtn.style.display = state.drawingStack.length > 0 ? 'block' : 'none';
        }

        // 7. Download link
        if (hasImg) {
            downloadLink.style.display = 'block';
            downloadLink.download = generateFilename(state.outputFormat, state.orientation, state.customGridSpacing);
        } else {
            downloadLink.style.display = 'none';
        }

        // Render Canvas
        refreshCanvas();
    }

    // Subscribe refresh on state change
    state.subscribe(() => {
        updateUIState();
    });

    // Language selector
    if (languageSelect) {
        languageSelect.value = getLanguage();
        languageSelect.addEventListener('change', (e) => {
            setLanguage(e.target.value);
            updateI18nDOM();
            updateUIState();
        });
    }

    // Image Upload
    uploadInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const img = new Image();
            img.onload = () => {
                canvas.style.display = 'block';
                let dpi = CONFIG.DEFAULT_DPI;
                if (window.EXIF) {
                    window.EXIF.getData(img, function() {
                        const xDpi = window.EXIF.getTag(this, 'XResolution') || CONFIG.DEFAULT_DPI;
                        const yDpi = window.EXIF.getTag(this, 'YResolution') || CONFIG.DEFAULT_DPI;
                        dpi = Math.round((xDpi + yDpi) / 2);
                        state.setImage(img, dpi);
                    });
                } else {
                    state.setImage(img, dpi);
                }
            };
            img.src = event.target.result;
        };
        reader.readAsDataURL(file);
    });

    // Format selection
    outputFormatSelect.addEventListener('change', (e) => {
        state.setOutputFormat(e.target.value);
    });

    // Orientation selection
    orientationPortrait.addEventListener('change', () => state.setOrientation('portrait'));
    orientationLandscape.addEventListener('change', () => state.setOrientation('landscape'));

    // Line color input
    lineColorInput.addEventListener('input', (e) => {
        state.setLineColor(e.target.value);
    });

    // Preset buttons
    Object.entries(presetButtons).forEach(([id, command]) => {
        const btn = document.getElementById(id);
        if (btn) {
            btn.addEventListener('click', () => {
                if (!requireImage()) return;
                state.addDrawingCommand({ ...command });
            });
        }
    });

    // Custom grid button
    applyGridBtn.addEventListener('click', () => {
        if (!requireImage()) return;
        const spacingCm = parseFloat(gridSpacingInput.value);
        if (isNaN(spacingCm) || spacingCm <= 0) {
            alert(t('alertInvalidGrid'));
            return;
        }
        state.addDrawingCommand({ type: 'customGrid', spacing: spacingCm });
    });

    // Clear lines button
    clearLinesBtn.addEventListener('click', () => {
        state.clearDrawingStack();
    });

    // Grayscale toggle
    toggleGrayscaleBtn.addEventListener('click', () => {
        if (!requireImage()) return;
        state.toggleGrayscale();
    });

    // Zoom Buttons
    zoomInBtn.addEventListener('click', () => {
        const maxZoom = getMaxZoom(state.image, state.outputFormat, state.orientation, state.imageDpi);
        const newZoom = Math.min(maxZoom, state.zoomLevel * 1.25);
        const { clampedX, clampedY } = clampZoomCenter(newZoom, state.zoomCenterNormX, state.zoomCenterNormY);
        state.setZoom(newZoom, clampedX, clampedY);
    });

    zoomOutBtn.addEventListener('click', () => {
        const newZoom = Math.max(1.0, state.zoomLevel / 1.25);
        const { clampedX, clampedY } = clampZoomCenter(newZoom, state.zoomCenterNormX, state.zoomCenterNormY);
        state.setZoom(newZoom, clampedX, clampedY);
    });

    zoomResetBtn.addEventListener('click', () => {
        state.resetZoom(true);
    });

    // Wheel Zooming
    canvas.addEventListener('wheel', (e) => {
        e.preventDefault();
        if (!state.hasImage()) return;

        const maxZoom = getMaxZoom(state.image, state.outputFormat, state.orientation, state.imageDpi);
        if (maxZoom <= 1) return;

        const factor = e.deltaY < 0 ? 1.1 : 1 / 1.1;
        const newZoom = Math.max(1, Math.min(maxZoom, state.zoomLevel * factor));
        if (newZoom === state.zoomLevel) return;

        const rect = canvas.getBoundingClientRect();
        const mx = (e.clientX - rect.left) / rect.width;
        const my = (e.clientY - rect.top) / rect.height;

        let newCenterX = 0.5;
        let newCenterY = 0.5;

        if (newZoom === 1) {
            newCenterX = 0.5;
            newCenterY = 0.5;
        } else {
            const cx = state.zoomCenterNormX;
            const cy = state.zoomCenterNormY;
            const px = cx + (mx - cx) / state.zoomLevel;
            const py = cy + (my - cy) / state.zoomLevel;
            newCenterX = (mx - px * newZoom) / (1 - newZoom);
            newCenterY = (my - py * newZoom) / (1 - newZoom);
        }

        const { clampedX, clampedY } = clampZoomCenter(newZoom, newCenterX, newCenterY);
        state.setZoom(newZoom, clampedX, clampedY);
    }, { passive: false });

    // Drag / Pan Handling
    let isDragging = false;
    let dragStartX = 0, dragStartY = 0;
    let dragStartOffsetNormX = 0, dragStartOffsetNormY = 0;

    function startDrag(clientX, clientY) {
        if (!state.hasImage()) return;
        if (state.outputFormat === 'original' && state.zoomLevel <= 1) return;

        isDragging = true;
        dragStartX = clientX;
        dragStartY = clientY;

        if (state.zoomLevel > 1) {
            dragStartOffsetNormX = state.zoomCenterNormX;
            dragStartOffsetNormY = state.zoomCenterNormY;
        } else {
            dragStartOffsetNormX = state.imageOffsetNormX;
            dragStartOffsetNormY = state.imageOffsetNormY;
        }
        canvas.style.cursor = 'grabbing';
    }

    function doDrag(clientX, clientY) {
        if (!isDragging) return;

        const rect = canvas.getBoundingClientRect();
        const dxNorm = (clientX - dragStartX) / rect.width;
        const dyNorm = (clientY - dragStartY) / rect.height;

        if (state.zoomLevel > 1) {
            const newCenterX = dragStartOffsetNormX - dxNorm;
            const newCenterY = dragStartOffsetNormY - dyNorm;
            const { clampedX, clampedY } = clampZoomCenter(state.zoomLevel, newCenterX, newCenterY);
            state.setZoom(state.zoomLevel, clampedX, clampedY);
        } else {
            state.setPanOffset(dragStartOffsetNormX + dxNorm, dragStartOffsetNormY + dyNorm);
        }
    }

    function endDrag() {
        if (!isDragging) return;
        isDragging = false;
        const canInteract = state.hasImage() && (state.outputFormat !== 'original' || state.zoomLevel > 1);
        canvas.style.cursor = canInteract ? 'grab' : 'default';
    }

    canvas.addEventListener('mousedown', (e) => startDrag(e.clientX, e.clientY));
    document.addEventListener('mousemove', (e) => doDrag(e.clientX, e.clientY));
    document.addEventListener('mouseup', endDrag);

    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            startDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });

    document.addEventListener('touchmove', (e) => {
        if (isDragging && e.touches.length === 1) {
            e.preventDefault();
            doDrag(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: false });

    document.addEventListener('touchend', endDrag);

    // Download Button Click Event
    downloadLink.addEventListener('click', (event) => {
        event.preventDefault();
        if (!state.hasImage()) return;

        const originalText = downloadLink.textContent;
        downloadLink.textContent = 'Generating...';
        downloadLink.style.pointerEvents = 'none';
        downloadLink.style.opacity = '0.7';

        setTimeout(() => {
            try {
                exportHighResImage(state);
            } finally {
                downloadLink.textContent = originalText;
                downloadLink.style.pointerEvents = 'auto';
                downloadLink.style.opacity = '1';
            }
        }, 10);
    });

    // Initial translation setup
    updateI18nDOM();
    updateUIState();
}
