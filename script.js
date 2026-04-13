// =================================================================
// [+] TRANSLATION DICTIONARY [+]
// =================================================================
const translations = {
    en: {
        mainTitle: "Reference Line Drawer",
        card1Title: "1. Image & Format",
        selectImg: "Select Image",
        outputSize: "Output Paper Size",
        originalImage: "Original Image",
        orientation: "Orientation",
        portrait: "Portrait",
        landscape: "Landscape",
        card2Title: "2. Add Reference Lines",
        lineColor: "Line Color",
        presets: "Preset Grids & Diamonds",
        card3Title: "3. Add Custom Grid",
        gridLinesSpacing: "Grid Spacing (cm)",
        applyCustomGrid: "Apply Custom Grid",
        card4Title: "4. Finalize & Download",

        // Tooltips
        diagTooltip: "Diagonals",
        crossTooltip: "Cross",
        grid4Tooltip: "Grid 4x4",

        clearBtn: "Clear All Lines",
        downloadBtn: "Download Image",
        panHint: "Drag the image to reposition it"
    },
    es: {
        mainTitle: "Dibujante de Líneas Guía",
        card1Title: "1. Imagen y Formato",
        selectImg: "Seleccionar Imagen",
        outputSize: "Tamaño del Papel",
        originalImage: "Imagen Original",
        orientation: "Orientación",
        portrait: "Vertical",
        landscape: "Horizontal",
        card2Title: "2. Añadir Líneas",
        lineColor: "Color de Línea",
        presets: "Cuadrículas y Diamantes",
        card3Title: "3. Añadir Rejilla Personalizada",
        gridLinesSpacing: "Espaciado Entre Líneas (cm)",
        applyCustomGrid: "Aplicar Rejilla Personalizada",
        card4Title: "4. Finalizar & Descargar",

        // Tooltips
        diagTooltip: "Diagonales",
        crossTooltip: "Cruz",
        grid4Tooltip: "Cuadrícula 4x4",
        clearBtn: "Borrar Todo",
        downloadBtn: "Descargar Imagen",
        panHint: "Arrastra la imagen para reposicionarla"
    }
    // Add 'fr' (French) here if desired
};

// =================================================================
// [+] TRANSLATION FUNCTION [+]
// =================================================================
function updateLanguage(lang) {
    // 1. Update text content (Labels, Headers, Buttons)
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (translations[lang][key]) {
            element.textContent = translations[lang][key];
        }
    });

    // 2. Update tooltips (The grid icon buttons)
    document.querySelectorAll('[data-i18n-title]').forEach(element => {
        const key = element.getAttribute('data-i18n-title');
        if (translations[lang][key]) {
            element.title = translations[lang][key];
        }
    });

    // Optional: Save preference
    localStorage.setItem('gridToolLang', lang);
}

// =================================================================
// [+] STEP 1: DEFINE ALL GLOBAL VARIABLES FIRST [+]
// =================================================================
const paperSizes = {
    A_PORTRAIT_RATIO: 1 / Math.sqrt(2),
    A_LANDSCAPE_RATIO: Math.sqrt(2),
    dimensions: {
        A1: [594, 841], A2: [420, 594], A3: [297, 420],
        A4: [210, 297], A5: [148, 210]
    }
};

let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let img = new Image();
let lineWidth = 2;
let drawingStack = [];
let customGridSpacing = 0;
const InchToCm = 2.54;

// Pan/drag state
let imageOffsetNormX = 0; // Offset as fraction of canvas width
let imageOffsetNormY = 0; // Offset as fraction of canvas height
let isDragging = false;
let dragStartX = 0, dragStartY = 0;
let dragStartOffsetNormX = 0, dragStartOffsetNormY = 0;


