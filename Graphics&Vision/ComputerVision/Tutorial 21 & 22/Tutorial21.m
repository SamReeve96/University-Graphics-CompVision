close all
clear

% load the reference image
refRGB = imread('./bookImages/book_ref.png');

% load the comparison image
compRGB =  imread('./bookImages/book01.png'); %'./bookImages/book01.png'

bin_num = 10; % work out the imapact of this value
inter_sum = 0; % a variable to hold the sum of interesction (numerator in the formula)
model_sum = 0; % the denominator in the formula

k = 1;
for (k=1 : 1 : 3)
    model = refRGB(:,:,k);
    input = compRGB(:,:,k);

    % Histogram of ref image
    [model_counts, x] = imhist(model, bin_num);
    % figure, stem(x, model_counts);

    % histogram of comparison image
    [input_counts, x] = imhist(input, bin_num);
    % figure, stem(x, input_counts);

    % find the intersection of the two histograms by first picking up the smaller values 
    % in the corresponding bins of the two histograms
    inter = model_counts;

    for(j=1: 1 : bin_num)
        if (inter(j) > input_counts(j))
            inter(j) = input_counts(j);
        end
    end

    figure, stem(x, inter);

    for(j=1 : 1 : bin_num)
        % Accumulating for the sum of intersection
        inter_sum = inter_sum + inter(j);

        % accumulating for the sum of the histogram of
        % ref image
        model_sum = model_sum + model_counts(j);
    end

    match = inter_sum/model_sum;

end


