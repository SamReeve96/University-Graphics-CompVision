filepath = 'cube.png';
rgb = imread(filepath);

gray = rgb2gray(rgb); %convert to intensity
BW = edge(gray, 'canny'); %extract edges

% figure, imshow(BW);

[H,T,R] = hough(BW, 'RhoResolution', 0.5, 'ThetaResolution', 0.5);

subplot(2,1,1);
imshow(rgb);
title(filepath);
