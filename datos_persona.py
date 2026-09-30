edad = int(input("Edad: "))

sexo = input("Sexo (un solo carácter, por ejemplo M o F): ")
while len(sexo) != 1:
    sexo = input("Introduce solo un carácter para el sexo (M o F): ")

altura = float(input("Altura en metros: "))

print("\nDatos introducidos:")
print("Edad:", edad)
print("Sexo:", sexo)
print("Altura:", altura, "metros")
