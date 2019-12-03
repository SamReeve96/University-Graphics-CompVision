close all
clear

% Calculate all vehicle data
% files = {'fire01.jpg','fire02.jpg'};
files = {'001.jpg','002.jpg','003.jpg','004.jpg','005.jpg','006.jpg','007.jpg','008.jpg','009.jpg','010.jpg','011.jpg','oversized.jpg','fire01.jpg','fire02.jpg'};
numberOfFiles = numel(files);
numberOfAttributes = 6; %filename, Width, length, width/Length ratio, position, colour, image
vehicleData = {'filename', 'vehicleWidth', 'vehicleLength', 'vehicleWidth/vehicleLength', 'vehicleCenterPosition', 'vehicleColour', 'vehicleImage'};
for i = 1:numberOfFiles
    [vehicleWidth, vehicleLength, vehicleCenterPosition, vehicleColour, vehicleImage] = findvehicleData(string(files{i}), i);
    newVehicleData = [{string(files{i})}, vehicleWidth, vehicleLength, vehicleWidth/vehicleLength, vehicleCenterPosition, vehicleColour, vehicleImage];
    vehicleData = [vehicleData;newVehicleData];
end

% compareFrames(vehicleData, 'fire01.jpg', 'fire02.jpg')
compareFrames(vehicleData, '001.jpg', '011.jpg')
% compareFrames(vehicleData, '001.jpg', '002.jpg')
% compareFrames(vehicleData, 'fire01.jpg', '001.j pg')

function compareFrames(vehicleData, filename1, filename2)
    % Display images with their centers
    displayImageWithCenterCross(vehicleData, filename1);
    vehicleOneData = getVehicleData(vehicleData, filename1);

    displayImageWithCenterCross(vehicleData, filename2);
    vehicleTwoData = getVehicleData(vehicleData, filename2);

    % check the images contain vehicles of the same colour
    vehiclesAreSameColour = strcmp(vehicleOneData(6), vehicleTwoData(6));
    if ~(vehiclesAreSameColour)
        disp('Error: vehicles are not the same colour, check images');
        return;
    end

    % Check if its a fire engine (colour, width/length ratio)
    FireEngineWidthLengthRatio = 0.33; %S Should be to 1/3
    vehicleIsRed = strcmp(vehicleOneData(6), 'Red')
    vehicleWidthLengthRatio = round(vehicleOneData{4} * 100)/100 %Should this be an average of the two frame values?
    % ROUNDED TO 2dp.

    if (vehicleIsRed) && (vehicleWidthLengthRatio == FireEngineWidthLengthRatio) % Need an area for this?
        disp('Vehicle is red, and has the width/length ratio of a fire truck');
        disp('Therefore a fire truck, exempt from further processing'); %UPDATE TO STATE YOU CONSIDERED WIDTH/LENGTH
        return;
    else
        disp('Vehicle is either not red and/or does not have the width/length ratio of a fire truck');
        disp('Therefore, check for speeding and that vehicle is not too wide');
    end


    % check if its too wide in M
    disp('Checking Vehicle width');
    MaxVehicleWidth = 2.5; % in meters
    vehicleWidth = vehicleOneData{2}

    if (vehicleWidth > MaxVehicleWidth)
        disp('Vehicle is too wide, report!');
    else
        disp('Vehicle is of an accetable width');
    end

    % calc speed of car - Delta pos / time in mph
    %Seconds
    vehicleSpeed = CalculateVehicleSpeed(vehicleOneData{5}, vehicleTwoData{5})
    
    %check if speeding
    MaxVehicleSpeed = 30; % in miles per hour
    disp('Check Vehicle speed');
    if (vehicleSpeed > MaxVehicleSpeed)
        disp('Vehicle is going too fast, report!');
    else
        disp('Vehicle is traveling at an acceptable speed');
    end

end

function displayImageWithCenterCross(vehicleData, filename)
    %get data for image 001 for example
    currentVehicle = getVehicleData(vehicleData, filename);
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

function vehicle = getVehicleData(vehicleData, filename)
    vehicleIndex = find(strcmp([vehicleData{:,1}], filename));
    vehicle = vehicleData(vehicleIndex,:);
end


