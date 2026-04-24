export function normalizeHeightInput(height: number) {
  if (!Number.isFinite(height) || height <= 0) {
    return null;
  }

  return height >= 3 ? height / 100 : height;
}

export function calculateBodyMassIndex(weight: number, height: number | null | undefined) {
  if (!Number.isFinite(weight) || weight <= 0) {
    return null;
  }

  const normalizedHeight = height ? normalizeHeightInput(height) : null;

  if (!normalizedHeight) {
    return null;
  }

  return weight / (normalizedHeight * normalizedHeight);
}

export function formatBodyMassIndex(weight: number, height: number | null | undefined) {
  const bmi = calculateBodyMassIndex(weight, height);

  return bmi ? bmi.toFixed(1) : null;
}

export function formatHeight(height: number | null | undefined) {
  const normalizedHeight = height ? normalizeHeightInput(height) : null;

  return normalizedHeight ? normalizedHeight.toFixed(2) : null;
}
