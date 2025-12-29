from PIL import Image

def remove_dark_background(input_path, output_path, threshold=50):
    print(f"Opening {input_path}...")
    img = Image.open(input_path)
    img = img.convert("RGBA")
    datas = img.getdata()

    new_data = []
    count_transparent = 0
    for item in datas:
        # Check if the pixel is dark
        # Threshold: RGB < 50 (Dark Gray)
        if item[0] < threshold and item[1] < threshold and item[2] < threshold:
            new_data.append((0, 0, 0, 0)) # Fully Transparent
            count_transparent += 1
        else:
            new_data.append(item)

    img.putdata(new_data)
    img.save(output_path, "PNG")
    print(f"Processed {input_path} -> {output_path}")
    print(f"Made {count_transparent} pixels transparent out of {len(datas)}.")

if __name__ == "__main__":
    remove_dark_background("public/logo.png", "public/logo.png", threshold=50)
