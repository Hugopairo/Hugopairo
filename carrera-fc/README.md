# ⚽ Carrera FC

Juego de fútbol de **modo carrera** para navegador (HTML + CSS + JS, sin dependencias).
Abre `index.html` en cualquier navegador moderno (o sírvelo con `npx http-server`).

Todo es ficticio: clubes, ligas y jugadores se generan proceduralmente.

## Modos

### ⭐ Modo Jugador
- Crea tu jugador (nombre, nacionalidad, posición, estilo, dificultad/potencial oculto) y elige entre 3 clubes para debutar.
- **Partidos en directo con momentos clave**: cuando tu jugador tiene una ocasión, un pase decisivo o defiende un ataque, eliges la acción (disparo potente/colocado, regate al portero, pase filtrado, entrada firme, estirada…) y tus atributos + suerte deciden.
- Agenda semanal: atributo a entrenar, intensidad y estilo de vida (lesiones, forma, progreso).
- Rol en el equipo y confianza del míster (te hacen jugar más si rindes), vestuario y afición.
- Agente: renovaciones, petición de traspaso, ofertas de otros clubes, cesiones y agencia libre al acabar contrato.
- Fama, patrocinios, tienda (casas, coches) y equipo personal (fisio, nutricionista, entrenador, psicólogo).
- Convocatorias con la **selección** (partidos internacionales).
- Fin de temporada con **Balón de Oro**, Pichichi, títulos, palmarés, historial y Hall of Fame al retirarte.

### 📋 Modo Manager
- Elige uno de los 24 clubes (2 divisiones, con ascensos y descensos) + **Copa** de eliminatoria.
- **Táctica**: 8 formaciones, once y banquillo por intercambio visual, mentalidad, presión, ritmo y línea defensiva. Cambios y táctica en directo.
- **Fichajes**: buscador con filtros (posición, edad, precio, promesas, libres), negociación de traspaso + salario + contrato, lista de vigilados, ofertas por tus jugadores.
- **Ojeadores**: misiones que revelan el **potencial exacto** (el de los demás es una estimación según tu red de ojeadores).
- **Cantera**: nuevos juveniles cada año según el nivel de la academia; promociona, libera o cede.
- **Finanzas**: ingresos (TV, patrocinio, merchandising, entradas), salarios, precio de entradas y mejora de 5 instalaciones.
- Directiva con objetivos y confianza (¡te pueden despedir!), rueda de prensa, moral, lesiones, sanciones, contratos.
- Progresión realista: los jóvenes crecen hacia su potencial, los veteranos decaen.

## Motor de partido
Simulación minuto a minuto: posesión, ocasiones, tiros (bloqueados / fuera / a puerta), paradas, penaltis, tarjetas, expulsiones, lesiones, cambios (IA y manager), fatiga, ventaja de local y valoraciones individuales. Campo animado en `<canvas>`.

## Guardado
Se guarda en `localStorage` (slots Manager y Jugador). También puedes exportar/importar la partida como archivo `.json`.

## Estructura
```
index.html
css/style.css
js/data.js       datos base, nombres, clubes, formaciones
js/engine.js     jugadores, alineaciones, motor de partido
js/world.js      calendario, liga, copa, fichajes, finanzas, progresión
js/career.js     modo jugador (agente, ofertas, selección, tienda)
js/ui.js         componentes, menús, previa/post-partido, liga, buzón
js/match-ui.js   partido en directo, fin de temporada
js/manager.js    pantallas del manager
js/playerui.js   pantallas del jugador
```
