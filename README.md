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
1) Click the "Choose File" button (preferrable)
2) Enter the image URL in the text field "Enter image URL" and click the "Load Image by URL" button (this method is used for small images).
- To save resources, when the "Blur Radius" parameter is set to 0, the Gaussian filter calculation does not occur.
- Gaussian filter calculation is performed when the Blur Radius value is changed. It is limited to values from 0 to 100.
- You can set the maximum number of threads (more about that below). Based on the maximum value, the program will suggest its optimal number of threads. When the thread count is changed, the Gaussian filter is not launched. The optimal value at which the constant calculation will be displayed in the “Optimal amount applied:” field.

## Сomments:
### Parallelization
The maximum number of threads is 16 according to the fact that processors with 16 or more cores are quite expensive and rare - for example, _i9-13900_ with 24 cores costs about 70 000 roubles.
Moreover, multiple threads that sharing same core, roughly speaking, are working in concurrent mode, not parallel. 
So, for better efficiency, I decided to limit maximum threads count to 16 pcs. 
For example, if I run it for 64 threads, my computer processes big images much longer that for 16 threads (and even crashes to BSOD!) 

This project implements a **basic** Gaussian blur algorithm without significant algorithmic optimizations (such as box evaluations, for example).

Convolution process is parallelized: original image sliced to segments, and each segment is being processed independently with its own worker. The number of workers based on the number of segments and threads count.

Due to algorithm implementation, i.e. order of vertical and horisontal blurring, I faced with some difficulties with detection of pixels in neighbour vertical segment (because every segment is being processed independently). So I decided to slice original image to vertical stripes - for avoiding that problem.

### Additional remarks
Access error can occur via the URL - it solely depends on the server configuration where the image is hosted. Below is an example of a small image illustrating the functionality of the loading process.

### Links (images for testing URL upload):
- [Cat](https://hips.hearstapps.com/hmg-prod/images/cute-cat-photos-1593441022.jpg?crop=0.670xw:1.00xh;0.167xw,0&resize=980:*)❗