function [vehicleWidth, vehicleLength, vehicleCenterPosition, vehicleColour, vehicleImage] = findvehicleData(filepath, fileIndex)
    % load the vehicle target model
    targetRGB = imread(filepath);

    targetHSV = rgb2hsv(targetRGB);
    targetHue = targetHSV(:,:,2);

    targetBW = imbinarize(targetHue);

    vehicleColour = GetVehicleColour(targetBW, targetRGB);

    vehicleImage = targetRGB;

    % blna
    [targetBoundries, targetLabels, targetTotalObjects, targetDependancies] = bwboundaries(targetBW); 

    % find largest boundary
    LengthOfEachCell = cellfun('length', targetBoundries);
    [~, index] = max(LengthOfEachCell);
    maxTargetBoundry = targetBoundries{index};

    % Show boundary
    [M N] = size(targetBW);
    targetBoundaryImage = bound2im(maxTargetBoundry, M, N, min(maxTargetBoundry(:,1)),min(maxTargetBoundry(:,2)));
    % figure, imshow(targetBoundaryImage);

    minCoord = min(maxTargetBoundry);
    front = minCoord(1);
    left = minCoord(2);

    maxCoord = max(maxTargetBoundry);
    back = maxCoord(1);
    right = maxCoord(2);


    xMiddle = (left-right)/2 + right;
    yMiddle = (back-front)/2 + front;

    vehicleCenterPosition = [xMiddle,yMiddle];

    [imageY, imageX] = size(targetBW);

    centerOfImageY = ((imageY - 1)/2);
    centerOfImageX = ((imageX - 1)/2);


    cameraHeight = 7; % meters high
    pixelToDegrees = 0.042; 

    vehicleLength = CalculateRealVerticalDistance(front, back, centerOfImageY, cameraHeight);

    % Calc length of adjecent (needs to be from center to widest point though)
    backDistanceFromImgCenter = (back - centerOfImageY);
    backAngularDiff = 60 - (backDistanceFromImgCenter * pixelToDegrees);
    vehicleBumperToCamera = cameraHeight * tand(backAngularDiff);
    cameraDistanceTovehicleBumper = sqrt(vehicleBumperToCamera^2 + cameraHeight^2); %adjacentLength

    vehicleWidth = CalculateRealHorizontalDistance(left, right, centerOfImageX, cameraDistanceTovehicleBumper);

    vehicleWidthLengthRatio = (vehicleWidth/vehicleLength);
end

function vehicleSpeed = CalculateVehicleSpeed(vehicleOneCenterPoint, vehicleTwoCenterPoint)
    %Calculate distance
    centerOfImageY = ((641 - 1)/2); % replace magic number
    cameraHeight = 7; % meters high
    distanceTraveled = CalculateRealVerticalDistance(vehicleOneCenterPoint(1), vehicleTwoCenterPoint(1), centerOfImageY, cameraHeight);
    
    timeBetweenFrames = 0.1; % Seconds
    metersPerSecond = distanceTraveled/timeBetweenFrames;

    ms2mph = 2.236936; % 1ms = 2.236936mph

    vehicleSpeed = metersPerSecond * ms2mph;
end

function lengthInMeters = CalculateRealVerticalDistance(topPixelPos, bottomPixelPos, centerOfImageY, adjacentLength)
    pixelToDegrees = 0.042; 

    frontDistanceFromImgCenter = (topPixelPos - centerOfImageY);
    frontAngularDiff = 60 - (frontDistanceFromImgCenter * pixelToDegrees);
    frontDistanceFromImgBase = adjacentLength * tand(frontAngularDiff);

    backDistanceFromImgCenter = (bottomPixelPos - centerOfImageY);
    backAngularDiff = 60 - (backDistanceFromImgCenter * pixelToDegrees);
    backDistanceFromImgBase = adjacentLength * tand(backAngularDiff);

    lengthInMeters = (frontDistanceFromImgBase - backDistanceFromImgBase);
end

function widthInMeters = CalculateRealHorizontalDistance(leftPixelPos, rightPixelPos, centerOfImageX, adjacentLength)

    vehicleLeftDelta = leftPixelPos - centerOfImageX;
    vehicleLeftAngluarWidth = (vehicleLeftDelta * 0.042);
    vehicleLeftWidth = abs(adjacentLength * tand(vehicleLeftAngluarWidth));
    
    vehicleRightDelta = rightPixelPos - centerOfImageX;
    vehicleRightAngluarWidth = (vehicleRightDelta * 0.042);
    vehicleRightWidth = abs(adjacentLength * tand(vehicleRightAngluarWidth));

    widthInMeters = vehicleLeftWidth + vehicleRightWidth;
end

function vehicleColour = GetVehicleColour(BWImage, RGBImage)
        % vehicle colour
        mask = imclearborder(BWImage);

        targetRedChannel = RGBImage(:,:,1);
        targetGreenChannel = RGBImage(:,:,2);
        targetBlueChannel = RGBImage(:,:,3);
    
        meanRed = mean(targetRedChannel(mask));
        meanGreen = mean(targetGreenChannel(mask));
        meanBlue = mean(targetBlueChannel(mask));
    
        vehicleColour = 'undefined';
    
        if meanRed > meanBlue && meanRed > meanGreen
            vehicleColour = 'Red';
        elseif meanGreen > meanBlue && meanGreen > meanRed
            vehicleColour = 'Green';
        elseif meanBlue > meanGreen && meanBlue > meanRed
            vehicleColour = 'Blue';
        end
end