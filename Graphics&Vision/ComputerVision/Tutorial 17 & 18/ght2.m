close all
clear
 
% load the template
template = imread('temp3.jpg');
imgBI=im2bw(template);
g=~imgBI;
%imshow(g)
 
% find the boundary of the template
B=bwboundaries(g);
d=cellfun('length',B);%find the length of B
[max_d,k]=max(d); % find the largest cell of B and return its index
b=B{k};
%b=cat(1,B{:});
[M N]=size(g);
g=bound2im(b,M,N,min(b(:,1)),min(b(:,2)));
%figure,imshow(g)
 
temp_edge=g;
figure('Name','Template Edge','NumberTitle','off'),imshow(g), hold on
 
% calcuate the centre of the template
Cx=0;
Cy=0; 
p=0;
[rows, columns]=size(temp_edge);
for i=1:columns
    for j=1:rows
        if(temp_edge(j,i)~=0)
            Cx=Cx+i;
            Cy=Cy+j;
            p=p+1;
        end
    end
end
Cx=round(Cx/p);
Cy=round(Cy/p);
 
% plot the centre of the template
% draw a horizotal bar at the cntre
xx = [Cx-10,Cx+10];
yy = [Cy,Cy];
plot(xx,yy,'LineWidth', 2, 'Color',[1.0,0.0,0.0]); % drawing
 
% draw a vertical bar at the centre
xx = [Cx, Cx];
yy = [Cy-10,Cy+10];
plot(xx,yy,'LineWidth', 2, 'Color',[1.0,0.0,0.0]);
 
% find the y,x cordinates of all edge points of the template (equal 1 in
% image temp_edge)
[y x]=find(temp_edge>0); 
template_point=size(x);% the total number of points in the template image
 
%calculate the gradients for each and every edge point of temp_edge
% this is done by calling function gradient_detection
gradient_angles = gradient_direction( temp_edge );
 
%Create the R-Table for the shape of temp_edge 
DiscreteAngleNo=180;% discretise the range of angle (0 deg. to 180 deg.) into intervals 
 
% We need to decide for each discrete angle, how many edge points will
% associate to it.
% for a reasonalby complex shape, this number should not be very big, but
% we assume that it equals the total number of edge point of the template.
%MaxPointsPerAngle=50;
MaxPointsPerAngle=template_point(1);
 
% Create a counter that counts the number of edge points that fall within each angle interval
PointCounter=zeros(DiscreteAngleNo);% counter for the number of edge points associate with each angle
 
% Create the R-table for the template. It is a matrix of size DiscreteAngleNo x MaxPointsPerAngle x 2
% The row index of the matrix corresponds to each discrete angles,  and the
% column indices correspond to the edge points that fall within a specific
% discrete angle. The last dimension is for the coordinate differences between 
% the edge points and the centre of the shape 
Rtable=zeros(DiscreteAngleNo,MaxPointsPerAngle,2); 
 
% for each of the edge points of the template, do the following:
for i=1:1:template_point(1)
    % Decide the angle index phi that the gradient angle of the edge point should have. 
    % we need to convert the continuous gradient angle to a discrete one 
    phi=round((gradient_angles(y(i), x(i))/pi)*(DiscreteAngleNo-1))+1; 
    PointCounter(phi)=PointCounter(phi)+1;% crease the number of point by one in the counter for the current phi
    if (PointCounter(phi)>MaxPointsPerAngle)
        disp('Exceed the maximum number of points for each angle, increase MaxPointsPerAngle');
    end;
    % calculate the "radius" - or distance - from the current edge point to
    % the centre of the shape in terms of the differences in the x and y coordinates, 
    % and put them in the R-table. difference in x and y form a distance vector [x,y]   
    Rtable(phi, PointCounter(phi),1)= Cy-y(i);% difference in x coordinate
    Rtable(phi, PointCounter(phi),2)= Cx-x(i);% difference in x coordinate
end;
 
 
 
%==========================================================================
 
% load the target image from which we will detect the template shape 
target=imread('target.jpg');
target=rgb2gray(target);  
% detect edges from the the target image using Canny detector 
% set threshold to 0.4 - or any other values between 0 and 1, try it!
target_edge=edge(target,'canny', 0.4); 
figure('Name','Edge of detected image','NumberTitle','off'), imshow(target_edge), hold on
 
% find the coordinates for all the edge points in target_edge (they have a value 1) 
[y x]=find(target_edge>0); 
np=size(x);% find number of edge points in target_edge image
 
% Calculate the gradient for each of the edge points in target_edge. We
% will use them to vote in the bins of parameter space
gradient_angles=gradient_direction(target_edge); % create gradient direction  map of the target
target_size=size(target); % Size of the main image target
 
% set up the parameter space - all the possible location of the shape being detected. 
% the location could be any where in the image, so set it be the same size as the image being detected
houghspace=zeros(size(target));% 
for i=1:1:np(1)
    % for a given edge point, find the discrete angle that its gradient corresponds to 
    phi=round((gradient_angles(y(i), x(i))/pi)*(DiscreteAngleNo-1))+1;
    %then vote in parameter space according to its distance to the centre of the template shape 
    for j=1:1:PointCounter(phi)
        % Calculate its possible locations of the cente
        % There are PointCounter(phi) possible locations
        ty=Rtable(phi, j,1)+ y(i);
        tx=Rtable(phi, j,2)+ x(i);
        if (ty>0) && (ty<target_size(1)) && (tx>0) && (tx<target_size(2))  
            % add a vote to the calcualted location on the target image
            houghspace(Rtable(phi, j,1)+ y(i), Rtable(phi, j,2)+ x(i))=...  
            houghspace(Rtable(phi, j,1)+ y(i), Rtable(phi, j,2)+ x(i))+1; 
        end;        
    end;
end;
 
%find the location of the bin that has the highest number of votes
mx=max(max(houghspace));% find the max score location. The first max return the maximum of each colomn of the matrix
[max_y,max_x]=find(houghspace==mx); %find the indeices of the location of the maximum score
score=houghspace(max_y,max_x)  % find max score, i.e., the highest number of votes 
 
% plot the location of the detected shape in the detected image
xx = [max_x-10,max_x+10];
yy = [max_y,max_y];
plot(xx,yy,'LineWidth', 2, 'Color',[1.0,0.0,0.0]); % drawing
 
% draw a vertical bar at the current centroid
xx = [max_x, max_x];
yy = [max_y-10,max_y+10];
plot(xx,yy,'LineWidth', 2, 'Color',[1.0,0.0,0.0]);
 
% display the numbers of votes in all bins
%imtool(houghspace);
figure, imshow(houghspace);
figure, imshow(houghspace,[]);
colormap jet
colorbar
%pause
 
