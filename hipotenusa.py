import math

cateto1 = float(input("Longitud del primer cateto: "))
cateto2 = float(input("Longitud del segundo cateto: "))

hipotenusa = math.sqrt(cateto1 ** 2 + cateto2 ** 2)

print(f"Longitud de la hipotenusa: {hipotenusa}")
