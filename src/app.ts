import { applyGaussianBlur } from '././gaussianBlurProcessing.js';

// Getting references to DOM elements
const fileInputElement = document.getElementById('fileInput') as HTMLInputElement;
const imageUrlInputElement = document.getElementById('imageUrlInput') as HTMLInputElement;
const loadImageByUrlButtonElement = document.getElementById('loadImageByUrlButton');
const uploadedImageElement = document.getElementById('uploadedImage') as HTMLImageElement;
const blurRadiusRangeElement = document.getElementById('blurRadiusRange') as HTMLInputElement;
const blurRadiusValueElement = document.getElementById('blurRadiusValue') as HTMLImageElement;
const outputCanvasElement = document.getElementById('outputCanvas') as HTMLCanvasElement;
const processedImageElement = document.getElementById('processedImage') as HTMLImageElement;
const processingIndicatorElement = document.getElementById('processingIndicator') as HTMLImageElement;
const blurRadiusInputElement = document.getElementById('blurRadiusInput') as HTMLInputElement;
const threadCountRangeElement = document.getElementById('threadCountRange') as HTMLInputElement;
const threadCountInputElement = document.getElementById('threadCountInput') as HTMLInputElement;

let isSliderFocused = false;

enum ERRORS {
    IMAGE_PROCESSING = 'Error processing image',
    IMAGE_UPLOADING = 'Error while loading the image',
}

// Updating value and synchronizing controls
function updateControlValues(inputElement: HTMLInputElement, rangeElement: HTMLInputElement, value: number): void {
    const valueString = value.toString();
    inputElement.value = valueString;
    rangeElement.value = valueString;
}

// Function for displaying indicator
function showProcessingIndicator() {
    processingIndicatorElement.style.display = 'block';
}

// Function to hide the indicator
function hideProcessingIndicator() {
    processingIndicatorElement.style.display = 'none';
}

// Function to load an image by URL
async function loadImageByUrl(url: string) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);
        const threadCount = parseInt(threadCountRangeElement.value, 10);
        uploadedImageElement.src = objectURL;
        updateControlValues(threadCountInputElement, threadCountRangeElement, threadCount);

        await applyGaussianBlur(parseInt(blurRadiusRangeElement.value, 10), threadCount);
    } catch (error) {
        console.error(ERRORS.IMAGE_UPLOADING);
    }
}

// Function for displaying the processed image
function displayProcessedResult(outputCanvas: HTMLCanvasElement) {
    processedImageElement.src = outputCanvas.toDataURL('image/jpeg');
}

// Function to display the original image on the canvas
function displayOriginalImage(image: HTMLImageElement, width: number, height: number) {
    const ctx = outputCanvasElement.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, outputCanvasElement.width, outputCanvasElement.height);
    outputCanvasElement.width = width;
    outputCanvasElement.height = height;
    ctx.drawImage(image, 0, 0);

    displayProcessedResult(outputCanvasElement);
}

// Function for locking and unlocking the slider
function setSliderDisabled(isDisabled: boolean) {
    blurRadiusRangeElement.disabled = isDisabled;
}

// Function to update the displayed radius value
function updateRadiusDisplay(radius: number) {
    if (blurRadiusValueElement) {
        blurRadiusValueElement.textContent = radius.toString();
    }
}

// Applying a blur effect
async function applyBlurEffect(radius, threadCount) {
    showProcessingIndicator();
    blurRadiusRangeElement.disabled = true;
    try {
        await applyGaussianBlur(radius, threadCount);
    } catch (error) {
        console.error(ERRORS.IMAGE_PROCESSING);
    } finally {
        blurRadiusRangeElement.disabled = false;
        hideProcessingIndicator();
    }
}

// Input event handler for thread count slider
threadCountRangeElement.addEventListener('input', () => {
    updateControlValues(threadCountInputElement, threadCountRangeElement, parseInt(threadCountRangeElement.value, 10));
});

// Input event handler for the number of threads text field
threadCountInputElement.addEventListener('input', () => {
    const threadCount = Math.max(1, Math.min(parseInt(threadCountInputElement.value, 10), 16));
    updateControlValues(threadCountInputElement, threadCountRangeElement, threadCount);
});

// Input event handler for radius numeric field
blurRadiusInputElement.addEventListener('input', () => {
    const radius = Math.max(0, Math.min(parseInt(blurRadiusInputElement.value, 10), 100));
    updateControlValues(blurRadiusInputElement, blurRadiusRangeElement, radius);
    applyGaussianBlur(radius, parseInt(threadCountRangeElement.value, 10));
});

// Focus handler for slider
blurRadiusRangeElement.addEventListener('focus', () => {
    isSliderFocused = true;
});

// Slider focus loss handler
blurRadiusRangeElement.addEventListener('blur', () => {
    isSliderFocused = false;
});

// Keystroke handler
document.addEventListener('keydown', (event) => {
    if (!isSliderFocused) return;

    const currentValue = parseInt(blurRadiusRangeElement.value, 10);
    if (event.key === 'ArrowRight') {
        blurRadiusRangeElement.value = (currentValue + 1).toString();
    } else if (event.key === 'ArrowLeft') {
        blurRadiusRangeElement.value = (currentValue - 1).toString();
    }

    blurRadiusRangeElement.dispatchEvent(new Event('input'));
});

// An input event handler for a slider that only updates the text field
blurRadiusRangeElement.addEventListener('input', () => {
    updateControlValues(blurRadiusInputElement, blurRadiusRangeElement, parseInt(blurRadiusRangeElement.value, 10));
});


// The change event handler for the slider that starts processing the image
blurRadiusRangeElement.addEventListener('change', async () => {
    showProcessingIndicator();
    const radius = parseInt(blurRadiusRangeElement.value, 10);

    setSliderDisabled(true);

    try {
        let threadCount = parseInt(threadCountRangeElement.value, 10);
        updateControlValues(threadCountInputElement, threadCountRangeElement, parseInt(threadCountRangeElement.value, 10));
        await applyGaussianBlur(radius, threadCount);
    } catch (error) {

        console.error(ERRORS.IMAGE_PROCESSING, error);
    } finally {
        setSliderDisabled(false);
        hideProcessingIndicator();
    }
});

// Event handler for selecting a file via the <input type="file"> element
fileInputElement.addEventListener('change', () => {
    const file = fileInputElement.files[0];

    if (!file) {
        return
    }

    const reader = new FileReader();
    reader.onload = event => {
        uploadedImageElement.src = event.target.result as string;
        applyBlurEffect(parseInt(blurRadiusRangeElement.value, 10), parseInt(threadCountRangeElement.value, 10));
    };
    reader.readAsDataURL(file);
});

// Event handler for the "Upload image via link" button
loadImageByUrlButtonElement?.addEventListener('click', () => {
    const imageUrl = imageUrlInputElement.value;
    if (imageUrl) {
        loadImageByUrl(imageUrl);
    }
});

export {
    displayProcessedResult,
    displayOriginalImage,
    uploadedImageElement
};
