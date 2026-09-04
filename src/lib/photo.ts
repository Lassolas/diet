// Client-side photo resize before upload (ARCHITECTURE.md): longest edge 1280px,
// JPEG quality ~0.72. Keeps D1 usage tiny and uploads fast. No library.

const MAX_EDGE = 1280;
const QUALITY = 0.72;

interface Decoded {
	width: number;
	height: number;
	draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void;
	release: () => void;
}

/**
 * Decodes an image file. Prefers `createImageBitmap` (fast, off-thread), which
 * older iOS Safari lacks — falls back to an `<img>` element there. Both paths
 * apply EXIF orientation.
 */
async function decode(file: File): Promise<Decoded> {
	if (typeof createImageBitmap === 'function') {
		try {
			const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
			return {
				width: bitmap.width,
				height: bitmap.height,
				draw: (ctx, w, h) => ctx.drawImage(bitmap, 0, 0, w, h),
				release: () => bitmap.close()
			};
		} catch {
			// fall through to the <img> path
		}
	}

	const url = URL.createObjectURL(file);
	try {
		const img = await new Promise<HTMLImageElement>((resolve, reject) => {
			const el = new Image();
			el.onload = () => resolve(el);
			el.onerror = () => reject(new Error('Image illisible'));
			el.src = url;
		});
		return {
			width: img.naturalWidth,
			height: img.naturalHeight,
			draw: (ctx, w, h) => ctx.drawImage(img, 0, 0, w, h),
			release: () => URL.revokeObjectURL(url)
		};
	} catch (e) {
		URL.revokeObjectURL(url);
		throw e;
	}
}

export async function resizeToJpeg(file: File): Promise<Blob> {
	const src = await decode(file);
	const scale = Math.min(1, MAX_EDGE / Math.max(src.width, src.height));
	const width = Math.max(1, Math.round(src.width * scale));
	const height = Math.max(1, Math.round(src.height * scale));

	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d');
	if (!ctx) {
		src.release();
		throw new Error('Canvas indisponible');
	}
	src.draw(ctx, width, height);
	src.release();

	return new Promise((resolve, reject) => {
		canvas.toBlob(
			(blob) => (blob ? resolve(blob) : reject(new Error('Encodage impossible'))),
			'image/jpeg',
			QUALITY
		);
	});
}
