const Jimp = require('jimp');
const fs = require('fs');
const path = require('path');

async function run() {
    const iconDir = path.join(__dirname, 'src-tauri', 'icons');
    const iconPath = path.join(iconDir, 'icon.png');
    const icoPath = path.join(iconDir, 'icon.ico');
    const primarySource = path.join(__dirname, 'IpName2.png');
    const sourceAppIcon = path.join(__dirname, 'app-icon.png');

    // Ensure icons directory exists
    if (!fs.existsSync(iconDir)) {
        fs.mkdirSync(iconDir, { recursive: true });
    }

    // Try to sync from IpName2.png and IpName2.ico first
    if (fs.existsSync(primarySource)) {
        console.log('Found IpName2.png. Syncing to app-icon.png, src-tauri/icons/icon.png, and public/appIcon.png...');
        fs.copyFileSync(primarySource, sourceAppIcon);
        fs.copyFileSync(primarySource, iconPath);
        
        const publicAppIcon = path.join(__dirname, 'public', 'appIcon.png');
        try {
            fs.copyFileSync(primarySource, publicAppIcon);
            console.log('Successfully synced public/appIcon.png');
        } catch (e) {
            console.warn('Warning: Could not copy to public/appIcon.png', e);
        }
    }

    const sourceIco = path.join(__dirname, 'IpName2.ico');
    if (fs.existsSync(sourceIco)) {
        console.log('Found IpName2.ico. Syncing to public/favicon.ico and public/icon1.ico...');
        const publicFavicon = path.join(__dirname, 'public', 'favicon.ico');
        const publicIcon1 = path.join(__dirname, 'public', 'icon1.ico');
        try {
            fs.copyFileSync(sourceIco, publicFavicon);
            fs.copyFileSync(sourceIco, publicIcon1);
            console.log('Successfully synced public favicons.');
        } catch (e) {
            console.warn('Warning: Could not copy public favicons', e);
        }
    }

    // Check if icon.png exists and is healthy, copy from root app-icon.png if needed
    let copyNeeded = false;
    if (!fs.existsSync(iconPath)) {
        console.log('src-tauri/icons/icon.png not found. Copying from app-icon.png...');
        copyNeeded = true;
    } else {
        // If file is extremely small or corrupted, we might need to restore it
        try {
            const stats = fs.statSync(iconPath);
            if (stats.size < 1000) {
                console.log('src-tauri/icons/icon.png seems too small or corrupt. Restoring...');
                copyNeeded = true;
            }
        } catch (e) {
            copyNeeded = true;
        }
    }

    if (copyNeeded) {
        if (fs.existsSync(sourceAppIcon)) {
            fs.copyFileSync(sourceAppIcon, iconPath);
            console.log('Successfully copied app-icon.png to src-tauri/icons/icon.png');
        } else if (fs.existsSync(primarySource)) {
            fs.copyFileSync(primarySource, iconPath);
            console.log('Successfully copied IpName2.png to src-tauri/icons/icon.png');
        } else {
            console.warn('Warning: Source icon files not found in root. Cannot restore icon.png.');
        }
    }

    console.log('Reading original icon from:', iconPath);
    if (!fs.existsSync(iconPath)) {
        console.error('Error: Original icon.png is missing. Skipping Windows icon compilation fix.');
        return;
    }

    let fileBuffer;
    try {
        fileBuffer = fs.readFileSync(iconPath);
        console.log('Successfully read file into buffer. Buffer length:', fileBuffer.length);
        
        // Let's verify PNG header to make sure it's not a broken file
        // Healthy PNG starts with: 89 50 4E 47 0D 0A 1A 0A
        if (fileBuffer[0] !== 0x89 || fileBuffer[1] !== 0x50 || fileBuffer[2] !== 0x4E || fileBuffer[3] !== 0x47) {
            console.warn('Warning: icon.png header is not a valid PNG! Attempting to force-restore from root app-icon.png...');
            if (fs.existsSync(sourceAppIcon)) {
                fs.copyFileSync(sourceAppIcon, iconPath);
                fileBuffer = fs.readFileSync(iconPath);
                console.log('Restored healthy PNG. New buffer length:', fileBuffer.length);
            }
        }
    } catch (readError) {
        console.error('Failed to read icon.png:', readError);
        return;
    }

    let img;
    try {
        img = await Jimp.read(fileBuffer);
    } catch (jimpError) {
        console.error('Jimp failed to parse the PNG file. Restoring with root app-icon.png...');
        if (fs.existsSync(sourceAppIcon)) {
            fs.copyFileSync(sourceAppIcon, iconPath);
            fileBuffer = fs.readFileSync(iconPath);
            img = await Jimp.read(fileBuffer);
        } else {
            throw jimpError;
        }
    }
    
    // 128x128 크기 지정 (rc.exe가 처리 가능한 최상의 호환 범위인 128x128 크기로 무압축 BMP 포맷 인코딩)
    const width = 128;
    const height = 128;
    console.log(`Resizing to ${width}x${height}...`);
    img.resize(width, height);

    const bpp = 32;
    const imageSize = width * height * (bpp / 8);
    const maskSize = (width * height) / 8;
    const dibHeaderSize = 40;
    const totalImageSize = dibHeaderSize + imageSize + maskSize;

    const buf = Buffer.alloc(6 + 16 + totalImageSize);
    buf.fill(0);

    // ICO Header
    buf.writeUInt16LE(0, 0); // Reserved
    buf.writeUInt16LE(1, 2); // Type: 1 (ICO)
    buf.writeUInt16LE(1, 4); // Image count: 1

    // ICO Directory Entry
    buf.writeUInt8(width, 6);
    buf.writeUInt8(height, 7);
    buf.writeUInt8(0, 8);
    buf.writeUInt8(0, 9);
    buf.writeUInt16LE(1, 10); // Color planes
    buf.writeUInt16LE(bpp, 12); // Bits per pixel
    buf.writeUInt32LE(totalImageSize, 14); // Size of image data
    buf.writeUInt32LE(22, 18); // Offset of image data

    // DIB Header
    let offset = 22;
    buf.writeUInt32LE(dibHeaderSize, offset);
    buf.writeInt32LE(width, offset + 4);
    buf.writeInt32LE(height * 2, offset + 8); // Height is doubled in DIB header for mask
    buf.writeUInt16LE(1, offset + 12);
    buf.writeUInt16LE(bpp, offset + 14);
    buf.writeUInt32LE(0, offset + 16); // Compression: 0 (BI_RGB)
    buf.writeUInt32LE(imageSize + maskSize, offset + 20);

    // Image Data (BGRA) - bottom-up DIB
    const imgDataOffset = offset + dibHeaderSize;
    for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
            // Jimp is top-down, DIB is bottom-up
            const jimpY = height - 1 - y;
            const hex = img.getPixelColor(x, jimpY);
            const rgba = Jimp.intToRGBA(hex);

            const i = y * width + x;
            buf.writeUInt8(rgba.b, imgDataOffset + i * 4);
            buf.writeUInt8(rgba.g, imgDataOffset + i * 4 + 1);
            buf.writeUInt8(rgba.r, imgDataOffset + i * 4 + 2);
            buf.writeUInt8(rgba.a, imgDataOffset + i * 4 + 3);
        }
    }

    fs.writeFileSync(icoPath, buf);
    console.log('Successfully generated strict BMP icon.ico! (rc.exe compatible)');
}

run().catch(console.error);
