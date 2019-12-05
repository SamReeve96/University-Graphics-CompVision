function [vehicleWidth, vehicleLength, vehicleBoundaryPoints, vehicleColour, vehicleRGBImage, vehicleSatImage, vehicleBWImage, vehicleBoundaryImage] = CalculateVehicleData(filepath)
    % Load the file as an RGB image
    vehicleRGBImage = imread(filepath);

    % Convert RGB to HSV and the isolate the Saturation value
    vehicleHSVImage = rgb2hsv(vehicleRGBImage);
    vehicleSatImage = vehicleHSVImage(:,:,2);

    % Convert satuation image to black and white image
    vehicleBWImage = imbinarize(vehicleSatImage);

    % Using the satuation and binary image, work out the colour of the image
    vehicleColour = GetVehicleColour(vehicleBWImage, vehicleRGBImage);

    % Using the binary image, detect the boundaries in the image
    [vehicleBoundries, vehicleLabels, vehicleTotalObjects, vehicleDependancies] = bwboundaries(vehicleBWImage); 

    % Find largest boundary
    LengthOfEachCell = cellfun('length', vehicleBoundries);
    [~, index] = max(LengthOfEachCell);
    maxvehicleBoundry = vehicleBoundries{index};

    % Create an image with just the largest boundary
    [M N] = size(vehicleBWImage);
    vehicleBoundaryImage = bound2im(maxvehicleBoundry, M, N, min(maxvehicleBoundry(:,1)),min(maxvehicleBoundry(:,2)));

    % Calculate the dimensions of the vehicle in the image (left/right/front/back most boundary point)
    minCoord = min(maxvehicleBoundry);
    vehicleFrontPoint = minCoord(1);
    vehicleLeftPoint = minCoord(2);
    maxCoord = max(maxvehicleBoundry);
    vehicleBackPoint = maxCoord(1);
    vehicleRightPoint = maxCoord(2);

    vehicleBoundaryPoints = [vehicleFrontPoint, vehicleLeftPoint, vehicleBackPoint, vehicleRightPoint];

    % calculate the center of the image using the image resolution
    centerOfImageY = (640/2);
    centerOfImageX = (320/2);

    % Camera height off the ground
    cameraHeight = 7; 

    % Calculate the length of the vehicle
    [vehicleFrontLength, vehicleBumperLength] = CalculateRealVerticalDistance(vehicleFrontPoint, vehicleBackPoint, centerOfImageY, cameraHeight);
    vehicleLength = vehicleFrontLength - vehicleBumperLength;

    % Calculate the average distance of the vehicle to the camera lens by calculating the widths at the front and back of the vehicle and averaging
    vehicleBumperToCameraBase = CalculateRealVerticalDistance(vehicleBackPoint, centerOfImageY, centerOfImageY, cameraHeight);
    cameraLensDistanceToVehicleBumper = sqrt(vehicleBumperToCameraBase^2 + cameraHeight^2);
    vehicleFrontToCameraBase = CalculateRealVerticalDistance(vehicleFrontPoint, centerOfImageY, centerOfImageY, cameraHeight);
    cameraLensDistanceToVehicleFront = sqrt(vehicleFrontToCameraBase^2 + cameraHeight^2);

    % Adjacent length used to calculate the width of the vehicle
    cameraLensToVehicleAvg = (cameraLensDistanceToVehicleBumper + cameraLensDistanceToVehicleFront)/2;

    % Calculate vehicle width
    vehicleWidth = CalculateRealHorizontalDistance(vehicleLeftPoint, vehicleRightPoint, centerOfImageX, cameraLensToVehicleAvg);

    % Calculate vehicle width/length ratio
    vehicleWidthLengthRatio = (vehicleWidth/vehicleLength);
end

function widthInMeters = CalculateRealHorizontalDistance(leftPixelPos, rightPixelPos, centerOfImageX, adjacentLength)
    pixelToDegrees = 0.042; 

    % Calculate the distance from the center of the car to the left of the car
    vehicleLeftDelta = leftPixelPos - centerOfImageX;
    vehicleLeftAngluarWidth = (vehicleLeftDelta * pixelToDegrees);
    vehicleLeftWidth = abs(adjacentLength * tand(vehicleLeftAngluarWidth));
    
    % Calculate the distance from the center of the car to the right of the car
    vehicleRightDelta = rightPixelPos - centerOfImageX;
    vehicleRightAngluarWidth = (vehicleRightDelta * pixelToDegrees);
    vehicleRightWidth = abs(adjacentLength * tand(vehicleRightAngluarWidth));

    % Add widths
    widthInMeters = vehicleLeftWidth + vehicleRightWidth;
end

function vehicleColour = GetVehicleColour(BWImage, RGBImage)
    % Create a mask with the binary image
    mask = imclearborder(BWImage);

    % Separate the RGB colour channels
    vehicleRedChannel = RGBImage(:,:,1);
    vehicleGreenChannel = RGBImage(:,:,2);
    vehicleBlueChannel = RGBImage(:,:,3);

    % Calculate the value of each channel
    meanRed = mean(vehicleRedChannel(mask));
    meanGreen = mean(vehicleGreenChannel(mask));
    meanBlue = mean(vehicleBlueChannel(mask));

    % Store the largest mean colour channel as the vehicle colour
    vehicleColour = 'undefined';
    if meanRed > meanBlue && meanRed > meanGreen
        vehicleColour = 'Red';
    elseif meanGreen > meanBlue && meanGreen > meanRed
        vehicleColour = 'Green';
    elseif meanBlue > meanGreen && meanBlue > meanRed
        vehicleColour = 'Blue';
    end
end