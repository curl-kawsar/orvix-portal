const fs = require('fs');
const sharp = require('sharp');
const path = require('path');

// Sizes for various devices/platforms
const sizes = [16, 32, 48, 64, 128, 192, 256];

async function convertSvgToPng() {
  try {
    // Ensure the favicon directory exists
    const faviconDir = path.join(__dirname, '../public/favicon');
    if (!fs.existsSync(faviconDir)) {
      fs.mkdirSync(faviconDir, { recursive: true });
    }

    // Source SVG file (using the modern design)
    const svgPath = path.join(__dirname, '../public/favicon-modern.svg');
    const svgContent = fs.readFileSync(svgPath);

    // Create PNGs in various sizes
    for (const size of sizes) {
      const outputPath = path.join(faviconDir, `favicon-${size}x${size}.png`);
      
      await sharp(svgContent)
        .resize(size, size)
        .png()
        .toFile(outputPath);
      
      console.log(`Created ${outputPath}`);
    }

    // Create favicon.ico (16x16)
    await sharp(svgContent)
      .resize(16, 16)
      .toFile(path.join(__dirname, '../public/favicon.ico'));
    
    console.log('Created favicon.ico');

    console.log('All favicons generated successfully!');
  } catch (error) {
    console.error('Error generating favicons:', error);
  }
}

convertSvgToPng(); 