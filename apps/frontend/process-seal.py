import os
from PIL import Image, ImageDraw

def process_new_seal():
    source_path = r"C:\Users\MichaelGwoah\.gemini\antigravity\brain\3acd7348-0c87-4de4-bcdf-3e9e94114933\media__1779662910274.png"
    
    if not os.path.exists(source_path):
        print(f"Error: Source image not found at {source_path}")
        return
        
    img = Image.open(source_path).convert("RGBA")
    width, height = img.size
    print(f"Loaded source image of size: {width}x{height}")
    
    # Scan for non-white pixels to find the bounding box of the circular seal.
    # Consider a pixel non-white if any RGB channel is less than 240 (excluding borders).
    left = width
    right = 0
    top = height
    bottom = 0
    
    pixels = img.load()
    for y in range(height):
        for x in range(width):
            r, g, b, a = pixels[x, y]
            # Ignore edge pixels that might have scanning noise
            if x < 2 or y < 2 or x > width - 3 or y > height - 3:
                continue
            # If the pixel is not white
            if r < 240 or g < 240 or b < 240:
                if x < left: left = x
                if x > right: right = x
                if y < top: top = y
                if y > bottom: bottom = y
                
    print(f"Detected bounding box of non-white pixels: left={left}, top={top}, right={right}, bottom={bottom}")
    
    box_w = right - left + 1
    box_h = bottom - top + 1
    print(f"Bounding box size: {box_w}x{box_h}")
    
    # Determine the circle size (diameter)
    diameter = max(box_w, box_h)
    
    # Calculate the center of the bounding box
    cx = left + box_w // 2
    cy = top + box_h // 2
    
    # Add a safety margin (padding) around the circle to prevent clipping and enable smooth anti-aliased borders
    pad = 4
    crop_size = diameter + pad * 2
    
    # Calculate perfect square coordinates centered at (cx, cy)
    c_left = cx - crop_size // 2
    c_top = cy - crop_size // 2
    c_right = c_left + crop_size
    c_bottom = c_top + crop_size
    
    print(f"Cropping square from ({c_left}, {c_top}) to ({c_right}, {c_bottom})")
    
    cropped = img.crop((c_left, c_top, c_right, c_bottom))
    w, h = cropped.size
    
    # Create the high quality circular mask
    mask = Image.new("L", (w, h), 0)
    draw = ImageDraw.Draw(mask)
    
    # Draw perfect circle covering the seal, leaving 'pad' pixels of transparent boundary
    draw.ellipse((pad, pad, w - pad, h - pad), fill=255)
    
    # Apply the mask as alpha channel
    cropped.putalpha(mask)
    
    # Save destinations
    destinations = [
        r"apps/frontend/public/images/moci-seal.png",
        r"apps/frontend/public/icons/icon-512.png",
        r"apps/frontend/public/icons/icon-192.png"
    ]
    
    for dest in destinations:
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        # Resize to standard sizes if requested, but for now we keep high-res 512 for main images and PWA
        if "icon-192.png" in dest:
            resized = cropped.resize((192, 192), Image.Resampling.LANCZOS)
            resized.save(dest, "PNG")
        elif "icon-512.png" in dest:
            resized = cropped.resize((512, 512), Image.Resampling.LANCZOS)
            resized.save(dest, "PNG")
        else:
            cropped.save(dest, "PNG")
        print(f"[OK] Saved transparent, cropped circular seal to {dest}")

if __name__ == "__main__":
    process_new_seal()
