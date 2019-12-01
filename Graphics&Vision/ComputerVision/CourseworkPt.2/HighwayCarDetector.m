close all
clear

% load the Car target model
targetRGB = imread('oversized.jpg');
targetBW = im2bw(targetRGB, 0.33);

[l, num] = bwlabel(targetBW, 4);

labelToShow = label2rgb(l);

figure, imshow(targetBW);
