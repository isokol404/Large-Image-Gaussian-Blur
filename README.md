# High performance blur implementation in Typescript

## Task descriptions

For the browser implement in TypeScript an app that performs Gaussian blur on a(potentially large) images. Image could be selected by URL or from the local filesystem.
Blur radius shall be selectable from app UI.

## Special considerations

Consider using concurrency using Web workers or GPU shaders.
Implement image transformation yourself, do not use existing libraries or
CSS-based solutions.

# SOLUTION
## How to use:
- index.html - the starting and only page
- You can select a file in two ways:
1) Click the "Choose File" button.
2) Enter the image URL in the text field "Enter image URL" and click the "Load Image by URL" button.
- To save resources, when the "Blur Radius" parameter is set to 0, the Gaussian filter calculation does not occur.
- Gaussian filter calculation is performed when the Blur Radius value is changed. It is limited to values from 0 to 100.
- You can set the maximum number of threads. Based on the maximum value, the program will suggest its optimal number of threads. When the thread count is changed, the Gaussian filter is not launched. The optimal value at which the constant calculation will be displayed in the “Optimal amount applied:” field.

## Сomments:
### Parallelization
The speed of operation is achieved through parallelizing the convolution process, which is performed by workers. The number of workers is determined based on the number of segments into which the image can be divided. Experimentally, the width of a single segment has been set to 300 pixels.

The parallel operation of the algorithm is achieved by dividing the image processing into segments that are processed independently of each other. The optimal method of division is found to be horizontal segment separation. This choice is justified by the fact that when vertically segmenting, complexities arise in managing dependencies between pixels located above and below the current segment. We cannot guarantee that the pixels above have already been processed, which can significantly complicate the combination of results.

With horizontal segment separation, these complexities are eliminated, as each segment is processed horizontally independently of the others. This ensures the correct sequence of operations and allows for the efficient combination of results. Thus, the choice of horizontal segment separation is the most suitable and secure way to ensure the parallel operation of the algorithm.

### Additional remarks
Access error can occur via the URL - it solely depends on the server configuration where the image is hosted. Below is an example of a small image illustrating the functionality of the loading process.

## "Links (images for testing):"
- [Cat](https://hips.hearstapps.com/hmg-prod/images/cute-cat-photos-1593441022.jpg?crop=0.670xw:1.00xh;0.167xw,0&resize=980:*)❗
