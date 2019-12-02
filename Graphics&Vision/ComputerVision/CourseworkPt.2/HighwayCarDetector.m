close all
clear

files = {'001.jpg','002.jpg','003.jpg','004.jpg','005.jpg','006.jpg','007.jpg','008.jpg','009.jpg','010.jpg','011.jpg','oversized.jpg','fire01.jpg','fire02.jpg'};
numberOfFiles = numel(files);
numberOfAttributes = 6; %filename, Width, length, width/Length ratio, position, colour, image
vehicleData = {'filename', 'width', 'length', 'width/length ratio', 'BottomPosition', 'colour', 'image'};

for i = 1:numberOfFiles
    [carWidth, carLength, carBottomPosition, carColour, RGBImage] = findCarData(string(files{i}), i);
    newVehicleData = [{string(files{i})}, carWidth, carLength, carWidth/carLength, carBottomPosition, carColour, RGBImage];
    vehicleData = [vehicleData;newVehicleData];
end

displayImageWithBottomCross(vehicleData, 'fire01.jpg');

function displayImageWithBottomCross(vehicleData, filename)
    %get data for image 001 for example
    vechIndex = find(strcmp([vehicleData{:,1}], filename))
    currentVehicle = vehicleData(vechIndex,:);
    currentVehiclePos = cell2mat(currentVehicle(5));
    figure, imshow(currentVehicle{7}), hold on;

    % plot the centre of the template
    % draw a horizotal bar at the cntre
    xx = [currentVehiclePos(1)-10,currentVehiclePos(1)+10];
    yy = [currentVehiclePos(2),currentVehiclePos(2)];
    plot(xx,yy,'LineWidth', 2, 'Color',[0.0,1.0,0.0]); % drawing

    % draw a vertical bar at the centre
    xx = [currentVehiclePos(1), currentVehiclePos(1)];
    yy = [currentVehiclePos(2)-10,currentVehiclePos(2)+10];
    plot(xx,yy,'LineWidth', 2, 'Color',[0.0,1.0,0.0]);
end


function [carWidth, carLength, carBottomPosition, carColour, RGBImage] = findCarData(filepath, fileIndex)
    % load the Car target model
    targetRGB = imread(filepath);

    targetHSV = rgb2hsv(targetRGB);
    targetHue = targetHSV(:,:,2);

    targetBW = imbinarize(targetHue);

    % % % % Remove noise from BW image
    % erodElemSize = 1;
    % erodSElem = strel('square', erodElemSize);
    % targetEroded = imerode(targetBW, erodSElem);

    % % % % Close off the image (fill gaps)
    % closeElemSize = 1;
    % closeSElem = strel('square', closeElemSize);
    % targetClosed = imclose(targetEroded, closeSElem);

    % blna
    [targetBoundries, targetLabels, targetTotalObjects, targetDependancies] = bwboundaries(targetBW); 

    % find largest boundary
    LengthOfEachCell = cellfun('length', targetBoundries);
    [maxCellLength, index] = max(LengthOfEachCell);
    maxTargetBoundry = targetBoundries{index};

    % Show boundary
    [M N] = size(targetBW);
    g1 = bound2im(maxTargetBoundry, M, N, min(maxTargetBoundry(:,1)),min(maxTargetBoundry(:,2)));

    minCoord = min(maxTargetBoundry);
    top = minCoord(1);
    left = minCoord(2);

    maxCoord = max(maxTargetBoundry);
    bottom = maxCoord(1);
    right = maxCoord(2);

    bumperMiddle = (right-left)/2 + left;

    carWidth = (right-left);
    carLength = (bottom-top);
    fireTruckWidthLengthRatio = (1/3);
    carWidthLengthRatio = (carWidth/carLength);
    istheRatioGreaterThanFireTruck = fireTruckWidthLengthRatio >= carWidthLengthRatio;
    carBottomPosition = [bumperMiddle,bottom];
    carColour = 9002;
    RGBImage = targetRGB;
end