// =================================================================
// [+] STEP 2: ATTACH ALL EVENT LISTENERS [+]
// =================================================================
document.getElementById('orientationPortrait').addEventListener('change', () => { imageOffsetNormX = 0; imageOffsetNormY = 0; transformImageToFormat(); });
document.getElementById('orientationLandscape').addEventListener('change', () => { imageOffsetNormX = 0; imageOffsetNormY = 0; transformImageToFormat(); });
document.getElementById('outputFormat').addEventListener('change', handleFormatChange);
document.getElementById('upload').addEventListener('change', handleImageUpload);
document.getElementById('drawCross').addEventListener('click', drawCross);
document.getElementById('drawDiagonal').addEventListener('click', drawDiagonals);
document.getElementById('drawDiamond1').addEventListener('click', drawDiamond1);
document.getElementById('drawDiamond2').addEventListener('click', drawDiamond2);
document.getElementById('drawDiamond3').addEventListener('click', drawDiamond3);
document.getElementById('drawDiamond4').addEventListener('click', drawDiamond4);
document.getElementById('drawGrid3').addEventListener('click', drawGrid3);
document.getElementById('drawGrid7').addEventListener('click', drawGrid7);
document.getElementById('drawGrid15').addEventListener('click', drawGrid15);
document.getElementById('drawGrid31').addEventListener('click', drawGrid31);
document.getElementById('clearLines').addEventListener('click', clearLines);
document.getElementById('applyGridButton').addEventListener('click', applyGrid);

canvas.addEventListener('mousedown', startDrag);
document.addEventListener('mousemove', doDrag);
document.addEventListener('mouseup', endDrag);
canvas.addEventListener('touchstart', startDragTouch, { passive: true });
document.addEventListener('touchmove', doDragTouch, { passive: false });
document.addEventListener('touchend', endDrag);

const langSelect = document.getElementById('languageSelect');
if (langSelect) {
    langSelect.addEventListener('change', (e) => {
        updateLanguage(e.target.value);
    });

    // Check if user has a saved preference on load
    const savedLang = localStorage.getItem('gridToolLang') || 'en';
    langSelect.value = savedLang;
    updateLanguage(savedLang);
}

// =================================================================
// [+] STEP 3: DEFINE ALL FUNCTIONS [+]
// =================================================================

/**
 * Helper function to programmatically trigger a download.
 */
function triggerDownload(url, filename) {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
}

/**
 * Calculates the position and size to draw an image to "fit" inside a canvas
 * while maintaining its aspect ratio.
 */
function calculateFitDimensions(image, canvas) {
    const imageRatio = image.width / image.height;
    const canvasRatio = canvas.width / canvas.height;
    let drawWidth, drawHeight, drawX, drawY;

    if (imageRatio > canvasRatio) {
        drawWidth = canvas.width;
        drawHeight = canvas.width / imageRatio;
        drawX = 0;
        drawY = (canvas.height - drawHeight) / 2;
    } else {
        drawHeight = canvas.height;
        drawWidth = canvas.height * imageRatio;
        drawY = 0;
        drawX = (canvas.width - drawWidth) / 2;
    }
    return { drawX, drawY, drawWidth, drawHeight };
}

/**
 * Calculates the position and size to draw an image to "cover" a canvas
 * (like CSS object-fit: cover). The image fills the canvas, some parts may be clipped.
 * baseX/baseY represent the centered (default) position.
 */
function calculateCoverDimensions(image, canvas) {
    const imageRatio = image.width / image.height;
    const canvasRatio = canvas.width / canvas.height;
    let drawWidth, drawHeight;

    if (imageRatio > canvasRatio) {
        // Image is wider → scale by height to fill vertically
        drawHeight = canvas.height;
        drawWidth = canvas.height * imageRatio;
    } else {
        // Image is taller → scale by width to fill horizontally
        drawWidth = canvas.width;
        drawHeight = canvas.width / imageRatio;
    }

    return {
        drawWidth,
        drawHeight,
        baseX: (canvas.width - drawWidth) / 2,
        baseY: (canvas.height - drawHeight) / 2,
    };
}

function updateCanvasCursor() {
    const format = document.getElementById('outputFormat').value;
    const hasImage = !!img.src && img.complete;
    canvas.style.cursor = (format !== 'original' && hasImage) ? 'grab' : 'default';
}

function getCanvasScale() {
    const rect = canvas.getBoundingClientRect();
    return { x: canvas.width / rect.width, y: canvas.height / rect.height };
}

