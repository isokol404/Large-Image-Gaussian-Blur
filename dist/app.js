import { applyGaussianBlur } from '././gaussianBlurProcessing.js';
// Getting references to DOM elements
const fileInputElement = document.getElementById('fileInput');
const imageUrlInputElement = document.getElementById('imageUrlInput');
const loadImageByUrlButtonElement = document.getElementById('loadImageByUrlButton');
const uploadedImageElement = document.getElementById('uploadedImage');
const blurRadiusRangeElement = document.getElementById('blurRadiusRange');
const blurRadiusValueElement = document.getElementById('blurRadiusValue');
const outputCanvasElement = document.getElementById('outputCanvas');
const processedImageElement = document.getElementById('processedImage');
const processingIndicatorElement = document.getElementById('processingIndicator');
const blurRadiusInputElement = document.getElementById('blurRadiusInput');
const threadCountRangeElement = document.getElementById('threadCountRange');
const threadCountInputElement = document.getElementById('threadCountInput');
let isSliderFocused = false;
var ERRORS;
(function (ERRORS) {
    ERRORS["IMAGE_PROCESSING"] = "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u0440\u0430\u0431\u043E\u0442\u043A\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F";
    ERRORS["IMAGE_UPLOADING"] = "\u041E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u0437\u0430\u0433\u0440\u0443\u0437\u043A\u0435 \u0438\u0437\u043E\u0431\u0440\u0430\u0436\u0435\u043D\u0438\u044F";
})(ERRORS || (ERRORS = {}));
// Updating value and synchronizing controls
function updateControlValues(inputElement, rangeElement, value) {
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
async function loadImageByUrl(url) {
    try {
        const response = await fetch(url);
        const blob = await response.blob();
        const objectURL = URL.createObjectURL(blob);
        const threadCount = parseInt(threadCountRangeElement.value, 10);
        uploadedImageElement.src = objectURL;
        updateControlValues(threadCountInputElement, threadCountRangeElement, threadCount);
        await applyGaussianBlur(parseInt(blurRadiusRangeElement.value, 10), threadCount);
    }
    catch (error) {
        console.error(ERRORS.IMAGE_UPLOADING);
    }
}
// Function for displaying the processed image
function displayProcessedResult(outputCanvas) {
    processedImageElement.src = outputCanvas.toDataURL('image/jpeg');
}
// Function to display the original image on the canvas
function displayOriginalImage(image, width, height) {
    const ctx = outputCanvasElement.getContext('2d');
    if (!ctx)
        return;
    ctx.clearRect(0, 0, outputCanvasElement.width, outputCanvasElement.height);
    outputCanvasElement.width = width;
    outputCanvasElement.height = height;
    ctx.drawImage(image, 0, 0);
    displayProcessedResult(outputCanvasElement);
}
// Function for locking and unlocking the slider
function setSliderDisabled(isDisabled) {
    blurRadiusRangeElement.disabled = isDisabled;
}
// Function to update the displayed radius value
function updateRadiusDisplay(radius) {
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
    }
    catch (error) {
        console.error(ERRORS.IMAGE_PROCESSING);
    }
    finally {
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
    const threadCount = Math.max(1, Math.min(parseInt(threadCountInputElement.value, 10), 64));
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
    if (!isSliderFocused)
        return;
    const currentValue = parseInt(blurRadiusRangeElement.value, 10);
    if (event.key === 'ArrowRight') {
        blurRadiusRangeElement.value = (currentValue + 1).toString();
    }
    else if (event.key === 'ArrowLeft') {
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
    showProcessingIndicator(); // Показать индикатор
    const radius = parseInt(blurRadiusRangeElement.value, 10);
    setSliderDisabled(true); // Блокировать бегунок
    try {
        let threadCount = parseInt(threadCountRangeElement.value, 10);
        updateControlValues(threadCountInputElement, threadCountRangeElement, parseInt(threadCountRangeElement.value, 10));
        await applyGaussianBlur(radius, threadCount); // Запуск обработки
    }
    catch (error) {
        console.error(ERRORS.IMAGE_PROCESSING, error);
    }
    finally {
        setSliderDisabled(false); // Разблокировать бегунок
        hideProcessingIndicator(); // Скрыть индикатор после завершения обработки
    }
});
// Event handler for selecting a file via the <input type="file"> element
fileInputElement.addEventListener('change', () => {
    const file = fileInputElement.files[0];
    if (!file) {
        return;
    }
    const reader = new FileReader();
    reader.onload = event => {
        uploadedImageElement.src = event.target.result;
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
export { displayProcessedResult, displayOriginalImage, uploadedImageElement };
