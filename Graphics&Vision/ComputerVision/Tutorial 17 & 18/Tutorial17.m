filepath = 'eye2.jpg';
rgb = imread(filepath);

intensity = rgb2gray(rgb); %convert to intensity
BW = edge(intensity, 'canny'); %extract edges

[H,T,R] = hough(BW, 'RhoResolution', 0.5, 'ThetaResolution', 0.5);

%Display image
imshow(rgb);
title('edges');

lower_limit = 32;
high_limit = 58;
increment = 1;

radii = lower_limit:increment:high_limit;

[h, margin] = circle_hough(BW, radii, 'normalise');

peaks = circle_houghpeaks(h, radii, margin, 'nhoodxy', 15, 'nhoodr', 21, 'npeaks', 1, 'threshold', 0.5);

%Construct image of black
[M,N] = size(rgb);
g = zeros(M,N);
g_im = mat2gray(g);
figure, imshow(g_im);
hold on;

% draw circles
for peak = peaks
    [x, y] = circlepoints(peak(3));
    plot(x+peak(1), y+peak(2), 'y-');
    %y- means solid yellow line
end