function startDrag(e) {
    if (document.getElementById('outputFormat').value === 'original' || !img.src) return;
    isDragging = true;
    const scale = getCanvasScale();
    dragStartX = e.clientX * scale.x;
    dragStartY = e.clientY * scale.y;
    dragStartOffsetNormX = imageOffsetNormX;
    dragStartOffsetNormY = imageOffsetNormY;
    canvas.style.cursor = 'grabbing';
}

function doDrag(e) {
    if (!isDragging) return;
    const scale = getCanvasScale();
    const dx = (e.clientX * scale.x) - dragStartX;
    const dy = (e.clientY * scale.y) - dragStartY;
    imageOffsetNormX = dragStartOffsetNormX + dx / canvas.width;
    imageOffsetNormY = dragStartOffsetNormY + dy / canvas.height;
    redrawLinesOnCanvas(ctx);
}

function endDrag() {
    isDragging = false;
    updateCanvasCursor();
}

function startDragTouch(e) {
    if (document.getElementById('outputFormat').value === 'original' || !img.src) return;
    const touch = e.touches[0];
    isDragging = true;
    const scale = getCanvasScale();
    dragStartX = touch.clientX * scale.x;
    dragStartY = touch.clientY * scale.y;
    dragStartOffsetNormX = imageOffsetNormX;
    dragStartOffsetNormY = imageOffsetNormY;
}

function doDragTouch(e) {
    if (!isDragging) return;
    e.preventDefault();
    const touch = e.touches[0];
    const scale = getCanvasScale();
    const dx = (touch.clientX * scale.x) - dragStartX;
    const dy = (touch.clientY * scale.y) - dragStartY;
    imageOffsetNormX = dragStartOffsetNormX + dx / canvas.width;
    imageOffsetNormY = dragStartOffsetNormY + dy / canvas.height;
    redrawLinesOnCanvas(ctx);
}

function checkUserUploadedImage(){
    if (!img.src) {
        alert("Please upload an image first.");
        throw new Error("No image uploaded"); // Stop execution
    }
}

function getImageDimensions(img, dpi) {
    const widthPx = img.width;
    const heightPx = img.height;
    const widthCm = (widthPx / dpi) * InchToCm;
    const heightCm = (heightPx / dpi) * InchToCm;

    const dimensionsText = `
        Original Image dimensions: ${widthPx}px x ${heightPx}px<br>
        Approximate size: ${widthCm.toFixed(2)}cm x ${heightCm.toFixed(2)}cm (DPI: ${dpi})
    `;
    document.getElementById('imageDimensions').innerHTML = dimensionsText;
}

function getPixelsPerCm(targetCanvas) {
    const format = document.getElementById('outputFormat').value;
    if (format === 'original') {
        // Fallback to 96 DPI if image DPI not found, to prevent crash
        return (canvas.dpi || 96) / InchToCm;
    }
    let [widthMm, heightMm] = paperSizes.dimensions[format];
    const orientation = document.querySelector('input[name="orientation"]:checked').value;

    if (orientation === 'landscape') {
        return targetCanvas.width / (Math.max(widthMm, heightMm) / 10);
    } else {
        return targetCanvas.width / (Math.min(widthMm, heightMm) / 10);
    }
}

