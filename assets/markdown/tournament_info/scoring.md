# 📊 Puntuación

## 🎯 Sistema de Puntos por Partida

Cada partida jugada otorga puntos de la siguiente manera:

- **🏆 Victoria**: **3 puntos**
- **🤝 Empate**: **1 punto**
- **❌ Derrota**: **0 puntos**

---

## ⚔️ Aplicación según el Tipo de Ronda

### 🎯 En Torneos al Mejor de Uno (Md1)

- Cada **partida individual** otorga puntos según el resultado:
  - 🏆 Ganar la partida = **3 puntos**
  - 🤝 Empatar la partida = **1 punto**
  - ❌ Perder la partida = **0 puntos**

### 🎲 En Torneos al Mejor de Tres (Md3)

- Los puntos se otorgan según el **resultado final de la ronda** (mejor de 3 partidas):
  - 🏆 Ganar la ronda (2 victorias o más victorias que el oponente al finalizar el tiempo) = **3 puntos**
  - 🤝 Empatar la ronda (mismo número de victorias al finalizar el tiempo) = **1 punto**
  - ❌ Perder la ronda = **0 puntos**

**Ejemplos de resultados válidos:**
- 2-0: Victoria clara → **3 puntos** al ganador, **0 puntos** al perdedor
- 2-1: Victoria → **3 puntos** al ganador, **0 puntos** al perdedor
- 1-0 (tiempo agotado): Victoria por ventaja → **3 puntos** al ganador, **0 puntos** al perdedor
- 1-1 (tiempo agotado): Empate → **1 punto** a cada jugador
- 0-0 (tiempo agotado sin terminar primera partida): Empate → **1 punto** a cada jugador

---

## 🎲 Casos Especiales

### ⏰ Timeout (Agotamiento del Tiempo)

#### En Md1:
- Si no se termina la partida en los **últimos 5 minutos** adicionales, el resultado queda **0-0 (empate)**, otorgando **1 punto** a cada jugador.

#### En Md3:
- Si se acaba el tiempo durante la ronda:
  - El jugador con **más victorias** gana la ronda y obtiene **3 puntos** (ej: 1-0, 2-1).
  - Si tienen el **mismo número de victorias**, se considera **empate** y ambos obtienen **1 punto** (ej: 1-1, 0-0).
  - Si no terminaron la primera partida (0-0), también es **empate** con **1 punto** para cada uno.

### 🚫 Ausencia o Retraso

- Llegar con **más de 10 minutos de retraso** cuenta como **partida perdida** automáticamente:
  - El jugador ausente obtiene **0 puntos**.
  - El oponente obtiene **3 puntos** por victoria.
  - En Md3, se da por perdida la primera partida, y se esperará otros 10 minutos antes de dar por perdida la ronda entera, entregando la victoria 2-0 al oponente.

### 🎁 Bye (Número Impar de Jugadores)

- Si un jugador recibe **bye** (descansa esa ronda por número impar de participantes):
  - Obtiene **3 puntos** automáticamente, como si hubiera ganado la ronda.
  - En Md3, se entrega la ronda como ganada 2-0.

---

## 📋 Puntaje Total y Clasificación

- 🏅 El **puntaje total** de cada jugador es la **suma de todos los puntos** obtenidos en todas las rondas.
- 🥇 Los jugadores con **mayor puntaje** al final de las rondas clasifican al **Top 2** para jugar la **Final**.
- 🥉 El **3° lugar** se determina por el jugador con el tercer mayor puntaje total.

### ⚖️ Criterios de Desempate

Si dos o más jugadores tienen el mismo puntaje, se aplican los siguientes criterios en orden:
1. **⭐ Puntaje total** (primera prioridad)
2. **💪 Mayor cantidad de victorias** en el total de rondas
3. **🎯 Victoria directa** entre los jugadores empatados
4. **⚔️ Duelo de desempate** (si ninguno de los criterios anteriores resuelve el empate)
