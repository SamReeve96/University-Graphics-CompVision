close all
clear

% Constants
MaxVehicleWidth = 2.5; % in meters
MaxVehicleSpeed = 30 % in miles per hour
FireEngineWidthLengthRatio = 3/1 

% Calculate all vehicle data
files = {'001.jpg','002.jpg','003.jpg','004.jpg','005.jpg','006.jpg','007.jpg','008.jpg','009.jpg','010.jpg','011.jpg','oversized.jpg','fire01.jpg','fire02.jpg'};
numberOfFiles = numel(files);
numberOfAttributes = 6; %filename, Width, length, width/Length ratio, position, colour, image
vehicleData = {'filename', 'Pixel width', 'Pixel length', 'Pixel width/length ratio', 'Pixel CenterPosition', 'Vehicle Colour', 'image'};
for i = 1:numberOfFiles
    [carWidth, carLength, carCenterPosition, carColour, RGBImage] = findCarData(string(files{i}), i);
    newVehicleData = [{string(files{i})}, carWidth, carLength, carWidth/carLength, carCenterPosition, carColour, RGBImage];
    vehicleData = [vehicleData;newVehicleData];
end

% test method calls
compareFrames(vehicleData, 'fire01.jpg', 'fire02.jpg');
compareFrames(vehicleData, '003.jpg', 'fire02.jpg');
compareFrames(vehicleData, '001.jpg', '011.jpg');

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
    vehicleIsRed = strcmp(vehicleOneData(6), 'Red');
    if (vehicleIsRed) % && vehicleWidthLengthRatio =< FireEngineWidthLengthRatio % Need a boundry for this?
        disp('Vehicle is red, and has the width/length ratio of a fire truck');
        disp('Therefore a fire truck, exempt from further processing'); %UPDATE TO STATE YOU CONSIDERED WIDTH/LENGTH
        return;
    else
        disp('Vehicle is either not red and/or does not have the width/length ratio of a fire truck');
        disp('Therefore, check for speeding and that vehicle is not too wide');
    end


    % check if its too wide in M
    disp('Check Vehicle width');

    % if so calc speed of car
    % Delta pos / time in mph
    
    %check if speeding
    disp('Check Vehicle speed');

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


function [carWidth, carLength, carCenterPosition, carColour, RGBImage] = findCarData(filepath, fileIndex)
    % load the Car target model
    targetRGB = imread(filepath);

    targetHSV = rgb2hsv(targetRGB);
    targetHue = targetHSV(:,:,2);

    targetBW = imbinarize(targetHue);

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

    yMiddle = (right-left)/2 + left;
    xMiddle = (bottom-top)/2 + top;
    carWidth = (right-left);
    carLength = (bottom-top);

% NEED TO CONVERT PIXEL VALUES TO REAL WORLD

    carWidthLengthRatio = (carWidth/carLength);
    carCenterPosition = [yMiddle,xMiddle];
    
    % vehicle colour
    mask =  imclearborder(targetBW);

    targetRedChannel = targetRGB(:,:,1);
    targetGreenChannel = targetRGB(:,:,2);
    targetBlueChannel = targetRGB(:,:,3);

    meanRed = mean(targetRedChannel(mask));
    meanGreen = mean(targetGreenChannel(mask));
    meanBlue = mean(targetBlueChannel(mask));

    carColour = 'undefined';

    if meanRed > meanBlue && meanRed > meanGreen
        carColour = 'Red';
    elseif meanGreen > meanBlue && meanGreen > meanRed
        carColour = 'Green';
    elseif meanBlue > meanGreen && meanBlue > meanRed
        carColour = 'Blue';
    end

    RGBImage = targetRGB;
end

