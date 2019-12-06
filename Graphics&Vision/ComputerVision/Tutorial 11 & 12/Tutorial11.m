x  = [1 2 3 4 5 6 7 8 9 10];
x2 = 1:10; % range from one to ten, same as x

y = [1 1.1 1.2 1.3 1.4 1.5 ];
y2 = 1:0.1:1.5;

%Matrices
A = [1 2 3 ; 4 5 6 ; 7 8 9 ;]; % ; separate into rows

clear

x = [10 20 30];
A =  [1 2 3 ; 4 5 6 ; 7 8 9 ;];
Ans1 = x(2)
Ans2 = A(3 , 1) %Row 3, column 1

clear

x = [1 2 3];
y = [4 5 6];
a = 2;
Ans1 = x + y;
Ans2 = x - y;
Ans3 = a * x;

clear 

A = [1 2 3 ; 4 5 6 ; 7 8 9 ;]; % ; separate into rows
Ans1 = A.^2;
Ans2 = A^2;

y = [0 1/4 1/2 3/4 1];
y =  pi*y;
Ans3 = sin(y);

clear

%Cell arrays
EmptyC = cell(3);

A = [7, 9; 2 1; 8 3];
sz = size(A);
C = cell(sz);

myCell = {1, 2, 3;
            'text', rand(3,4,2), {11; 22; 33}};

a = myCell(1,1);

myCell{1,1} = 100;

