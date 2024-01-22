interface ConvolutionOptions {
    direction: 'horizontal' | 'vertical';
    sourceBuffer: ImageData;
    kernel: number[];
    outputBuffer: ImageData;
    segmentWidth: number;
    segmentHeight: number;
    xInit: number;
    yInit: number;
}

self.onmessage = function (event): void {
    const { imageData, kernel, segmentWidth, segmentHeight, xInit, yInit } = event.data;
    const buffer1 = new ImageData(segmentWidth, segmentHeight);
    const buffer2 = new ImageData(segmentWidth, segmentHeight);

    const horizontalOptions: ConvolutionOptions = {
        direction: 'horizontal',
        sourceBuffer: imageData,
        kernel: kernel,
        outputBuffer: buffer1,
        segmentWidth: segmentWidth,
        segmentHeight: segmentHeight,
        xInit: xInit,
        yInit: yInit
    };

    applyConvolution(horizontalOptions);

    const verticalOptions: ConvolutionOptions = {
        direction: 'vertical',
        sourceBuffer: buffer1,
        kernel: kernel,
        outputBuffer: buffer2,
        segmentWidth: segmentWidth,
        segmentHeight: segmentHeight,
        xInit: xInit,
        yInit: yInit
    };

    applyConvolution(verticalOptions);

    self.postMessage(buffer2);
};

// Convolution calculation function
function applyConvolution(options: ConvolutionOptions): void {
    const {
        direction,
        sourceBuffer,
        kernel,
        outputBuffer,
        segmentWidth,
        segmentHeight,
        xInit,
        yInit
    } = options;

    const kernelSize = kernel.length;
    const kernelRadius = Math.floor(kernelSize / 2);

    const applyHorizontal = direction === 'horizontal';
    const fullWidth = applyHorizontal ? sourceBuffer.width : segmentWidth;
    const fullHeight = applyHorizontal ? segmentHeight : sourceBuffer.height;

    for (let y = 0; y < segmentHeight; y++) {
        for (let x = 0; x < segmentWidth; x++) {
            let r = 0, g = 0, b = 0, a = 0;
            let weightSum = 0;

            for (let k = -kernelRadius; k <= kernelRadius; k++) {
                const sourceX = applyHorizontal ? Math.min(fullWidth - 1, Math.max(0, x + xInit + k)) : x;
                const sourceY = applyHorizontal ? y + yInit : mirrorCoordinate(y + k, fullHeight);

                const sourcePixelIndex = (sourceY * fullWidth + sourceX) * 4;
                const kernelWeight = kernel[k + kernelRadius];

                r += sourceBuffer.data[sourcePixelIndex] * kernelWeight;
                g += sourceBuffer.data[sourcePixelIndex + 1] * kernelWeight;
                b += sourceBuffer.data[sourcePixelIndex + 2] * kernelWeight;
                a += sourceBuffer.data[sourcePixelIndex + 3] * kernelWeight;
                weightSum += kernelWeight;
            }

            if (weightSum !== 0) {
                r /= weightSum;
                g /= weightSum;
                b /= weightSum;
                a /= weightSum;
            }

            let outputPixelIndex = (y * segmentWidth + x) * 4;
            outputBuffer.data[outputPixelIndex] = r;
            outputBuffer.data[outputPixelIndex + 1] = g;
            outputBuffer.data[outputPixelIndex + 2] = b;
            outputBuffer.data[outputPixelIndex + 3] = a;
        }
    }
}

// Coordinate mirroring function for specifying convolution direction
function mirrorCoordinate(coordinate: number, limit: number): number {
    if (coordinate < 0) {
        return -coordinate;
    }
    if (coordinate >= limit) {
        return 2 * limit - coordinate - 2;
    }
    return coordinate;
}
