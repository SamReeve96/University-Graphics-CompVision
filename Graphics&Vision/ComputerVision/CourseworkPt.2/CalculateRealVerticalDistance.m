% Used to calcualte the distance between points on an image and the base of the image, can be used to calcualte distance traveled between frames or
% lengths of objects
function [oneDistanceFromImgBase, twoDistanceFromImgBase] = CalculateRealVerticalDistance(pixelPosOne, pixelPosTwo, centerOfImageY, adjacentLength)
    pixelToDegrees = 0.042; 
    cameraAngleDifferenceFromVertical = 60;

    % Calculate the length of a point on the image from the base of the image frame
    oneDistanceFromImgCenter = (pixelPosOne - centerOfImageY);
    oneAngularDiff = cameraAngleDifferenceFromVertical - (oneDistanceFromImgCenter * pixelToDegrees);
    oneDistanceFromImgBase = adjacentLength * tand(oneAngularDiff);

    % Calculate the length of another point on the image from the base of the image frame
    twoDistanceFromImgCenter = (pixelPosTwo - centerOfImageY);
    twoAngularDiff = cameraAngleDifferenceFromVertical - (twoDistanceFromImgCenter * pixelToDegrees);
    twoDistanceFromImgBase = adjacentLength * tand(twoAngularDiff);
end
