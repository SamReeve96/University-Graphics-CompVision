% Using the vehicle data and frames provided, check details about the vehicle across each frame (i.e. vehicle type, width and speed)
function [fireTruckCheckResult, widthCheckResult, speedCheckResult, reportedResult] = CompareFrames(vehicleData, filename1, filename2)
    % Initialize result strings (these are output to the console, and also stored in a table if running the test script)
    fireTruckCheckResult = 'Not checked';
    widthCheckResult = 'Not checked';
    speedCheckResult = 'Not checked';
    reportedResult = 'Not checked';

    % Retrieve vehicle data from vehicle data cell array
    vehicleOneData = GetVehicleData(vehicleData, filename1);
    vehicleTwoData = GetVehicleData(vehicleData, filename2);

    figure('Name', [vehicleOneData{1}]);
    % Display Saturation images
    subplot(1,4,1)
    imshow(vehicleOneData{8});
    % Display binary images
    subplot(1,4,2)
    imshow(vehicleOneData{9});
    % Display images with their boundboxes
    subplot(1,4,3)
    imshow(vehicleOneData{10});
    % Display images with their centers
    DisplayImageWithPOICrosses(vehicleOneData);

    figure('Name', vehicleTwoData{1});
    % Display Saturation images
    subplot(1,4,1)
    imshow(vehicleTwoData{8});
    % Display binary images
    subplot(1,4,2)
    imshow(vehicleTwoData{9});
    % Display images with their boundboxes
    subplot(1,4,3)
    imshow(vehicleTwoData{10});
    % Display images with their centers
    subplot(1,4,4)
    DisplayImageWithPOICrosses(vehicleTwoData);

    % Check the images contain vehicles of the same colour
    vehiclesAreSameColour = strcmp(vehicleOneData(6), vehicleTwoData(6));
    if ~(vehiclesAreSameColour)
        reportedResult = ('Error: vehicles are not the same colour, check images');
        disp(reportedResult);
        return;
    end

    disp('-- Checking Vehicle type --');
    % Check if vehicle is a fire engine (colour = red, width/length ratio)
    FireEngineWidthLengthRatio = 1/3;
    vehicleIsRed = strcmp(vehicleOneData(6), 'Red')
    avgVehicleWidthLengthRatio = (vehicleOneData{4} + vehicleTwoData{4})/2
    vehicleWidthLengthRatioIsNearFireEngine = (avgVehicleWidthLengthRatio >= (FireEngineWidthLengthRatio - 0.1) && avgVehicleWidthLengthRatio <= (FireEngineWidthLengthRatio + 0.1));

    if (vehicleIsRed && vehicleWidthLengthRatioIsNearFireEngine)
        fireTruckCheckResult = 'vehicle detected as a fireTruck';
        reportedResult = 'vehicle will not be tested as it is a fire truck';
        disp(reportedResult);
        return;
    else
        fireTruckCheckResult = 'vehicle detected as not a firetruck';
    end
    disp(fireTruckCheckResult);

    % Initialze report vehicle variable, used to inform whether the vehicle has violated restrictions (width or speed)
    reportVehicle = false;

    % Check if vehicle is too wide in meters using the average calculated vehicle width across both frames
    disp('-- Checking Vehicle width --');
    MaxVehicleWidth = 2.5; 
    avgVehicleWidth = (vehicleOneData{2} + vehicleTwoData{2})/2

    if (avgVehicleWidth > MaxVehicleWidth)
        widthCheckResult = 'Vehicle is too wide';
        reportVehicle = true;
    else
        widthCheckResult = 'Vehicle is of an accetable width';
    end
    disp(widthCheckResult);

    % Calculate the speed of the vehicle between the two frames
    [vehicleCenterOneX, vehicleCenterOneY] = calculateVehicleCenter(vehicleOneData{5});
    vehicleCenterOne = [vehicleCenterOneX, vehicleCenterOneY];
    [vehicleCenterTwoX, vehicleCenterTwoY] = calculateVehicleCenter(vehicleTwoData{5});
    vehicleCenterTwo = [vehicleCenterTwoX, vehicleCenterTwoY];

    vehicleSpeed = CalculateVehicleSpeed(vehicleCenterOne, vehicleCenterTwo)

    % Check if vehicle is traveling too fast
    disp('-- Check Vehicle speed --');
    MaxVehicleSpeed = 30;
    if (vehicleSpeed > MaxVehicleSpeed)
        speedCheckResult = 'Vehicle is going too fast';
        reportVehicle = true;
    else
        speedCheckResult = 'Vehicle is traveling at an acceptable speed';
    end
    disp(speedCheckResult);

    % Report vehicle if it has violated width or speed limit
    if (reportVehicle == true)
        reportedResult = 'Vehicle has violated limits, and should be reported';
    else
        reportedResult = 'Vehicle has not violated limits, and should be not reported';
    end
    disp(reportedResult);

