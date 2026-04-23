import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';

type CropGuide = {
  originX: number;
  originY: number;
  width: number;
  height: number;
};

export type ScanCropMode = 'pressure' | 'glicose';

function makeCrop(
  width: number,
  height: number,
  widthRatio: number,
  heightRatio: number,
  originXRatio: number,
  originYRatio: number
): CropGuide {
  const cropWidth = Math.round(width * widthRatio);
  const cropHeight = Math.round(height * heightRatio);
  const originX = Math.max(Math.round(width * originXRatio), 0);
  const originY = Math.max(Math.round(height * originYRatio), 0);

  return {
    originX,
    originY,
    width: Math.min(cropWidth, Math.max(width - originX, 1)),
    height: Math.min(cropHeight, Math.max(height - originY, 1)),
  };
}

export function createCropVariants(width: number, height: number, mode: ScanCropMode) {
  if (mode === 'pressure') {
    return [
      { name: 'pressure-center', crop: makeCrop(width, height, 0.84, 0.5, 0.08, 0.2) },
      { name: 'pressure-upper', crop: makeCrop(width, height, 0.8, 0.42, 0.1, 0.16) },
      { name: 'pressure-tight', crop: makeCrop(width, height, 0.72, 0.36, 0.14, 0.22) },
    ];
  }

  return [
    { name: 'glicose-center', crop: makeCrop(width, height, 0.84, 0.38, 0.08, 0.28) },
    { name: 'glicose-tight', crop: makeCrop(width, height, 0.7, 0.24, 0.15, 0.33) },
    { name: 'glicose-lower', crop: makeCrop(width, height, 0.76, 0.28, 0.12, 0.38) },
  ];
}

export async function cropImageToGuide(
  imageUri: string,
  width: number,
  height: number,
  mode: ScanCropMode
) {
  const crop = createCropVariants(width, height, mode)[0].crop;

  return manipulateAsync(
    imageUri,
    [
      {
        crop,
      },
    ],
    {
      compress: 1,
      format: SaveFormat.JPEG,
    }
  );
}

export async function cropImageVariants(
  imageUri: string,
  width: number,
  height: number,
  mode: ScanCropMode
) {
  const variants = createCropVariants(width, height, mode);

  return Promise.all(
    variants.map(async (variant) => {
      const result = await manipulateAsync(
        imageUri,
        [
          {
            crop: variant.crop,
          },
        ],
        {
          compress: 1,
          format: SaveFormat.JPEG,
        }
      );

      return {
        name: variant.name,
        ...result,
      };
    })
  );
}
