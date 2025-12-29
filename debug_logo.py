from PIL import Image

def analyze_corners(path):
    try:
        img = Image.open(path)
        print(f"Format: {img.format}, Mode: {img.mode}")
        
        corners = [
            (0, 0),
            (img.width - 1, 0),
            (0, img.height - 1),
            (img.width - 1, img.height - 1)
        ]
        
        rgb_img = img.convert("RGBA")
        for x, y in corners:
            pixel = rgb_img.getpixel((x, y))
            print(f"Pixel at ({x}, {y}): {pixel}")

    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    analyze_corners("public/logo.png")
