filepath = 'cube.png';
rgb = imread(filepath);

intensity = rgb2gray(rgb); %convert to intensity
BW = edge(intensity, 'canny'); %extract edges

% figure, imshow(BW);

[H,T,R] = hough(BW, 'RhoResolution', 0.5, 'ThetaResolution', 0.5);

%Display image
subplot(2,1,1);
imshow(rgb);
title(filepath);

%Display hough matrix
subplot(2,1,2);
imshow(imadjust(mat2gray(H)), 'Colormap', hot, 'XData', T, 'YData', R, 'InitialMagnification', 'fit');
title('Hough transform of cube.png');
xlabel('\theta'), ylabel('\rho');
axis on, axis normal, hold on;

%Find peaks
num = 9;
P = houghpeaks(H, num);

%Plot peaks
plot(T(P(:,2)),R(P(:,1)),'s','color','yellow');

