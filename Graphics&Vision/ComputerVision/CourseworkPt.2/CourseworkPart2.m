close all
clear

% Constants
MaxVehicleWidth = 2.5; % in meters
MaxVehicleSpeed = 30; % in miles per hour
FireEngineWidthLengthRatio = 3/1;
TimeBetweenFrames = 0.1; %Seconds

% Ask user for two frames to process

files = {};

disp('Please enter two file names to compare, please include file extension e.g. ".jpg"');
file1 = input('Enter filename 1');
file2 = input('Enter filename 2');

files = {file1, file2};

% Calculate all vehicle data for files provided
numberOfFiles = numel(files);

if numberOfFiles > 2
    disp('Must enter two filenames');
end

numberOfAttributes = 6; %filename, Width, length, width/Length ratio, position, colour, image
vehicleData = {'filename', 'Pixel width', 'Pixel length', 'Pixel width/length ratio', 'Pixel CenterPosition', 'Vehicle Colour', 'image'};
for i = 1:numberOfFiles
    [carWidth, carLength, carCenterPosition, carColour, RGBImage] = findCarData(string(files{i}), i);
    newVehicleData = [{string(files{i})}, carWidth, carLength, carWidth/carLength, carCenterPosition, carColour, RGBImage];
    vehicleData = [vehicleData;newVehicleData];
end

compareFrames(vehicleData, file1, file2);

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
    targetBoundaryImage = bound2im(maxTargetBoundry, M, N, min(maxTargetBoundry(:,1)),min(maxTargetBoundry(:,2)));

    minCoord = min(maxTargetBoundry);
    top = minCoord(1);
    left = minCoord(2);

    maxCoord = max(maxTargetBoundry);
    bottom = maxCoord(1);
    right = maxCoord(2);

    yMiddle = (right-left)/2 + left;
    xMiddle = (bottom-top)/2 + top;

    % calc the distance from front of vehicle to origin(S)
    % S = 7 tan alpha  CONFIRM trig
    % alpha = 60 - theta
    % theta = pixel delta * 0.042
    % pixel delta = pixel difference from vehicle front to center point of image
    carFront = top;
    carBack = bottom;

    centerOfImageX, centerOfImageY = size(targetRGB);

    carLeft = left;
    carRight = right;



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

%  Calc pixel value to real world length (meters)
function pixel2RealLength(vehicleData, filename)
    currentVehicle = getVehicleData(vehicleData, filename);
    % calc the distance from front of vehicle to origin(S)
    % S = 7 tan alpha  CONFIRM trig
    % alpha = 60 - theta
    % theta = pixel delta * 0.042
    % pixel delta = pixel difference from vehicle front to center point of image


end

% Calc the pixel value to realworld width (meters)
function pixel2RealWidth()
end