// Master drawing function
function redrawLinesOnCanvas(context) {
    const targetCanvas = context.canvas;

    // Calculate thickness: 1px minimum, or a ratio of the width
    const dynamicWidth = Math.max(3, targetCanvas.width / 500);
    context.lineWidth = dynamicWidth;

    lineWidth = dynamicWidth;

    context.fillStyle = 'white';
    context.fillRect(0, 0, targetCanvas.width, targetCanvas.height);

    const format = document.getElementById('outputFormat').value;
    if (format === 'original') {
        context.drawImage(img, 0, 0);
    } else {
        const cover = calculateCoverDimensions(img, targetCanvas);
        const offsetX = imageOffsetNormX * targetCanvas.width;
        const offsetY = imageOffsetNormY * targetCanvas.height;
        const rawX = cover.baseX + offsetX;
        const rawY = cover.baseY + offsetY;
        // Clamp so the image always fills the canvas completely
        const drawX = Math.min(0, Math.max(targetCanvas.width - cover.drawWidth, rawX));
        const drawY = Math.min(0, Math.max(targetCanvas.height - cover.drawHeight, rawY));
        context.drawImage(img, drawX, drawY, cover.drawWidth, cover.drawHeight);
    }

    drawingStack.forEach(command => {
         if (command.type === 'grid') {
            grid(command.param, context, targetCanvas);
        } else if (command.type === 'diagonals') {
            diagonals(context, targetCanvas);
        } else if (command.type === 'diamond') {
            diagonals(context, targetCanvas);
            diamond(command.param, context, targetCanvas);
        } else if (command.type === 'customGrid') {
            const pixelsPerCm = getPixelsPerCm(targetCanvas);
            const spacingPx = command.spacing * pixelsPerCm;
            drawGridOverlay(spacingPx, context, targetCanvas);
        }
    });
}

// Main image transformation function
function transformImageToFormat() {
    if (!img.src) { return; }
    const format = document.getElementById('outputFormat').value;

    if (format === 'original') {
        canvas.width = img.width;
        canvas.height = img.height;
    } else {
        const selectedOrientation = document.querySelector('input[name="orientation"]:checked').value;
        const formatAspectRatio = (selectedOrientation === 'portrait') ? paperSizes.A_PORTRAIT_RATIO : paperSizes.A_LANDSCAPE_RATIO;
        const imageAspectRatio = img.width / img.height;
        let newWidth, newHeight;
        if (imageAspectRatio > formatAspectRatio) {
            newWidth = img.width;
            newHeight = img.width / formatAspectRatio;
        } else {
            newHeight = img.height;
            newWidth = img.height * formatAspectRatio;
        }
        canvas.width = newWidth;
        canvas.height = newHeight;
    }
    redrawLinesOnCanvas(ctx);
    showDownloadLink();
}

function handleFormatChange() {
    const format = document.getElementById('outputFormat').value;
    const orientationContainer = document.getElementById('orientationContainer');

    imageOffsetNormX = 0;
    imageOffsetNormY = 0;

    if (format === 'original') {
        orientationContainer.style.display = 'none';
    } else {
        orientationContainer.style.display = 'flex';
        const imageIsPortrait = img.width < img.height;
        document.getElementById('orientationPortrait').checked = imageIsPortrait;
        document.getElementById('orientationLandscape').checked = !imageIsPortrait;
    }
    updateCanvasCursor();
    const panHint = document.getElementById('panHint');
    if (panHint) panHint.style.display = (format !== 'original' && img.src) ? 'block' : 'none';
    transformImageToFormat();
}

function handleImageUpload(event) {
    let reader = new FileReader();
    reader.onload = function(e) {
        img.onload = function() {
            canvas.width = img.width;
            canvas.height = img.height;
            ctx.drawImage(img, 0, 0);
            canvas.style.display = 'block';

            document.getElementById('outputFormat').value = 'original';
            document.getElementById('orientationContainer').style.display = 'none';
            // Clear any previous state
            drawingStack = [];
            customGridSpacing = 0;
            imageOffsetNormX = 0;
            imageOffsetNormY = 0;
            updateCanvasCursor();
            showDownloadLink();

            EXIF.getData(img, function() {
                let xDpi = EXIF.getTag(this, 'XResolution') || 96;
                let yDpi = EXIF.getTag(this, 'YResolution') || 96;
                let dpi = (xDpi + yDpi) / 2;
                canvas.dpi = dpi;
                getImageDimensions(img, dpi);
            });
        }
        img.src = e.target.result;
    }
    reader.readAsDataURL(event.target.files[0]);
}

