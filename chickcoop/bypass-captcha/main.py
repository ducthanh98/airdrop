import cv2
import numpy as np
from flask import Flask, request, jsonify
import os
import subprocess

app = Flask(__name__)
directory = "images"

def divide_image_row_col(image, rows, cols):
    """Divide the image into a grid of specified rows and columns."""
    h, w, _ = image.shape
    parts = []
    col_width = w // cols
    row_height = h // rows

    for j in range(rows):
        for i in range(cols):
            start_row = j * row_height
            end_row = (j + 1) * row_height
            start_col = i * col_width
            end_col = (i + 1) * col_width

            # Handle edge cases where the last part may be larger to include the entire image
            if j == rows - 1:
                end_row = h
            if i == cols - 1:
                end_col = w

            part = image[start_row:end_row, start_col:end_col]
            parts.append((part, (start_row, start_col, end_row, end_col)))

    return parts

def draw_rectangle(image, center, size):
    """Draw a rectangle on the image at the specified center point with the given size."""
    h, w = size
    top_left = (int(center[0] - w / 2), int(center[1] - h / 2))
    bottom_right = (int(center[0] + w / 2), int(center[1] + h / 2))
    cv2.rectangle(image, top_left, bottom_right, (0, 255, 0), 3)
    return top_left, bottom_right

def log_rectangle_coordinates(top_left, bottom_right, filename='rectangle_coordinates.txt'):
    """Log the coordinates of the rectangle to a file."""
    with open(filename, 'w') as file:
        file.write(f"Top-left corner: {top_left}\n")
        file.write(f"Bottom-right corner: {bottom_right}\n")
    print(f"Rectangle coordinates have been written to '{filename}'")

def check_part_contains_rectangle(part_coords, rect_coords):
    """Check if the rectangle is contained within the part with at least 60% overlap."""
    part_top_left = (part_coords[0], part_coords[1])
    part_bottom_right = (part_coords[2], part_coords[3])

    rect_top_left, rect_bottom_right = rect_coords

    xA = max(part_top_left[1], rect_top_left[0])
    yA = max(part_top_left[0], rect_top_left[1])
    xB = min(part_bottom_right[1], rect_bottom_right[0])
    yB = min(part_bottom_right[0], rect_bottom_right[1])

    if xA < xB and yA < yB:
        intersection_area = (xB - xA) * (yB - yA)
        rect_area = (rect_bottom_right[0] - rect_top_left[0]) * (rect_bottom_right[1] - rect_top_left[1])

        overlap = intersection_area / rect_area
        return overlap >= 0.6
    return False

def filterImage(body):
    small_urls = body['hintImages']
    results = []
    # Extract the filename from the URL
    filename = os.path.basename(body['mainImage'])

    # Full path to the file
    file_path = os.path.join(directory, filename)

    # Create the directory if it doesn't exist
    os.makedirs(directory, exist_ok=True)

    # Check if the file already exists
    if not os.path.isfile(file_path):
        print("File ",filename," does not exist. Downloading...")
        # Use wget to download the file
        subprocess.run(["wget", "-O", file_path, body['mainImage']])
    else:
        print("File ",filename," already exists.")
    # Load the images
    large_image = cv2.imread(file_path)
    gray_large_image = cv2.cvtColor(large_image, cv2.COLOR_BGR2GRAY)

    for i,small_url in enumerate(small_urls):
        filename = os.path.basename(small_url)

        # Full path to the file
        file_path = os.path.join(directory, filename)

        # Create the directory if it doesn't exist
        os.makedirs(directory, exist_ok=True)

        # Check if the file already exists
        if not os.path.isfile(file_path):
            print("File ",filename," does not exist. Downloading...")
            # Use wget to download the file
            subprocess.run(["wget", "-O", file_path, small_url])
        else:
            print("File ",filename," already exists.")

        small_image = cv2.imread(file_path)


        # Convert to grayscale for feature detection
        gray_small_image = cv2.cvtColor(small_image, cv2.COLOR_BGR2GRAY)

        # Initialize SIFT detector
        sift = cv2.SIFT_create()

        # Detect keypoints and descriptors
        keypoints_large, descriptors_large = sift.detectAndCompute(gray_large_image, None)
        keypoints_small, descriptors_small = sift.detectAndCompute(gray_small_image, None)

        # Use BFMatcher to match descriptors
        bf = cv2.BFMatcher(cv2.NORM_L2, crossCheck=True)
        matches = bf.match(descriptors_small, descriptors_large)

        # Sort matches by distance
        matches = sorted(matches, key=lambda x: x.distance)

        # Find the best match
        best_match = matches[0] if matches else None

        if best_match:
            small_idx = best_match.queryIdx
            large_idx = best_match.trainIdx
            pt_small = keypoints_small[small_idx].pt
            pt_large = keypoints_large[large_idx].pt
            print(f"Best match: Small image point: {pt_small}, Large image point: {pt_large}")

            # Define the size of the rectangle based on the size of the small image
            small_h, small_w = small_image.shape[:2]
            top_left, bottom_right = draw_rectangle(large_image, pt_large, (small_w, small_h))

            # Divide the large image into 9 parts row by row then column by column
            parts = divide_image_row_col(large_image, 3, 3)

            # Check which part contains the small image
            for idx, (part, part_coords) in enumerate(parts):
                if check_part_contains_rectangle(part_coords, (top_left, bottom_right)):
                    results.append(idx)
                    print(f"Small image found in part {idx + 1} at position {part_coords}")
                else:
                    print(f"Small image not found in part {idx + 1}")
    return results

@app.route('/submit', methods=['POST'])
def submit_data():
    print('submit')
    # Get JSON data from the request
    data = request.get_json()

    # Process the data (just echoing it back in this example)
    response_data = {
        "sequence": filterImage(data)
    }
    # Return the JSON response
    return jsonify(response_data)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5005)

