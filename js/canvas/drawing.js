/**
 * Pure Drawing Math & Path Rendering Functions
 * Maintained by CANVAS-ENGINE-AGENT
 */

function generateFractions(parameter, dimension) {
    const fractions = [];
    for (let i = 1; i < parameter; i++) {
        fractions.push(i * (dimension / parameter));
    }
    return fractions;
}

export function drawGrid(ctx, width, height, parameter, lineColor, lineWidth) {
    if (!ctx || !parameter) return;
    const topPoints = generateFractions(parameter, width);
    const leftPoints = generateFractions(parameter, height);

    ctx.save();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    for (const startPoint of topPoints) {
        ctx.moveTo(startPoint, 0);
        ctx.lineTo(startPoint, height);
    }

    for (const startPoint of leftPoints) {
        ctx.moveTo(0, startPoint);
        ctx.lineTo(width, startPoint);
    }

    ctx.stroke();
    ctx.restore();
}

export function drawDiagonals(ctx, width, height, lineColor, lineWidth) {
    if (!ctx) return;
    ctx.save();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(width, height);
    ctx.moveTo(width, 0);
    ctx.lineTo(0, height);
    ctx.stroke();
    ctx.restore();
}

export function drawDiamond(ctx, width, height, parameter, lineColor, lineWidth) {
    if (!ctx || !parameter) return;
    const topPoints = generateFractions(parameter, width);
    const leftPoints = generateFractions(parameter, height);
    const bottomPoints = [...topPoints].reverse();
    const rightPoints = [...leftPoints].reverse();

    ctx.save();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    for (let index = 0; index < topPoints.length; ++index) {
        const topPoint = topPoints[index];
        const bottomPoint = bottomPoints[index];
        const leftPoint = leftPoints[index];
        const rightPoint = rightPoints[index];

        ctx.moveTo(topPoint, 0);
        ctx.lineTo(0, leftPoint);

        ctx.moveTo(topPoint, 0);
        ctx.lineTo(width, rightPoint);

        ctx.moveTo(bottomPoint, height);
        ctx.lineTo(0, leftPoint);

        ctx.moveTo(bottomPoint, height);
        ctx.lineTo(width, rightPoint);
    }
    ctx.stroke();
    ctx.restore();

    drawGrid(ctx, width, height, parameter, lineColor, lineWidth);
}

export function drawCustomGridOverlay(ctx, width, height, spacingPx, lineColor, lineWidth) {
    if (!ctx || !spacingPx || spacingPx <= 0) return;

    ctx.save();
    ctx.strokeStyle = lineColor;
    ctx.lineWidth = lineWidth;
    ctx.beginPath();

    for (let x = spacingPx; x < width; x += spacingPx) {
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
    }
    for (let y = spacingPx; y < height; y += spacingPx) {
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
    }
    ctx.stroke();
    ctx.restore();
}
