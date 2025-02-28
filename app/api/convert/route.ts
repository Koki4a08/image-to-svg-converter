import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { createCanvas, loadImage } from 'canvas';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('image') as File;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No image file provided' },
        { status: 400 }
      );
    }

    // Convert the file to a buffer
    const buffer = Buffer.from(await file.arrayBuffer());

    // Get image dimensions
    const metadata = await sharp(buffer).metadata();
    
    // Preserve original dimensions but limit extremely large images
    const maxDimension = 1200;
    let width = metadata.width || 800;
    let height = metadata.height || 600;
    
    // Only resize if the image is extremely large
    if (width > maxDimension || height > maxDimension) {
      const aspectRatio = width / height;
      if (width > height) {
        width = maxDimension;
        height = Math.round(width / aspectRatio);
      } else {
        height = maxDimension;
        width = Math.round(height * aspectRatio);
      }
    }
    
    // Process the image
    const processedBuffer = await sharp(buffer)
      .resize({ width, height, fit: 'inside', withoutEnlargement: false })
      .toBuffer();

    // Create canvas and load image with original colors
    const image = await loadImage(processedBuffer);
    const canvas = createCanvas(image.width, image.height);
    const ctx = canvas.getContext('2d');

    // Draw image on canvas
    ctx.drawImage(image, 0, 0);

    // Get image data
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    
    // Define types for our data structures
    interface Rect {
      x: number;
      y: number;
      width: number;
      height: number;
    }
    
    // Create optimized SVG paths
    const colorMap = new Map<string, Rect[]>();
    
    // Calculate sample rate based on image size to preserve quality
    // For smaller images, use smaller sample rate (higher quality)
    const baseSize = Math.min(canvas.width, canvas.height);
    const sampleRate = Math.max(1, Math.floor(baseSize / 400));
    
    // Group pixels by color
    for (let y = 0; y < canvas.height; y += sampleRate) {
      for (let x = 0; x < canvas.width; x += sampleRate) {
        const idx = (y * canvas.width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        const a = data[idx + 3] / 255; // Convert alpha to 0-1 range
        
        // Skip fully transparent pixels
        if (a === 0) continue;
        
        // Create color key with minimal rounding to preserve color fidelity
        const colorKey = `rgba(${Math.round(r/2)*2},${Math.round(g/2)*2},${Math.round(b/2)*2},${Math.round(a*20)/20})`;
        
        if (!colorMap.has(colorKey)) {
          colorMap.set(colorKey, []);
        }
        
        const colorRects = colorMap.get(colorKey);
        if (colorRects) {
          colorRects.push({ x, y, width: sampleRate, height: sampleRate });
        }
      }
    }
    
    // Optimize by merging adjacent rectangles with the same color
    const optimizeRects = (rects: Rect[]): Rect[] => {
      if (rects.length <= 1) return rects;
      
      const result: Rect[] = [];
      let current: Rect = { ...rects[0] };
      
      for (let i = 1; i < rects.length; i++) {
        const rect = rects[i];
        
        // Try to merge horizontally
        if (rect.y === current.y && rect.height === current.height && 
            rect.x === current.x + current.width) {
          current.width += rect.width;
        } 
        // Otherwise add the current rectangle and start a new one
        else {
          result.push(current);
          current = { ...rect };
        }
      }
      
      result.push(current);
      return result;
    };
    
    // Generate SVG content
    let svgPaths = '';
    
    // Process each color group
    for (const [color, rects] of colorMap.entries()) {
      // Sort rectangles by y then x for better merging
      rects.sort((a, b) => a.y === b.y ? a.x - b.x : a.y - b.y);
      
      // Optimize rectangles
      const optimizedRects = optimizeRects(rects);
      
      // Create path for this color
      for (const rect of optimizedRects) {
        svgPaths += `<rect x="${rect.x}" y="${rect.y}" width="${rect.width}" height="${rect.height}" fill="${color}" />`;
      }
    }

    // Create SVG with compressed output
    const svg = `<?xml version="1.0" encoding="UTF-8" standalone="no"?>
<svg width="${canvas.width}" height="${canvas.height}" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${canvas.width} ${canvas.height}">
  ${svgPaths}
</svg>`;

    return NextResponse.json({
      svg: svg
    });

  } catch (error) {
    console.error('Error converting image:', error);
    return NextResponse.json(
      { error: 'Failed to convert image' },
      { status: 500 }
    );
  }
} 