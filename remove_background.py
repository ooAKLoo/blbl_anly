#!/usr/bin/env python3
"""
Background Removal Script using BRIA RMBG-1.4 model
Processes a single image and removes its background
"""

import os
import torch
import torch.nn.functional as F
import numpy as np
from PIL import Image
from transformers import AutoModelForImageSegmentation
from torchvision.transforms.functional import normalize


def preprocess_image(im: np.ndarray, model_input_size: list) -> torch.Tensor:
    """
    Preprocess image for model input

    Args:
        im: Input image as numpy array
        model_input_size: Target size for model input [height, width]

    Returns:
        Preprocessed image tensor
    """
    if len(im.shape) < 3:
        im = im[:, :, np.newaxis]

    # Convert to tensor and permute to (C, H, W)
    im_tensor = torch.tensor(im, dtype=torch.float32).permute(2, 0, 1)

    # Resize to model input size
    im_tensor = F.interpolate(
        torch.unsqueeze(im_tensor, 0),
        size=model_input_size,
        mode='bilinear'
    )

    # Normalize to [0, 1]
    image = torch.divide(im_tensor, 255.0)

    # Normalize with mean=0.5, std=1.0
    image = normalize(image, [0.5, 0.5, 0.5], [1.0, 1.0, 1.0])

    return image


def postprocess_image(result: torch.Tensor, im_size: list) -> np.ndarray:
    """
    Postprocess model output to create mask

    Args:
        result: Model output tensor
        im_size: Original image size [height, width]

    Returns:
        Mask as numpy array (0-255)
    """
    # Resize back to original size
    result = torch.squeeze(
        F.interpolate(result, size=im_size, mode='bilinear'),
        0
    )

    # Normalize to [0, 1]
    ma = torch.max(result)
    mi = torch.min(result)
    result = (result - mi) / (ma - mi)

    # Convert to numpy array (0-255)
    im_array = (result * 255).permute(1, 2, 0).cpu().data.numpy().astype(np.uint8)
    im_array = np.squeeze(im_array)

    return im_array


def remove_background(
    input_path: str,
    output_path: str = None,
    model_name: str = "briaai/RMBG-1.4"
) -> str:
    """
    Remove background from an image

    Args:
        input_path: Path to input image
        output_path: Path to save output image (optional)
        model_name: HuggingFace model identifier

    Returns:
        Path to output image
    """
    # Validate input file
    if not os.path.exists(input_path):
        raise FileNotFoundError(f"Input image not found: {input_path}")

    # Generate output path if not provided
    if output_path is None:
        base, ext = os.path.splitext(input_path)
        output_path = f"{base}_no_bg.png"

    print(f"Loading model: {model_name}")

    # Load model
    model = AutoModelForImageSegmentation.from_pretrained(
        model_name,
        trust_remote_code=True
    )

    # Set device (GPU if available)
    device = torch.device("cuda:0" if torch.cuda.is_available() else "cpu")
    model.to(device)
    model.eval()

    print(f"Using device: {device}")
    print(f"Processing image: {input_path}")

    # Load and prepare input image
    orig_image = Image.open(input_path)

    # Convert to RGB if necessary (handle RGBA, grayscale, etc.)
    if orig_image.mode != 'RGB':
        orig_image = orig_image.convert('RGB')

    orig_im = np.array(orig_image)
    orig_im_size = orig_im.shape[0:2]

    # Model input size
    model_input_size = [1024, 1024]

    # Preprocess
    image = preprocess_image(orig_im, model_input_size).to(device)

    # Inference
    print("Running inference...")
    with torch.no_grad():
        result = model(image)

    # Postprocess
    print("Generating mask...")
    result_image = postprocess_image(result[0][0], orig_im_size)

    # Create mask and apply to original image
    pil_mask = Image.fromarray(result_image)

    # Create output image with transparent background
    no_bg_image = orig_image.copy()
    no_bg_image.putalpha(pil_mask)

    # Save result
    no_bg_image.save(output_path)
    print(f"Saved result to: {output_path}")

    # Also save the mask separately
    mask_path = output_path.replace('.png', '_mask.png')
    pil_mask.save(mask_path)
    print(f"Saved mask to: {mask_path}")

    return output_path


def main():
    """Main entry point"""
    # Input image path
    input_path = "/Users/yangdongju/Downloads/Gemini_Generated_Image_zaa0fjzaa0fjzaa0.png"

    # Output path (will be generated in the same directory)
    output_path = "/Users/yangdongju/Downloads/Gemini_Generated_Image_zaa0fjzaa0fjzaa0.png"

    try:
        # Remove background
        result_path = remove_background(input_path, output_path)
        print(f"\n✅ Success! Background removed successfully.")
        print(f"Output: {result_path}")

    except Exception as e:
        print(f"\n❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    main()
