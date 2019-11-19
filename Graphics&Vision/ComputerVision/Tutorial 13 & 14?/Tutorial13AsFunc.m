%Now written as a function
function RGB2Binary(filepath)
    im = imread(filepath);
    bw = im2bw(im, 0.78);
    [L,num] = bwlabel(bw,4);
    rgb = label2rgb(L);
    figure, imshow(rgb);
    end