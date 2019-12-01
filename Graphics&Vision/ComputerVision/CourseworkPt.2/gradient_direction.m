function [ ang ] = gradient_direction( i3 )
	sx=[-1     0     1;  -2     0     2;  -1     0     1];
	sy =sx'; %  sx' is transpose of sx
	bx = filter2(sx, double(i3)); % explore filter2 function
	by = filter2(sy, double(i3));
	
	% find overall edge
	bd_edge = sqrt(bx.^2+by.^2);
	%figure, imshow(bd_edge/255)
	%Show gradient angles
	ang=mod(atan2(by,bx)+pi(),pi());
end