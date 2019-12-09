close all
clear

% load the left image
leftRGB = imread('left.jpg');
lg = rgb2gray(leftRGB);

% load the right image
rightRGB =  imread('right.jpg');
rg = rgb2gray(rightRGB);

% Define values for disparities and other quantities
% ZP is an array same as the image but stores depth value of each pixel

zp = 1000 * ones(size(lg));

% Store the disparities of pixels
disp = zeros(size(lg));

% Define the searching window for correspondence matching
% Size of the window is win_x by win_y
[M,N] = size(lg);
win_x = 15;
win_y = 15;

% Set the range of match searching in terms of disparity
minDisp = 5;
maxDisp = 35;

% Get the center of the window
w_c_x = round(win_x/2);
w_c_y = round(win_y/2);

% The correspondence search starts from top left corner of the image

for i = w_c_y : 1 : (M - w_c_y)
    % (N - w_c_x - maxDisp)
    % this ensures the search window will not get out the right margin of the image
    for j = w_c_x : 1 : (N - w_c_x - maxDisp)
        best = 100000; % initial ssd values is set to something very big

        for k = minDisp : 1 : maxDisp
            % Select areas from both left and right for matching
            Lwin = lg(i - w_c_y + 1: i + w_c_y, j - w_c_y + 1: j + w_c_x);
            Rwin = rg(i - w_c_y + 1: i + w_c_y, j - w_c_y + 1 + k: j + w_c_x + k);

            % compute the squared differnce
            s = Lwin - Rwin;
            s= s.^2;

            % Compute the squared difference sum (ssd)
            sqSum = 0;
            for jj = 1 : 1 : w_c_y
                sr = s(jj,:);
                sqSum = sqSum + sum(sr);
            end

            % check if the current ssd is the minimum so far
            % if yes, put it in a tempoary variable 'best'
            % and take k as the disparity, move to the next pixel
            if (sqSum < best)
                best = sqSum;
                disp(i,j) = k;
            end
        end
    end
end

% Convert disparities to a grayscale image
ii = mat2gray(disp);
figure, imshow(lg);
figure, imshow(rg);
figure, imshow(ii);

baseline = 100;
focal = 50;
% comp depth value
for i = 1 : 1 : M
    for j = 1 : 1 : N
        if(disp(i,j)~=0)
            zp(i,j) = focal * baseline / disp(i,j);
        end
    end
end

figure, mesh(1000-zp);