function applyGrid() {
    checkUserUploadedImage();
    const spacingCm = parseInt(document.getElementById('gridSpacing').value, 10);
    if (isNaN(spacingCm) || spacingCm <= 0) {
        alert("Please enter a valid number for grid spacing in cm.");
        return;
    }
    customGridSpacing = spacingCm;
    drawingStack.push({ type: 'customGrid', spacing: spacingCm });
    redrawLinesOnCanvas(ctx);
    showDownloadLink();
}

function showDownloadLink() {
    let filename;
    const format = document.getElementById('outputFormat').value;

    if (format === 'original') {
        filename = 'original-image';
    } else {
        const selectedOrientation = document.querySelector('input[name="orientation"]:checked').value;
        filename = `image-${format}-${selectedOrientation}`;
    }
    if (customGridSpacing > 0) {
        filename += `-${customGridSpacing}cm_grid`;
    }
    filename += '.png';

    let downloadLink = document.getElementById('downloadLink');
    downloadLink.download = filename;

    downloadLink.onclick = null;
    downloadLink.onclick = (event) => {
        event.preventDefault();
        const originalText = downloadLink.textContent;
        downloadLink.textContent = "Generating...";
        downloadLink.style.pointerEvents = 'none';
        downloadLink.style.opacity = '0.7';

        setTimeout(() => {
            try {
                const exportFormat = document.getElementById('outputFormat').value;
                if (exportFormat === 'original') {
                    const url = canvas.toDataURL('image/png');
                    triggerDownload(url, downloadLink.download);
                    return;
                }
                console.log("Starting high-resolution export...");
                const selectedOrientation = document.querySelector('input[name="orientation"]:checked').value;
                const dpi = 300;
                let [widthMm, heightMm] = paperSizes.dimensions[exportFormat];

                if (selectedOrientation === 'landscape') {
                    [widthMm, heightMm] = [Math.max(widthMm, heightMm), Math.min(widthMm, heightMm)];
                } else {
                    [widthMm, heightMm] = [Math.min(widthMm, heightMm), Math.max(widthMm, heightMm)];
                }

                const targetWidth = Math.round((widthMm / 10) / InchToCm * dpi);
                const targetHeight = Math.round((heightMm / 10) / InchToCm * dpi);

                console.log(`Exporting at ${targetWidth}x${targetHeight}px for ${dpi} DPI`);
                const exportCanvas = document.createElement('canvas');
                exportCanvas.width = targetWidth;
                exportCanvas.height = targetHeight;
                const exportCtx = exportCanvas.getContext('2d');
                redrawLinesOnCanvas(exportCtx);
                const url = exportCanvas.toDataURL('image/png');
                triggerDownload(url, downloadLink.download);
                console.log("Export complete.");
            } finally {
                downloadLink.textContent = originalText;
                downloadLink.style.pointerEvents = 'auto';
                downloadLink.style.opacity = '1';
            }
        }, 10);
    };
    downloadLink.style.display = 'block';
}

function clearLines(){
    drawingStack = [];
    customGridSpacing = 0;
    transformImageToFormat();
}

function drawCross(){
    checkUserUploadedImage();
    drawingStack.push({ type: 'grid', param: 2 });
    redrawLinesOnCanvas(ctx);
    showDownloadLink();
}
function drawGrid3(){
    checkUserUploadedImage();
    drawingStack.push({ type: 'grid', param: 4 });
    redrawLinesOnCanvas(ctx);
    showDownloadLink();
}
function drawGrid7(){
    checkUserUploadedImage();
    drawingStack.push({ type: 'grid', param: 8 });
    redrawLinesOnCanvas(ctx);
    showDownloadLink();
}
function drawGrid15(){
    checkUserUploadedImage();
    drawingStack.push({ type: 'grid', param: 16 });
    redrawLinesOnCanvas(ctx);
    showDownloadLink();
}
function drawGrid31(){
    checkUserUploadedImage();
    drawingStack.push({ type: 'grid', param: 32 });
    redrawLinesOnCanvas(ctx);
    showDownloadLink();
}
function drawDiagonals() {
    checkUserUploadedImage();
    drawingStack.push({ type: 'diagonals' });
    redrawLinesOnCanvas(ctx);
    showDownloadLink();
}
function drawDiamond1() {
    checkUserUploadedImage();
    drawingStack.push({ type: 'diamond', param: 2 });
    redrawLinesOnCanvas(ctx);
    showDownloadLink();
}
function drawDiamond2() {
    checkUserUploadedImage();
    drawingStack.push({ type: 'diamond', param: 4 });
    redrawLinesOnCanvas(ctx);
    showDownloadLink();
}
function drawDiamond3() {
    checkUserUploadedImage();
    drawingStack.push({ type: 'diamond', param: 8 });
    redrawLinesOnCanvas(ctx);
    showDownloadLink();
}
function drawDiamond4() {
    checkUserUploadedImage();
    drawingStack.push({ type: 'diamond', param: 16 });
    redrawLinesOnCanvas(ctx);
    showDownloadLink();
}

