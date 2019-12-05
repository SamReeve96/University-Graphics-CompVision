% Testing Script - 
% Generates vehicle data for all images, then calls the compare frames method to test for all possible senarios
% You don't need to provide any arguments, just run this script to execute the test.
% Information will be displayed in the command window, however for convinience critical information, 
% i.e. decision about the vehicle are stored in a table called "testResultsTable" open this in the workspace 
% to see what decisions were made for each pair of images
% to see the raw data check the "vehicleDataTable" table

close all
clear

% Initialize vehicle data cell array
vehicleData = {};

% for every file, generate vehicle data and store as a row in the vehicle data cell array
files = {'001.jpg','002.jpg','003.jpg','004.jpg','005.jpg','006.jpg','007.jpg','008.jpg','009.jpg','010.jpg','011.jpg','oversized.jpg','fire01.jpg','fire02.jpg'};
for file = files
    [vehicleWidth, vehicleLength, vehicleBoundaryPoints, vehicleColour, vehicleRGBImage, vehicleSatImage, vehicleBWImage, vehicleBoundaryImage] = CalculateVehicleData(string(file));
    newVehicleData = [{string(file)}, vehicleWidth, vehicleLength, vehicleWidth/vehicleLength, vehicleBoundaryPoints, vehicleColour, vehicleRGBImage, vehicleSatImage, vehicleBWImage, vehicleBoundaryImage];
    vehicleData = [vehicleData;newVehicleData];
end

% Convert vehicle cell array to table with headings
vehicleDataTable = cell2table(vehicleData, 'VariableNames',{'filename', 'vehicleWidth', 'vehicleLength', 'vehicleWidth/vehicleLength', 'vehicleBoundaryPoints', 'vehicleColour', 'vehicleRGBImage', 'vehicleSatImage', 'vehicleBWImage', 'vehicleBoundaryImage'});

% Store the results of all tests in a table, as it's easier to evaluate than checking the commnad window
testResultsTable = testAllSituations(vehicleData);

% Test all combinations of files that produce different results to cover all functional senarios
function testResultsTable = testAllSituations(vehicleData)
    tests = {
    {'001.jpg','002.jpg'},              % Test that cars with an appropriate width and speed are not reported
    {'oversized.jpg', 'oversized.jpg'}, % Test that cars that are too wide are reported
    {'001.jpg', '011.jpg'},             % Test that cars going too fast are reported
    {'fire01.jpg', 'fire02.jpg'},       % Test that fire engines are detected and ignored
    {'001.jpg', 'fire01.jpg'}           % Test that vehicle mismatch is detected and not processed
    };
    numberOfTests = numel(tests);
    testResults = {};

    for i = 1:numberOfTests
        testFiles = tests{i};
        testFileOne = string(testFiles{1});
        testFileTwo = string(testFiles{2});
        [vehiclesAreSameColour, vehicleIsRed, avgVehicleWidthLengthRatio, fireTruckCheckResult, avgVehicleWidth, widthCheckResult, vehicleSpeed, speedCheckResult, reportedResult] = CompareFrames(vehicleData, testFileOne, testFileTwo); 
        newTestResults = {testFileOne, testFileTwo, vehiclesAreSameColour, vehicleIsRed, avgVehicleWidthLengthRatio, fireTruckCheckResult, avgVehicleWidth, widthCheckResult, vehicleSpeed, speedCheckResult, reportedResult};
        testResults = [testResults; newTestResults];
    end
    
    % Convert testResults cell array to table with headings
    testResultsTable = cell2table(testResults, 'VariableNames',{'testFileOne', 'testFileTwo', 'Are vehicles the same colour', 'is vehicle red', 'Average vehicle width (between frames)', 'firetruck Check Result' , 'Average vehicle width', 'width Check Result', 'vehicle Speed', 'speedCheckResult', 'reportedResult'});
            
end