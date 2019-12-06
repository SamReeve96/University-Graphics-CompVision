function RGB2Binary()
    filepath = 'coins.png';
    im = imread(filepath);
    
    %get the historgram of the image
    %gr=rgb2gray(im);
    %imhist(gr);

    bw = im2bw(im, 0.27);
    [L,num] = bwlabel(bw,4);
    rgb = label2rgb(L);

    se = strel('square', 2); %constructe a structural element
    im = imerode(bw,se); %erosion

    se2 = strel('square', 12);
    ic = imclose(im,se2); %closing
    imshow(ic);

    [L,num] = bwlabel(ic,4); %detect regions of circles
    rgb = label2rgb(L); %convert matrix to image
    figure, imshow(rgb), hold on % hold on will tell matlab to keep the object active as we will draw some graphics on the image

    % calc parameters from L
    stats = regionprops(L,'ConvexArea', 'Perimeter', 'Centroid');
    stats.ConvexArea %Show the areas

    loc = [stats.Centroid];
    circleCounter = 0;

    for k = 1:2:length(loc) % Length(loc) return the number of entries in loc
        %draw a horizontal bar at the current centroid
        x = [loc(k)-10,loc(k)+10];
        y = [loc(k+1),loc(k+1)];
        plot(x,y,'LineWidth',1,'Color',[0.0,0.0,0.0]); % drawing

        %draw a vertical bar at the current centroid
        x = [loc(k),loc(k)];
        y = [loc(k+1)-10,loc(k+1)+10];
        plot(x,y,'LineWidth',1,'Color',[0.0,0.0,0.0]); % drawing

        circleCounter = circleCounter + 1;
        coinArea = stats(circleCounter).ConvexArea;
        %label the coin value
        x2 = [loc(k),loc(k)];
        y2 = [loc(k+1)+25,loc(k+1)+25];

        %Check for 2P
        if (coinArea > 8000 && coinArea < 8500)
            text(x2,y2,'2P', 'EdgeColor', 'red') %write 2p
        elseif (coinArea > 3500 && coinArea < 4000)
            text(x2,y2,'5P', 'EdgeColor', 'red') %write 5p 
        elseif (coinArea > 6000 && coinArea < 6500)
            text(x2,y2,'1 Pound', 'EdgeColor', 'red') %write £1
        elseif (coinArea > 9000 && coinArea < 10000)
            text(x2,y2,'2 Pounds', 'EdgeColor', 'red') %write £2
        else
            text(x2,y2,'??', 'EdgeColor', 'red') %write ??
        end
    end
end