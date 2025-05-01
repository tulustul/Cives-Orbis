from collections.abc import Generator
from PIL import Image
from pathlib import Path
import numpy as np

TARGET_SIZE = (256, 256)
TERRAIN_TARGET_SIZE = (256, 256)
RESOURCES_TARGET_SIZE = (128, 128)
INPUT_DIR = "src/assets-src/originals"
OUTPUT_DIR = "src/assets-src/cleaned"


def clean_image(input_path: Path, output_path: Path):
    image = Image.open(input_path)

    if image.mode == "RGBA" and "coasts" not in str(input_path):
        image = crop_out_transparency(image)

    str_input_path = str(input_path)
    if "terrain" in str_input_path:
        size = TERRAIN_TARGET_SIZE
    elif "resources" in str_input_path:
        size = RESOURCES_TARGET_SIZE
    else:
        size = TARGET_SIZE

    image.thumbnail(size)
    image.save(output_path)


def crop_out_transparency(image: Image) -> Image:
    alpha = np.array(image.getchannel("A"))

    non_empty_columns = np.where(alpha.max(axis=0) > 2)[0]
    non_empty_rows = np.where(alpha.max(axis=1) > 2)[0]

    if len(non_empty_rows) == 0 or len(non_empty_columns) == 0:
        return image

    cropBox = (
        min(non_empty_columns),
        min(non_empty_rows),
        max(non_empty_columns) + 1,
        max(non_empty_rows) + 1,
    )

    return image.crop(cropBox)


def get_input_paths() -> Generator[str]:
    root_path = Path(INPUT_DIR)
    yield from root_path.glob("**/*.png")


def clean_images():
    for input_path in get_input_paths():
        output_path = Path(str(input_path).replace(INPUT_DIR, OUTPUT_DIR))
        output_path.parent.mkdir(exist_ok=True, parents=True)
        clean_image(input_path, output_path)


if __name__ == "__main__":
    clean_images()
