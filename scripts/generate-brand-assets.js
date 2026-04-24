const fs = require('fs');
const path = require('path');
const { PNG } = require('pngjs');

const outputDir = path.join(__dirname, '..', 'assets', 'images');

function rgba(hex, alpha = 255) {
  const value = hex.replace('#', '');
  const normalized = value.length === 3
    ? value.split('').map((char) => char + char).join('')
    : value;

  return {
    r: parseInt(normalized.slice(0, 2), 16),
    g: parseInt(normalized.slice(2, 4), 16),
    b: parseInt(normalized.slice(4, 6), 16),
    a: alpha,
  };
}

function mixColor(start, end, ratio) {
  return {
    r: Math.round(start.r + (end.r - start.r) * ratio),
    g: Math.round(start.g + (end.g - start.g) * ratio),
    b: Math.round(start.b + (end.b - start.b) * ratio),
    a: Math.round(start.a + (end.a - start.a) * ratio),
  };
}

function setPixel(png, x, y, color) {
  if (x < 0 || y < 0 || x >= png.width || y >= png.height) {
    return;
  }

  const idx = (png.width * y + x) << 2;
  png.data[idx] = color.r;
  png.data[idx + 1] = color.g;
  png.data[idx + 2] = color.b;
  png.data[idx + 3] = color.a;
}

function fillRect(png, x, y, width, height, color) {
  for (let currentY = y; currentY < y + height; currentY += 1) {
    for (let currentX = x; currentX < x + width; currentX += 1) {
      setPixel(png, currentX, currentY, color);
    }
  }
}

function fillCircle(png, centerX, centerY, radius, color) {
  const radiusSquared = radius * radius;

  for (let y = Math.floor(centerY - radius); y <= Math.ceil(centerY + radius); y += 1) {
    for (let x = Math.floor(centerX - radius); x <= Math.ceil(centerX + radius); x += 1) {
      const dx = x - centerX;
      const dy = y - centerY;

      if ((dx * dx) + (dy * dy) <= radiusSquared) {
        setPixel(png, x, y, color);
      }
    }
  }
}

function fillRoundedRect(png, x, y, width, height, radius, color) {
  fillRect(png, x + radius, y, width - (radius * 2), height, color);
  fillRect(png, x, y + radius, width, height - (radius * 2), color);
  fillCircle(png, x + radius, y + radius, radius, color);
  fillCircle(png, x + width - radius - 1, y + radius, radius, color);
  fillCircle(png, x + radius, y + height - radius - 1, radius, color);
  fillCircle(png, x + width - radius - 1, y + height - radius - 1, radius, color);
}

function drawLine(png, x1, y1, x2, y2, thickness, color) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const steps = Math.max(Math.abs(dx), Math.abs(dy));

  if (steps === 0) {
    fillCircle(png, x1, y1, thickness / 2, color);
    return;
  }

  for (let step = 0; step <= steps; step += 1) {
    const ratio = step / steps;
    const x = x1 + dx * ratio;
    const y = y1 + dy * ratio;
    fillCircle(png, x, y, thickness / 2, color);
  }
}

function fillGradientBackground(png, topHex, bottomHex) {
  const top = rgba(topHex);
  const bottom = rgba(bottomHex);

  for (let y = 0; y < png.height; y += 1) {
    const color = mixColor(top, bottom, y / (png.height - 1));
    for (let x = 0; x < png.width; x += 1) {
      setPixel(png, x, y, color);
    }
  }
}

