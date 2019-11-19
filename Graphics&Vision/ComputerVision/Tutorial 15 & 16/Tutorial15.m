%Already a grayscale image
filepath = 'building.tif';

% built-in image with matlab image processing
filepath2 = 'cameraman.tif';

global im
im = imread(filepath);

sobleFilter();
gaussianFilter();
lapOfGauss();

function r = getImage()
    global im
    r = im;
end

% Using sobel filters
function sobleFilter()
    sx = [-1, 0, 1; -2, 0, 2; -1, 0, 1];
    sy = sx';

    xfilteredImage = filter2(sx, getImage());
    yfilteredImage = filter2(sy, getImage());

    xFilterOutputImage = xfilteredImage/255;
    yFilterOutputImage = yfilteredImage/255;

    % imshow(xFilterOutputImage);
    % imshow(yFilterOutputImage);

    % Calc the edges in both directions
    overallEdge = sqrt(xFilterOutputImage.^2 + yFilterOutputImage.^2);

    % imshow(overallEdge);

    % shows too much detail as a greyscale image
    ang = atan2(yfilteredImage, xfilteredImage);

    % imshow(ang);

    % ang as a color map image
    figure, imshow(ang);
    colormap jet;
end

% Use gaussian filters
function gaussianFilter()
    % Square filter size
    a = 10;

    % sigma is the standard deviation
    sigma = 5;

    gFilter = fspecial('gaussian', [a, a], sigma);

    % show the filter shape
    % surf(1:a, 1:a, gFilter);

% Repeated code, need to clean up
    gfilteredImage = filter2(gFilter, getImage());

    gFilterOutputImage = gfilteredImage/255;

    % gFilterOutputImage as a color map image
    figure, imshow(gFilterOutputImage);
    colormap jet;
end

% Using the laplacian of gaussian
function lapOfGauss()
    % Between 0 and 1
    threshold = 0.2;

    % Different filter methods
    method  = 'zerocross';
    method2 = 'soble';
    method3 = 'prewitt';
    method4 = 'log';
    method5 = 'canny';

    % filters
    filter_g = fspecial('gaussian', [5 5], 3);
    filter_la = fspecial('laplacian', 0);

    im_g = filter2(filter_g, getImage())/255;

    
    % Can exclude threshold to let ml work out the best option
    % building_edge = edge(im_g, method, threshold, filter_la);

    building_edge = edge(im_g, method, filter_la);

    % BW as a color map image
    figure, imshow(building_edge);
    colormap jet;
end