end

% Return the coordinates of the vehicle center, given the left, right, back and front most points
function [vehicleCenterX, vehicleCenterY] = calculateVehicleCenter(vehicleBoundaries)
    vehicleFrontPoint = vehicleBoundaries(1);
    vehicleLeftPoint = vehicleBoundaries(2);
    vehicleBackPoint = vehicleBoundaries(3);
    vehicleRightPoint = vehicleBoundaries(4);

    % Calculate the center of the vehicle
    vehicleCenterX = (vehicleLeftPoint-vehicleRightPoint)/2 + vehicleRightPoint;
    vehicleCenterY = (vehicleBackPoint-vehicleFrontPoint)/2 + vehicleFrontPoint;
end

% Draw a cross on an image at the points of interest (left, right, front and back most points)
function DisplayImageWithPOICrosses(vehicleData)
    % Show image of car in RGB
    subplot(1,4,4)
    imshow(vehicleData{7}), hold on;

    vehicleFrontPoint = vehicleData{5}(1);
    vehicleLeftPoint = vehicleData{5}(2);
    vehicleBackPoint = vehicleData{5}(3);
    vehicleRightPoint = vehicleData{5}(4);

    [vehicleCenterX,vehicleCenterY] = calculateVehicleCenter(vehicleData{5});

    % vehicle Center
    drawCross(vehicleCenterX, vehicleCenterY, [1.0,1.0,1.0]);

    % Vehicle Front most point (in center of X dimension)
    drawCross(vehicleCenterX, vehicleFrontPoint, [1.0,1.0,1.0]);
    % Vehicle Left most point (in center of Y dimension)
    drawCross(vehicleLeftPoint, vehicleCenterY, [1.0,1.0,1.0]);
    % Vehicle Back most point (in center of Y dimension)
    drawCross(vehicleCenterX, vehicleBackPoint, [1.0,1.0,1.0]);
    % Vehicle Right most point (in center of X dimension)
    drawCross(vehicleRightPoint, vehicleCenterY, [1.0,1.0,1.0]);
end

function drawCross(x,y, colour)
        % Draw a horizotal bar at the centre
        xLine = [x-10,x+10];
        yy = [y,y];
        plot(xLine,yy,'LineWidth', 2, 'Color', colour);
    
        % Draw a vertical bar at the centre
        xx = [x,x];
        yLine = [y-10,y+10];
        plot(xx,yLine,'LineWidth', 2, 'Color', colour);
end

% Retrieve vehicle data from cell array for certain file
function vehicle = GetVehicleData(vehicleData, filename)
    vehicleIndex = find(strcmp([vehicleData{:,1}], filename));
    vehicle = vehicleData(vehicleIndex,:);
end

% Calculate the speed of a vehicle between two points using the Y delta in pixels
function vehicleSpeed = CalculateVehicleSpeed(vehicleOneCenterPoint, vehicleTwoCenterPoint)
    imageVerticalResolution = 640;
    centerOfImageY = (imageVerticalResolution/2);
    cameraHeight = 7;
    metersPerSecondToMilesPerHour = 2.236936; % 1ms = 2.236936mph
    timeBetweenFrames = 0.1; 

    [vehicleOneDistance, vehicleTwoDistance] = CalculateRealVerticalDistance(vehicleTwoCenterPoint(2), vehicleOneCenterPoint(2), centerOfImageY, cameraHeight);
    distanceTraveled =  vehicleOneDistance - vehicleTwoDistance;

    metersPerSecondSpeed = distanceTraveled/timeBetweenFrames;

    vehicleSpeed = metersPerSecondSpeed * metersPerSecondToMilesPerHour;
end