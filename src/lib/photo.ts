// Client-side photo resize before upload (ARCHITECTURE.md): longest edge 1280px,
// JPEG quality ~0.72. Keeps R2 usage tiny and uploads fast. No library.

const MAX_EDGE = 1280;
const QUALITY = 0.72;

export async function resizeToJpeg(file: File): Promise<Blob> {
	const bitmap = await createImageBitmap(file);
	const scale = Math.min(1, MAX_EDGE / Math.max(bitmap.width, bitmap.height));
	const width = Math.round(bitmap.width * scale);
	const height = Math.round(bitmap.height * scale);

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('Canvas not available');
	ctx.drawImage(bitmap, 0, 0, width, height);
	bitmap.close();

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('Could not encode image'))),
			'image/jpeg',
			QUALITY
		);
	});
}
