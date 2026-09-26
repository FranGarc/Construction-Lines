/**
 * Application Global Configuration
 * Maintained by CLEAN-CODE-AGENT & ARCHITECT-AGENT
 */

export const CONFIG = {
    PAPER_SIZES: {
        A_PORTRAIT_RATIO: 1 / Math.sqrt(2),
        A_LANDSCAPE_RATIO: Math.sqrt(2),
        DIMENSIONS: {
            A1: [594, 841],
            A2: [420, 594],
            A3: [297, 420],
            A4: [210, 297],
            A5: [148, 210]
        }
    },
    INCH_TO_CM: 2.54,
    MIN_QUALITY_DPI: 150,
    EXPORT_DPI: 300,
    DEFAULT_DPI: 96,
    DEFAULT_LINE_COLOR: '#ff0000',
    STORAGE_KEYS: {
        LANG: 'gridToolLang'
    },
    TRANSLATIONS: {
        en: {
            mainTitle: "Reference Line Drawer",
            langLabel: "Language",
            card1Title: "1. Image & Format",
            selectImg: "Select Image",
            outputSize: "Output Paper Size",
            originalImage: "Original Image",
            orientation: "Orientation",
            portrait: "Portrait",
            landscape: "Landscape",
            fitLabel: "Image Fitting",
            fitOption: "Fit (Save Ink)",
            coverOption: "Fill Paper (Cover)",
            card2Title: "2. Add Reference Lines",
            lineColor: "Line Color",
            presets: "Preset Grids & Diamonds",
            card3Title: "3. Add Custom Grid",
            gridLinesSpacing: "Grid Spacing (cm)",
            applyCustomGrid: "Apply Custom Grid",
            card4Title: "4. Finalize & Download",

            diagTooltip: "Diagonals",
            crossTooltip: "Cross",
            grid4Tooltip: "Grid 4x4",

            clearBtn: "Clear All Lines",
            downloadBtn: "Download Image",
            panHint: "Drag the image to reposition it",
            grayscaleBtn: "Convert to B&W",
            colorBtn: "Revert to Color",
            alertNoImage: "Please upload an image first.",
            alertInvalidGrid: "Please enter a valid number for grid spacing in cm.",
            uploadPrompt: "Upload an image to see its dimensions",
            imgDimPx: "Original image dimensions",
            imgDimCm: "Approximate size",
            scrollToZoom: "Scroll to zoom · Drag to pan",
            zoomMax: "max",
            zoomResetTooltip: "Reset zoom"
        },
        es: {
            mainTitle: "Líneas de Encuadre",
            langLabel: "Idioma",
            card1Title: "1. Imagen y Formato",
            selectImg: "Seleccionar Imagen",
            outputSize: "Tamaño del Papel",
            originalImage: "Imagen Original",
            orientation: "Orientación",
            portrait: "Vertical",
            landscape: "Horizontal",
            fitLabel: "Ajuste de Imagen",
            fitOption: "Encajar (Ahorrar Tinta)",
            coverOption: "Rellenar / Recortar",
            card2Title: "2. Añadir Líneas",
            lineColor: "Color de Línea",
            presets: "Cuadrículas y Diamantes",
            card3Title: "3. Añadir Rejilla Personalizada",
            gridLinesSpacing: "Espaciado Entre Líneas (cm)",
            applyCustomGrid: "Aplicar Rejilla Personalizada",
            card4Title: "4. Finalizar & Descargar",

            diagTooltip: "Diagonales",
            crossTooltip: "Cruz",
            grid4Tooltip: "Cuadrícula 4x4",

            clearBtn: "Borrar Todo",
            downloadBtn: "Descargar Imagen",
            panHint: "Arrastra la imagen para reposicionarla",
            grayscaleBtn: "Pasar a B&N",
            colorBtn: "Volver a Color",
            alertNoImage: "Por favor, sube una imagen primero.",
            alertInvalidGrid: "Por favor, introduce un número válido para el espaciado de la rejilla en cm.",
            uploadPrompt: "Sube una imagen para ver sus dimensiones",
            imgDimPx: "Dimensiones originales",
            imgDimCm: "Tamaño aproximado",
            scrollToZoom: "Rueda para zoom · Arrastrar para mover",
            zoomMax: "máx",
            zoomResetTooltip: "Restablecer zoom"
        }
    }
};