function drawSigmaMedMark(png, options = {}) {
  const size = Math.min(png.width, png.height);
  const centerX = png.width / 2;
  const centerY = png.height / 2;
  const markScale = options.scale ?? 1;
  const circleRadius = size * 0.2 * markScale;
  const ringRadius = size * 0.235 * markScale;
  const lineColor = rgba(options.lineColor ?? '#FFFFFF');
  const accentColor = rgba(options.accentColor ?? '#18D1BC');
  const ringColor = rgba(options.ringColor ?? '#D9FFFA', options.ringAlpha ?? 255);
  const cardColor = rgba(options.cardColor ?? '#14324A', options.cardAlpha ?? 255);

  if (!options.transparentCard) {
    const cardSize = size * 0.62 * markScale;
    const radius = Math.round(cardSize * 0.18);
    fillRoundedRect(
      png,
      Math.round(centerX - cardSize / 2),
      Math.round(centerY - cardSize / 2),
      Math.round(cardSize),
      Math.round(cardSize),
      radius,
      cardColor
    );
  }

  fillCircle(png, centerX, centerY, ringRadius, ringColor);
  fillCircle(png, centerX, centerY, circleRadius, rgba(options.innerCircleColor ?? '#0D1B2A'));

  const plusThickness = Math.max(12, Math.round(size * 0.03 * markScale));
  const plusLength = size * 0.14 * markScale;

  fillRoundedRect(
    png,
    Math.round(centerX - plusLength / 2),
    Math.round(centerY - plusThickness / 2),
    Math.round(plusLength),
    plusThickness,
    Math.round(plusThickness / 2),
    lineColor
  );

  fillRoundedRect(
    png,
    Math.round(centerX - plusThickness / 2),
    Math.round(centerY - plusLength / 2),
    plusThickness,
    Math.round(plusLength),
    Math.round(plusThickness / 2),
    lineColor
  );

  const pulseY = centerY + (size * 0.175 * markScale);
  const startX = centerX - (size * 0.17 * markScale);
  const points = [
    [startX, pulseY],
    [centerX - (size * 0.07 * markScale), pulseY],
    [centerX - (size * 0.03 * markScale), pulseY - (size * 0.04 * markScale)],
    [centerX + (size * 0.01 * markScale), pulseY + (size * 0.065 * markScale)],
    [centerX + (size * 0.05 * markScale), pulseY - (size * 0.085 * markScale)],
    [centerX + (size * 0.095 * markScale), pulseY],
    [centerX + (size * 0.18 * markScale), pulseY],
  ];
  const pulseThickness = Math.max(8, Math.round(size * 0.018 * markScale));

  for (let index = 0; index < points.length - 1; index += 1) {
    const [x1, y1] = points[index];
    const [x2, y2] = points[index + 1];
    drawLine(png, x1, y1, x2, y2, pulseThickness, accentColor);
  }
}

function createPng(width, height) {
  return new PNG({ width, height });
}

function savePng(filename, png) {
  const target = path.join(outputDir, filename);
  png.pack().pipe(fs.createWriteStream(target));
}

function createIcon() {
  const png = createPng(1024, 1024);
  fillGradientBackground(png, '#0D1B2A', '#173B55');
  fillCircle(png, 820, 205, 140, rgba('#18D1BC', 38));
  fillCircle(png, 190, 840, 170, rgba('#54A8FF', 28));
  drawSigmaMedMark(png, {
    scale: 1,
    cardColor: '#0F2940',
    lineColor: '#FFFFFF',
    accentColor: '#23D6BE',
    ringColor: '#C9FFFA',
  });
  return png;
}

function createSplash() {
  const png = createPng(1024, 1024);
  fillGradientBackground(png, '#F4F9FB', '#E8F3F6');
  fillCircle(png, 768, 240, 135, rgba('#18D1BC', 26));
  fillCircle(png, 240, 780, 155, rgba('#21438F', 18));
  drawSigmaMedMark(png, {
    scale: 0.92,
    cardColor: '#14324A',
    lineColor: '#FFFFFF',
    accentColor: '#23D6BE',
    ringColor: '#D8FFFB',
  });
  return png;
}

function createAndroidForeground() {
  const png = createPng(512, 512);
  drawSigmaMedMark(png, {
    scale: 0.78,
    transparentCard: true,
    innerCircleColor: '#14324A',
    lineColor: '#14324A',
    accentColor: '#18D1BC',
    ringColor: '#14324A',
    ringAlpha: 42,
  });
  return png;
}

function createAndroidBackground() {
  const png = createPng(512, 512);
  fillGradientBackground(png, '#E8F6F7', '#DCECF4');
  fillCircle(png, 380, 132, 92, rgba('#18D1BC', 24));
  fillCircle(png, 110, 420, 110, rgba('#21438F', 16));
  return png;
}

function createMonochrome() {
  const png = createPng(432, 432);
  drawSigmaMedMark(png, {
    scale: 0.78,
    transparentCard: true,
    innerCircleColor: '#0D1B2A',
    lineColor: '#0D1B2A',
    accentColor: '#0D1B2A',
    ringColor: '#0D1B2A',
    ringAlpha: 48,
  });
  return png;
}

function createFavicon() {
  const png = createPng(48, 48);
  fillGradientBackground(png, '#0D1B2A', '#173B55');
  drawSigmaMedMark(png, {
    scale: 0.9,
    cardColor: '#102B42',
    lineColor: '#FFFFFF',
    accentColor: '#23D6BE',
    ringColor: '#D8FFFB',
  });
  return png;
}

function main() {
  savePng('icon.png', createIcon());
  savePng('splash-icon.png', createSplash());
  savePng('android-icon-foreground.png', createAndroidForeground());
  savePng('android-icon-background.png', createAndroidBackground());
  savePng('android-icon-monochrome.png', createMonochrome());
  savePng('favicon.png', createFavicon());
}

main();
