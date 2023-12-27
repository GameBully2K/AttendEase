length = int(input("Enter the length of the array: "))
array = []

for i in range(length):
    value = input(f"Enter the value for cell {i}: ")
    array.append(value)

array_sum = sum(array)
print("Sum of array elements:", array_sum)


