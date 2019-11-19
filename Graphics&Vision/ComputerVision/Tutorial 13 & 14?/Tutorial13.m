%Good to clear the workspace to free up any unused variables
clear;

%Read in the image to process
im = imread('circles.jpg');

%convert the image to a binary image passing the image and the threshold value
bw = im2bw(im, 0.7);
%Extra: look at imbinarize to compare perfomrance

%label the binary image using bwLabel and use the 4 0r 8 connected neighbourhood options, 
%producing:
%L: a 2D matrix of size MxN and
%num: the total number of isolated regions
[L,num] = bwlabel(bw,4);

%convert the label matrix L to an RGB image (so we can see the result)
rgb = label2rgb(L);

%Display the result
figure, imshow(rgb);