function generateFractions(parameter, dimension) {
    let fractions = [];
    for (let i = 1; i < parameter; i++) {
        fractions.push(i * (dimension / parameter));
    }
    return fractions;
}

function createTopPoints(divideBy, width) {
    return generateFractions(divideBy, width);
}

function createLeftPoints(divideBy, height) {
    return generateFractions(divideBy, height);
}

function grid(parameter, context, canvas) {
    if (!context || !canvas) return;
    const width = canvas.width;
    const height = canvas.height;
    const topPoints = createTopPoints(parameter, width);
    const leftPoints = createLeftPoints(parameter, height);
    const lineColor = document.getElementById('lineColor').value;

    context.strokeStyle = lineColor;
//    context.lineWidth = lineWidth;
    context.beginPath();

    for (const startPoint of topPoints) {
        context.moveTo(startPoint, 0);
        context.lineTo(startPoint, height);
    }

    for (const startPoint of leftPoints) {
        context.moveTo(0, startPoint);
        context.lineTo(width, startPoint);
    }
    context.stroke();
}

function diagonals(context, canvas) {
    if (!context || !canvas) return;
    const lineColor = document.getElementById('lineColor').value;
    context.strokeStyle = lineColor;
    context.lineWidth = lineWidth;
    context.beginPath();
    context.moveTo(0, 0);
    context.lineTo(canvas.width, canvas.height);
    context.moveTo(canvas.width, 0);
    context.lineTo(0, canvas.height);
    context.stroke();
}

function diamond(parameter, context, canvas) {
    if (!context || !canvas) return;
    const width = canvas.width;
    const height = canvas.height;

    const topPoints = createTopPoints(parameter, width);
    const leftPoints = createLeftPoints(parameter, height);
    const bottomPoints = [...topPoints].reverse();
    const rightPoints = [...leftPoints].reverse();

    const lineColor = document.getElementById('lineColor').value;

    context.strokeStyle = lineColor;
    context.lineWidth = lineWidth;
    context.beginPath();

    for (let index = 0; index < topPoints.length; ++index) {
        const topPoint = topPoints[index];
        const bottomPoint = bottomPoints[index];
        const leftPoint = leftPoints[index];
        const rightPoint = rightPoints[index];

        context.moveTo(topPoint, 0);
        context.lineTo(0, leftPoint);

        context.moveTo(topPoint, 0);
        context.lineTo(width, rightPoint);

        context.moveTo(bottomPoint, height);
        context.lineTo(0, leftPoint);

        context.moveTo(bottomPoint, height);
        context.lineTo(width, rightPoint);
    }
    context.stroke();
    grid(parameter, context, canvas);
}

function drawGridOverlay(spacingPx, context, canvas) {
    if (!context || !canvas || !spacingPx || spacingPx <= 0) return;

    const width = canvas.width;
    const height = canvas.height;
    const lineColor = document.getElementById('lineColor').value;

    context.strokeStyle = lineColor;
    context.lineWidth = lineWidth;
    context.beginPath();

    for (let x = spacingPx; x < width; x += spacingPx) {
        context.moveTo(x, 0);
        context.lineTo(x, height);
    }
    for (let y = spacingPx; y < height; y += spacingPx) {
        context.moveTo(0, y);
        context.lineTo(width, y);
    }
    context.stroke();
}