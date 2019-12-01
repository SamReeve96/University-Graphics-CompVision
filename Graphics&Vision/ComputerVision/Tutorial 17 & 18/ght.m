close all
clear

% load the template
template = imread('temp2.jpg');
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

%===========================================================================================

[y x] = find(temp_edge > 0);
template_point = size(x); % total points in the template image

% calc the gradients for each and every point of temp_edge
gradient_angles = gradient_direction(temp_edge);

% create R-table
DiscreteAngleNo = 180; %set the range of the angle

%now decide how many edge points will associate to each discrete angle
MaxPointsPerAngle = template_point(1);

% Create a counter that counts the no. of edge points that fall within each angle interval
PointCounter = zeros(DiscreteAngleNo);

% create R-table for the template
Rtable = zeros(DiscreteAngleNo, MaxPointsPerAngle, 2);

for i=1:1:template_point(1)
    phi = round((gradient_angles(y(i), x(i))/pi) * (DiscreteAngleNo - 1)) + 1;

    PointCounter(phi) = PointCounter(phi) + 1;

    if (PointCounter(phi) > MaxPointsPerAngle)
        disp('Exceed the max number of points for each angle, increase maxPoints per angle');
    end

    Rtable(phi, PointCounter(phi), 1) = Cy-y(i);
    Rtable(phi, PointCounter(phi), 2) = Cx-x(i);

end

%===========================================================================================

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

%===========================================================================================

for i = 1:1:np(1)
    phi = round((gradient_angles(y(i), x(i))/pi) * (DiscreteAngleNo-1)) + 1;

    for j = 1:1:PointCounter(phi)
        ty = Rtable(phi, j, 1) + y(i);
        tx = Rtable(phi, j, 2) + x(i);

        if (ty>0) && (ty<target_size(1)) && (tx>0) && (tx<target_size(2))
            houghspace(Rtable(phi, j, 1) + y(i), Rtable(phi, j, 2) + x(i)) = houghspace(Rtable(phi, j, 1) + y(i), Rtable(phi, j, 2) + x(i)) + 1;
        end
    end
end

mx = max(max(houghspace));

[max_y, max_x] = find(houghspace == mx);

score = houghspace(max_y, max_x);

%===========================================================================================

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
