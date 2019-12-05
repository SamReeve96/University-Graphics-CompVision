close all
clear

% Ask user for two frames to process
disp('Please enter two file names to compare, please include file extension and put it in quotations e.g." "001.jpg" " ');
file1 = input('Enter filename 1');
file2 = input('Enter filename 2');
files = {file1, file2};

% Initialize vehicle data cell array
vehicleData = {};

% for every file provided, generate vehicle data and store as a row in the vehicle data cell array
for file = files
    [vehicleWidth, vehicleLength, vehicleBoundaryPoints, vehicleColour, vehicleRGBImage, vehicleSatImage, vehicleBWImage, vehicleBoundaryImage] = CalculateVehicleData(string(file));
    newVehicleData = [{string(file)}, vehicleWidth, vehicleLength, vehicleWidth/vehicleLength, vehicleCenterPosition, vehicleColour, vehicleRGBImage, vehicleSatImage, vehicleBWImage, vehicleBoundaryImage];
    vehicleData = [vehicleData;newVehicleData];
end

% Convert vehicle cell array to table with headings
vehicleDataTable = cell2table(vehicleData, 'VariableNames',{'filename', 'vehicleWidth', 'vehicleLength', 'vehicleWidth/vehicleLength', 'vehicleBoundaryPoints', 'vehicleColour', 'vehicleRGBImage', 'vehicleSatImage', 'vehicleBWImage', 'vehicleBoundaryImage'});

% Compare two frames of images to detect vehicle type and width or speed violations
CompareFrames(vehicleData, file1, file2);