import os
from PIL import Image, ImageDraw

def process_seal():
    source_path = r"C:\Users\MichaelGwoah\.gemini\antigravity\brain\3acd7348-0c87-4de4-bcdf-3e9e94114933\media__1779656758317.png"
    
    # 1. Open the source image and convert to RGBA (supporting transparency)
    img = Image.open(source_path).convert("RGBA")
    width, height = img.size
    
    # 2. Create a high-quality circular mask
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    
    # Draw a filled circle covering the bounds of the circular seal
    # We subtract 1-2 pixels from the boundaries to ensure a super clean anti-aliased edge
    draw.ellipse((2, 2, width - 2, height - 2), fill=255)
    
    # 3. Apply the circular mask as the alpha channel
    img.putalpha(mask)
    
    # Define destination paths
    destinations = [
        r"apps/frontend/public/images/moci-seal.png",
        r"apps/frontend/public/icons/icon-512.png",
        r"apps/frontend/public/icons/icon-192.png"
    ]
    
    # 4. Save to all destinations with high quality
    for dest in destinations:
        # Ensure parent folder exists
        os.makedirs(os.path.dirname(dest), exist_ok=True)
        img.save(dest, "PNG")
        print(f"[OK] Saved transparent seal to {dest}")

if __name__ == "__main__":
    process_seal()
