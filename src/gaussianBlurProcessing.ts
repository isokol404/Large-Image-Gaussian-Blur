import { uploadedImageElement, displayProcessedResult, displayOriginalImage } from '././app.js';

const gaussianKernelCache: Record<number, Float32Array> = {};

// Function to create a Gaussian blur kernel
function createGaussianKernel(radius: number): Float32Array {
    if (gaussianKernelCache[radius]) {
        return gaussianKernelCache[radius];
    }

    const kernelSize = radius * 2 + 1;
    const kernel = new Float32Array(kernelSize);
    const sigma = radius / 3;
    let sumOfValues = 0;

    for (let i = 0; i < kernelSize; i++) {
        const distanceToCenter = i - radius;
        const exponent = -(distanceToCenter * distanceToCenter) / (2 * sigma * sigma);
        const value = Math.exp(exponent) / (Math.sqrt(2 * Math.PI) * sigma);

        kernel[i] = value;
        sumOfValues += value;
    }

    for (let i = 0; i < kernelSize; i++) {
        kernel[i] /= sumOfValues;
    }

    gaussianKernelCache[radius] = kernel;

    return kernel;
}

// Function for applying Gaussian blur
async function applyGaussianBlur(radius: number, threadCountMax: number): Promise<void> {
    const image = new Image();
    image.src = uploadedImageElement.src;

    await new Promise<void>((resolve, reject) => {
        image.onload = async function () {
            const width = image.width;
            const optimalWorkerPixelCount = 256 * 256;
            const optimalSegmentWidth = Math.floor(optimalWorkerPixelCount / image.height);
            const segments = Math.floor(image.width / optimalSegmentWidth);

            const threadCount =
                (segments <= 0) ? 1
                    : (segments < threadCountMax) ? segments
                        : threadCountMax;

            const currentThreadCountElement = document.getElementById('currentThreadCount');
            // Update the text inside the element with the new value
            currentThreadCountElement.textContent = threadCount.toString();
            const height = image.height;
            const segmentWidth = threadCount > 1 ? Math.floor(width / threadCount) : width;
            const segmentHeight = height;

            const tempCanvas = document.createElement("canvas");
            tempCanvas.width = width;
            tempCanvas.height = height;
            const tempCtx = tempCanvas.getContext("2d");
            if (!tempCtx) {
                reject(new Error("Failed to get 2D context"));
                return;
            }
            tempCtx.drawImage(image, 0, 0);

            const imageData = tempCtx.getImageData(0, 0, width, height);
            const kernel = createGaussianKernel(radius);

            if (radius > 0) {
                const outputCanvas = document.getElementById("outputCanvas") as HTMLCanvasElement;
                outputCanvas.width = width;
                outputCanvas.height = height;
                const workers = [];
                let workersCompleted = 0;
                const segmentImages = [];
                for (let i = 0; i < threadCount; i++) {
                    const worker = new Worker("./dist/gaussianBlurProcessingWorker.js");
                    const xInit = i * segmentWidth;
                    const yInit = 0;
                    worker.postMessage({imageData, kernel, segmentWidth, segmentHeight, xInit, yInit, threadCount});
                    worker.onmessage = function (e) {
                        workersCompleted++;
                        segmentImages[i] = e.data;

                        if (workersCompleted !== threadCount) {
                            return;
                        }

                        const mergedImageData = mergeSegmentImages(segmentImages, segmentWidth, segmentHeight, width, height, threadCount);
                        const ctx = outputCanvas.getContext("2d");
                        if (!ctx) {
                            reject(new Error("Failed to get 2D context"));
                            return;
                        }
                        ctx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);
                        ctx.putImageData(mergedImageData, 0, 0);
                        displayProcessedResult(outputCanvas);
                        workers.forEach((worker) => {
                            worker.terminate();
                        });
                        resolve();
                    };
                    workers.push(worker);
                }
            } else {
                displayOriginalImage(image, width, height);
                resolve();
            }
        };
    });
}

// Function of assembling an image from calculated segments
function mergeSegmentImages(segmentImages: ImageData[], segmentWidth: number, segmentHeight: number, fullWidth: number, fullHeight: number, threadCount: number): ImageData {
    const mergedImageData = new ImageData(fullWidth, fullHeight);

    for (let i = 0; i < threadCount; i++) {
        const segmentImageData = segmentImages[i];
        const offsetX = i * segmentWidth;

        for (let y = 0; y < segmentHeight; y++) {
            const sourceOffset = (y * segmentWidth) * 4;
            const destinationOffset = ((y * fullWidth) + offsetX) * 4;

            for (let x = 0; x < segmentWidth * 4; x++) {
                mergedImageData.data[destinationOffset + x] = segmentImageData.data[sourceOffset + x];
            }
        }
    }

    return mergedImageData;
}


export {
    applyGaussianBlur
};
