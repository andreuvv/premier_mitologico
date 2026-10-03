-- Tournament info documents editable by admin (premier_player_id = 1)
CREATE TABLE IF NOT EXISTS public.info_documents (
  slug TEXT PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.info_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read info documents" ON public.info_documents;
CREATE POLICY "Anyone can read info documents"
  ON public.info_documents FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admin can insert info documents" ON public.info_documents;
CREATE POLICY "Only admin can insert info documents"
  ON public.info_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.premier_player_id = 1
    )
  );

DROP POLICY IF EXISTS "Only admin can update info documents" ON public.info_documents;
CREATE POLICY "Only admin can update info documents"
  ON public.info_documents FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.premier_player_id = 1
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.premier_player_id = 1
    )
  );

DROP TRIGGER IF EXISTS on_info_documents_updated ON public.info_documents;
CREATE TRIGGER on_info_documents_updated
  BEFORE UPDATE ON public.info_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT ON public.info_documents TO anon, authenticated;
GRANT INSERT, UPDATE ON public.info_documents TO authenticated;

INSERT INTO public.info_documents (slug, content)
VALUES ('general', $info_general$*Última actualización: 01 de Junio 2026*


# **📅** Siguiente Torneo

- 📆 Fecha: **27 de Junio 2026**
- 🕒 Hora de inicio: **14:30 hrs**
- 🎮 Formatos: [Primer Bloque Racial Libre](https://andreuvv.github.io/premier_mitologico/game-formats/primerBloque/primerBloqueRacialLibre) y [Primer Bloque Racial Edición](https://andreuvv.github.io/premier_mitologico/game-formats/primerBloque/primerBloqueRacialEdicion)
- ⚔️ Rondas: [Mejor de 3](https://andreuvv.github.io/premier_mitologico/tournament-info/tournamentSystem/md3)
- 🔄 Mulligan: [Mulligan estándar + Mano Seca](https://andreuvv.github.io/premier_mitologico/tournament-info/gameRules/mulligan)

---

## 🔗 Links y Recursos sobre los formatos:

### 🏛️ **Primer Bloque Racial Libre / Primer Bloque Racial Edición**
- 📋 [Cartas Permitidas en _PB_](https://docs.google.com/spreadsheets/d/17_Vq1_YJYeCVioJMoafOAMG2dF6Lm8NtanEcOmZOo00/edit?gid=0#gid=0)
- 🔧 [Reworks PB (Incompleto - Si tienen imagenes de los rewok, favor de agregar al documento)](https://docs.google.com/presentation/d/1Iuv6oAFyzdQ_4vhxvrnLWBzvssi73t0FehDPDUH_EQI/edit?usp=sharing)
- 📖 [Documento Actualizado de Reglas (DAR) Primer Bloque - más reciente](https://drive.google.com/file/d/1vRDfyMMHdfy_qQrLX4zfAE83XYcH-IBH/view)
- ❓ [FAQ Primer Bloque - más reciente](https://drive.google.com/file/d/1l6W5Qnc_Xp93i52tOflLaz1E-wzF3NM2/view)

### 🔥 **Furia Extendido Racial Libre / Furia Extendido Racial VCR / Furia Extendido Racial Ragnarok**
- 📋 [Cartas Permitidas en _FX_ (Noviembre 2025)](https://docs.google.com/spreadsheets/d/17_Vq1_YJYeCVioJMoafOAMG2dF6Lm8NtanEcOmZOo00/edit?gid=2040408861#gid=2040408861)
- 📖 [Documento Actualizado de Reglas (DAR) Furia Extendido - más reciente](https://drive.google.com/file/d/1DfwWgBAqdCpZZNDdQMB5XltZmn5T6lBL/view)
- ❓ [FAQ Furia Extendido 2023](https://drive.google.com/file/d/1hEMMHTjbGvDhU14Ehyj1tr7MvAZ7njSd/view)
- ❓ [FAQ Furia Extendido - Guerreros del Sol 2024](https://blog.myl.cl/wp-content/uploads/2024/07/FAQ-GDS.pdf)
- ❓ [FAQ FX - Agosto 2025](https://blog.myl.cl/wp-content/uploads/2025/07/FAQ-FX-UNIFICADO-AGO25.pdf) 🆕$info_general$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('tournamentSystem', $info_tournamentSystem$# 🎮 Sistema de Torneo

Se jugarán **cuatro formatos**, dos por cada torneo.

## 🃏 Mazos Requeridos

Por torneo, cada jugador debe presentar al menos **dos mazos** construidos previamente al inicio del evento, un mazo por cada formato de acorde al torneo y acorde a las reglas de los formatos _**Primer Bloque Racial Libre o Racial Edición**_ y _**Furia Extendido Racial Libre o Racial Limitado**_.

### 📋 Reglas de Construcción

- 🎯 Cada mazo deberá tener a lo menos **50 cartas**.
- 🔄 **Side Deck**:
    - Se permitirá un _**side deck**_ de hasta **10 cartas** en Primer Bloque.
    - Se permitirá un _**side deck**_ de hasta **15 cartas** en Furia Extendido.
    - 💡 _Los jugadores podrán, entre partidas, cambiar cartas de sus mazos con las de su **side deck**._

## 🔀 Rotación de Formatos

Se irán intercalando los formatos en dúos:
- 🆓 **Torneos Libres**: Primer Bloque Racial Libre y Furia Extendido Racial Libre.
- 🎯 **Torneos Limitados**: Primer Bloque Racial Edición y Furia Extendido Racial Limitado.
  
Si un torneo es de un tipo, la siguiente fecha será del otro y así sucesivamente.

## 🗳️ Votaciones

- ⚔️ Para la elección de **tipo de rondas** (rondas al Mejor de Uno o rondas al Mejor de 3): Se hará mediante votación de los participantes en el grupo de Whatsapp.

- ⏰ Para la elección de **horario**: Se hará también mediante votación de los participantes en el grupo de Whatsapp.
$info_tournamentSystem$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('gameRules', $info_gameRules$# Aclaración de Reglas de Mitos y Leyendas

## Primer Bloque Extendido

- 📖 [Documento Actualizado de Reglas (DAR) Primer Bloque - más reciente](https://drive.google.com/file/d/1vRDfyMMHdfy_qQrLX4zfAE83XYcH-IBH/view)


## Furia Extendido / Bloque Furia

- 📖 [Documento Actualizado de Reglas (DAR) Furia Extendido - más reciente](https://drive.google.com/file/d/1DfwWgBAqdCpZZNDdQMB5XltZmn5T6lBL/view)$info_gameRules$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('prizesAndFunding', $info_prizesAndFunding$# 🏆 Premios y Financiamiento

## 🎖️ Premios del Torneo

Los premios se distribuyen de la siguiente manera:

### 🥇 Primer Lugar - Campeón
- Medalla de 1° Lugar
- Premio mayor

### 🥈 Segundo Lugar - Subcampeón
- Medalla de 2° Lugar
- Premio destacado

### 🥉 Tercer Lugar
- Medalla de 3° Lugar
- Premio menor

### 🎁 Premio de Participación
- **1 sobre por jugador** para todos los participantes _(Dependiendo de la cantidad de participantes este premio puede no estar disponible)_

---

## 💸 Financiación de Premios

### 💰 Cuota de Participación

Al igual que en eventos pasados, se solicita una cuota de **$15.000 pesos** para cubrir los gastos en premios y comida.

#### 📊 Manejo de Fondos
- ✅ Cualquier sobrante se agregará al dinero acumulado para la siguiente versión del evento.
- 📝 Se dispondrá de una **boleta de gastos** en premios al finalizar el evento.

### 💳 Información de Pago

**Importante:** La cuota debe ser transferida, en lo posible, **un día antes del evento**.

#### 🏦 Datos Bancarios

| Campo | Información |
|---|---|
| **Nombre** | ANDRE VERA VEAS |
| **RUT** | 18.537.438-6 |
| **Banco** | Banco Itaú |
| **Tipo de cuenta** | Cuenta Corriente |
| **Número de cuenta** | 0222946443 |
| **Correo** | VEANVE@GMAIL.COM |

---

### 📋 Datos para Copiar

```
ANDRE VERA VEAS
18.537.438-6
Banco Itaú
Cuenta Corriente
0222946443
VEANVE@GMAIL.COM
```$info_prizesAndFunding$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('participants', $info_participants$# 👥 Participantes

***Participantes Siguiente Edición***

| Duelista  | Confirmado para siguiente edición | Cuota pagada |
| --------- | --------------------------------- | ------------ |
| Troke     |                                  |             |
| Timmy     |                                  |             |
| Wesh      |                                  |             |
| Folo      |                                  |             |
| Piter     |                                  |             |
| Clanso    |                                  |             |
| Guari     |                                  |              |
| Chisco    |                                  |              |
| Vinny     |                                  |              |
| Traukolin |                                  |             |
| Chester   |                                  |             |
| David     |                                  |             |$info_participants$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('schedule', $info_schedule$# 📅 Cronograma del Torneo

## 🕒 Inicio del Evento - 15:00 hrs

- 🎬 **Presentación audiovisual** del torneo
- 🎁 **Entrega de sobres de participación** a todos los jugadores
- 📢 Anuncio de emparejamientos y formato de las primeras rondas

---

## ⚔️ Fase de Rondas Clasificatorias

### ⏱️ Desarrollo de las Rondas

- Cada ronda dura **45 minutos** (+ 5 minutos extra si es necesario)
- ⏸️ Entre rondas hay aproximadamente **5 minutos de descanso**
- 📱 Los emparejamientos se anunciarán al inicio de cada ronda
- Las rondas continúan hasta que todos hayan jugado contra todos (sistema Round Robin)

### 🍕 Horarios de Comida

- 🍔 **Tiempo para almorzar**: Se dará un descanso apropiado para quienes no hayan comido antes del evento
- 🍕 **Pizza - 21:00 hrs**: Se servirá pizza para todos los participantes (comprado con el restante de dinero de la cuota)
- ☕ Refrigerios y bebidas disponibles durante todo el evento (de responsabilidad individual su compra y consumo)

---

## 🏆 Fase de Podio

### 📊 Inicio de Finales

La fase de podio comenzará:
- ✅ **Inmediatamente** después de completar todas las rondas clasificatorias, **O**
- 🌙 A las **00:00 hrs** (medianoche) si las rondas no se han completado

### 🥇 Partidas por Podio

1. **👑 Final**: Los dos jugadores con mayor puntaje compiten por el 1° y 2° lugar
2. **🥉 Tercer lugar**: Ya definido por el puntaje (no requiere partida adicional en la mayoría de casos)

### 🎖️ Premiación

- 🏅 Entrega de **medallas** y **premios** inmediatamente después de definir los primeros 3 lugares
- 📸 Fotos oficiales del podio
- 🎉 Cierre del evento

---

## ⏰ Resumen del Día

| Horario | Actividad |
|---------|-----------|
| 🕒 **15:00** | Inicio, presentación y entrega de sobres |
| 🕒 **15:15 - 21:00** | Rondas clasificatorias (con descansos) |
| 🍕 **21:00** | Pizza y descanso |
| 🕘 **21:30 - 00:00** | Continuación de rondas (si es necesario) |
| 🌙 **00:00 (máximo)** | Inicio de fase de podio |
| 🏆 **Variable** | Finales y premiación |

*Los horarios son aproximados y pueden variar según el número de participantes y la duración de las partidas.*
$info_schedule$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('md1', $info_md1$# 🎯 Torneo al Mejor De Uno

## 📊 Estructura del Torneo

### ⚔️ Rondas Mejor de 1

Todos los jugadores participan. Si hay un número impar de participantes, un jugador recibe *bye* por ronda.

#### ⏱️ Duración y Tiempo
- Cada partida tiene una duración máxima de **45 minutos**.
- ⏰ Al finalizar los 45 minutos, se otorgan **5 minutos adicionales** para terminar la partida en curso.
- 🤝 Si no se completa la partida después de los 5 minutos extra, el resultado queda como **empate (0-0)**.

#### 🚫 Retrasos
- ⚠️ Llegar con **10 minutos de retraso** cuenta como **partida perdida** para el jugador ausente.
- El jugador presente recibe **3 puntos** automáticamente.

#### 🎲 Emparejamiento
- El emparejamiento se realiza **al azar mediante IA**.
- 👥 Cada participante juega **una partida contra cada uno** de los otros participantes.
- ⚖️ Cada jugador jugará la **misma cantidad de duelos** en ambos formatos.
- 📱 El emparejamiento será publicado el mismo día del torneo en esta web y en el grupo de WhatsApp.

**Ejemplo:** En un torneo de 10 participantes, cada jugador tendría al menos 9 duelos.

---

## 🏆 Clasificación a Finales

### 👑 Top 2 Avanza a la Final
Los dos jugadores con **mayor puntaje** al final de las rondas clasifican a la final.

- **Final:** Mejor de 3 partidas
- Se jugará entre los dos jugadores con mayor puntaje total

### 🥉 Tercer Lugar
- El 3° lugar es el jugador con el **tercer mayor puntaje**.
- 🎯 Si dos jugadores tienen el mismo puntaje, queda en 3° lugar quien le haya **ganado al otro** en la fase de rondas.

---

## 🎮 Elección de Formato

### ⚔️ Fase de Rondas (Mejor de 1)

Los formatos a jugar son:
- **Primer Bloque**
- **Furia Extendido**

El formato se determina **al azar** junto con el emparejamiento, garantizando que:
- Cada jugador juegue una vez contra cada oponente
- Cada jugador tenga la misma cantidad de duelos en cada formato

### 👑 Final (Mejor de 3)

#### 🪙 Primer Duelo
El formato se determina **lanzando una moneda**:
- **Cara** (Logo Dragón): **Primer Bloque**
- **Sello** (Letras "Mitos y leyendas"): **Furia Extendido**

#### 🎯 Segundo Duelo
El **perdedor del primer duelo** elige el formato.

#### 🎲 Tercer Duelo
El formato se determina **al azar nuevamente**.

---

## 📋 Resolución de Posiciones

Para determinar la jerarquía en la tabla final, se aplican los siguientes criterios en **orden por prioridad**:

### 1️⃣ **⭐ Puntaje Total**
El puntaje es la primera forma de determinar la posición de los jugadores.

### 2️⃣ **💪 Mayor Cantidad de Victorias**
Si dos jugadores tienen el mismo puntaje, se determina quién está por sobre el otro viendo quién consiguió **más victorias** en el total de rondas.

### 3️⃣ **🎯 Victoria Directa**
Si no se puede determinar por las razones anteriores, se toma como ventaja al jugador que **venció al otro** durante la fase de rondas.

### 4️⃣ **⚔️ Duelo de Desempate**
Si ninguno de los criterios anteriores resuelve el empate, se juega un **duelo especial de desempate**.

**Nota:** Este duelo solo determina la posición entre dos jugadores y no afecta el puntaje global ni el índice de victorias.
$info_md1$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('md3', $info_md3$# 🎲 Torneo al Mejor De Tres

## 📊 Estructura del Torneo

### ⚔️ Rondas Mejor de 3

Todos los jugadores participan. Si hay un número impar de participantes, un jugador recibe *bye* por ronda.

#### 🎯 Mecánica de Partidas
- Cada ronda tiene un **máximo de 3 partidas**.
- 🏆 Gana el jugador que consiga **2 victorias primero**.
- ⏱️ Si se acaba el tiempo, gana el jugador que tenga **una victoria por sobre el otro**.

#### ⏱️ Duración y Tiempo
- Cada ronda tiene una duración máxima de **45 minutos** para jugar todas las partidas.
- ⏰ Al agotarse el tiempo, se otorgan **5 minutos adicionales** para terminar la partida en curso.
- 🤝 Si no se completa la partida después de los 5 minutos extra, la partida en curso queda **anulada**.
- El resultado final de la ronda se determina por el marcador al momento (ej: si se está jugando la 3ª partida, el marcador final quedaría **1-1 en empate**).

#### 🚫 Retrasos
- ⚠️ Llegar con **10 minutos de retraso** cuenta como **partida perdida** para el jugador ausente.
- El jugador presente recibe **3 puntos** automáticamente.

#### 🎲 Emparejamiento
- El emparejamiento se realiza **al azar mediante IA**.
- 👥 Cada participante juega **una partida contra cada uno** de los otros participantes.
- ⚖️ Cada jugador jugará la **misma cantidad de duelos** en ambos formatos.
- 📱 El emparejamiento será publicado el mismo día del torneo en esta web y en el grupo de WhatsApp.

---

## 🏆 Clasificación a Finales

### 👑 Top 2 Avanza a la Final
Los dos jugadores con **mayor puntaje** al final de las rondas clasifican a la final.

- **Final:** Se jugará entre los dos jugadores con mayor puntaje total

### 🥉 Tercer Lugar
- El 3° lugar es el jugador con el **tercer mayor puntaje**.
- 🎯 Si dos jugadores tienen el mismo puntaje, queda en 3° lugar quien le haya **ganado al otro** en la fase de rondas.

---

## 🎮 Elección de Formato

### ⚔️ Fase de Rondas (Mejor de 3)

Los formatos a jugar son:
- **Primer Bloque**
- **Bloque Furia**

El formato se determina **al azar** junto con el emparejamiento, garantizando que:
- Cada jugador juegue una vez contra cada oponente
- Cada jugador tenga la misma cantidad de duelos en cada formato

### 👑 Final (Mejor de 3)

#### 🪙 Primer Duelo
El formato se determina **lanzando una moneda**:
- **Cara** (Logo Dragón): **Primer Bloque**
- **Sello** (Letras "Mitos y leyendas"): **Bloque Furia**

#### 🎯 Segundo Duelo
El **perdedor del primer duelo** elige el formato.

#### 🎲 Tercer Duelo
El formato se determina **al azar nuevamente**.

---

## 📋 Resolución de Posiciones

Para determinar la jerarquía en la tabla final, se aplican los siguientes criterios en **orden por prioridad**:

### 1️⃣ **⭐ Puntaje Total**
El puntaje es la primera forma de determinar la posición de los jugadores.

### 2️⃣ **💪 Mayor Cantidad de Victorias**
Si dos jugadores tienen el mismo puntaje, se determina quién está por sobre el otro viendo quién consiguió **más victorias** en el total de rondas.

### 3️⃣ **🎯 Victoria Directa**
Si no se puede determinar por las razones anteriores, se toma como ventaja al jugador que **venció al otro** durante la fase de rondas.

### 4️⃣ **⚔️ Duelo de Desempate**
Si ninguno de los criterios anteriores resuelve el empate, se juega un **duelo especial de desempate**.

**Nota:** Este duelo solo determina la posición entre dos jugadores y no afecta el puntaje global ni el índice de victorias.
$info_md3$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('scoring', $info_scoring$# 📊 Puntuación

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
$info_scoring$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('timing', $info_timing$# ⏰ Tiempos y Horarios

## 🕒 Hora de Inicio

- **Inicio del torneo**: **15:00 hrs** (3:00 PM)
- 🎁 Los **sobres de participación** se entregarán al inicio del torneo.

---

## ⏱️ Duración de Rondas

### ⚔️ Tiempo Reglamentario por Ronda

- Cada ronda tiene una duración de **45 minutos**.
- Durante este tiempo se deben jugar todas las partidas que sean posibles.
- ⏳ Al finalizar los 45 minutos, se otorgan **5 minutos adicionales** para terminar la partida en curso.

### 📝 Resultados al Agotarse el Tiempo

#### En Mejor de Uno (Md1):
- Si no se completa la partida después de los 5 minutos extra, el resultado queda como **empate (0-0)**.

#### En Mejor de Tres (Md3):
- Si no se completan todas las partidas, el resultado final es el **marcador actual**:
  - **1-0** → Victoria para quien tiene 1 victoria
  - **1-1** → Empate
  - **0-0** → Empate (si no terminaron ni la primera partida)

---

## 🚫 Retrasos y Ausencias

### ⏰ Espera por Jugador Retrasado

Se aplicará un sistema de espera escalonado para jugadores que lleguen tarde:

#### 🕐 Primeros 10 minutos de retraso:
- Se esperará **10 minutos** desde el inicio programado de la ronda.
- ⚠️ Al cumplirse los 10 minutos sin que el jugador llegue:
  - **En Md1**: Se otorga **partida perdida** al ausente. El jugador presente recibe **3 puntos** automáticamente.
  - **En Md3**: Se otorga **1 victoria** al jugador presente (marcador 1-0).

#### 🕐 10 minutos adicionales (20 minutos totales):
- Si el jugador aún no llega, se esperarán **10 minutos adicionales**.
- ⚠️ Al cumplirse los 20 minutos totales de retraso:
  - **En Md1**: La ronda ya estaba perdida desde los primeros 10 minutos.
  - **En Md3**: Se otorga una **segunda victoria** al jugador presente (marcador 2-0), dando por **terminada la ronda** con victoria completa para quien esperó.

---

## 🍔 Descansos

- 🕐 Se dará **tiempo entre rondas** para que los jugadores puedan comer y descansar.
- El organizador anunciará cuándo inicia la siguiente ronda.

---

## 🌙 Límite de Tiempo del Torneo

- 🕛 Si al llegar las **00:00 hrs** (medianoche) no se han terminado las rondas clasificatorias:
  - Se dará por **finalizada la fase de rondas**.
  - Se procederá inmediatamente a las **rondas de podio** (Final y 3° lugar).
$info_timing$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('mulligan', $info_mulligan$# 🔄 Mulligan
### _✋ Cambio de mano_
#### _(Estas reglas solo aplican a nuestros torneos, en premier oficiales se usa el mulligan estándar)_

---

## 📋 Mulligan Estándar

- 🎴 Ambos jugadores robarán una mano de **8 cartas**.
- 🔀 Si un jugador no está satisfecho con su mano, puede cambiarla robando **una carta menos** por cada _mulligan_.
- 📊 Patrón de cartas: **8 → 7 → 6 → 5 → 4 → 3 → 2 → 1 carta(s)**.

---

## 🎲 Mulligan Doble (7-7-6-6-5-5-...)

- 🎴 Ambos jugadores robarán una mano de **8 cartas**.
- 🔀 Si un jugador no está satisfecho con su mano, puede cambiarla robando una carta menos, pero cada valor se repite dos veces.
- 📊 Patrón de cartas: **8 (primera mano) - 7 - 7 - 6 - 6 - 5 - 5 - 4 - 4 - 3 - 3 - 2 - 2 - 1 carta(s)**.

---

## 🏠 Regla de la Casa

- ⚖️ Si **ambos jugadores** no están satisfechos con su **primera mano de 8 cartas**, pueden acordar un reinicio mutuo.
- 🔄 En este caso, **ambos vuelven a robar 8 cartas nuevamente** y continúan desde ahí con el mulligan correspondiente de su formato.
- 💭 Esta regla requiere consentimiento de ambos jugadores.

---

## ✨ Mano Seca

- 🪙 Si durante la **primera mano** un jugador **no tiene ninguna carta Oro**, puede invocar la "mano seca".
- 👀 El jugador **muestra la mano al oponente** para confirmar que no hay cartas Oro.
- 🔄 Tras la confirmación, el jugador puede **cambiar su mano robando 8 cartas nuevamente**.
- 📌 Solo aplica a la **primera mano** y solo si está completamente sin cartas Oro.$info_mulligan$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('whoStarts', $info_whoStarts$# 🎲 ¿Quién Comienza?

## 🏁 Primera Partida

Para nuestros torneos, **quién parte la primera partida** se decide **tirando un dado** (puede ser de cualquier cantidad de lados). **Quien saque el número mayor iniciará el primer turno**.

---

## 🔄 Segunda Partida

Para la **segunda partida**, **el jugador que haya perdido la primera partida decidirá quién comienza**.

---

## 🔄 Tercera Partida (si es necesario)

Si es que se llega a jugar una **tercera partida**, **el que haya perdido la segunda partida elegirá quién comienza**.$info_whoStarts$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('gamePhases', $info_gamePhases$# ⏰ Fases del Juego

## 📋 Orden de las Fases

Las fases del juego ocurren en el siguiente orden durante cada turno:

---

## 🔄 1. Fase de Agrupación

En esta fase se deben **agrupar**:

- 💰 **Oros pagados**: Se devuelven a la reserva
- ⚔️ **Aliados atacantes**: Se devuelven a la línea de defensa
- ⚡ Habilidades ***En Fase de Agrupación...**, se disparan en esta Fase.

**Regla importante**: Un aliado con furia que no sea agrupado, **no puede atacar**.

### 🎯 Diferencias por Formato

#### 🔥 **Formatos de Furia**
- Esta fase es **automática**

#### 🏛️ **Primer Bloque**
- Esta fase es **opcional**, pero es un **todo o nada**
- No puedes tener 4 oros pagados y solo agrupar 3 (dejando uno pagado)
- El mismo criterio aplica para agrupar aliados

### ⚠️ Excepción
**En el primer turno de la partida no existe la fase de agrupación**.

---

## 👁️ 2. Fase de Vigilia

### 💰 Primera Acción: Oro
La **primera acción** de esta fase **debe ser poner en juego un oro**:
- Si no lo haces, **ya no podrás poner en juego un oro** durante este turno
- A menos que sea por la **habilidad de una carta**

### 🎭 Cartas Especiales
Si una carta dice en su habilidad que se juega **"al comienzo de la Vigilia"**, entonces **SÍ puedes poner en juego oro después** de jugar esa carta.

---

## ⚔️ 3. Fase de Batalla Mitológica

Esta es la fase más compleja del turno.
Ocurre en varios pasos:

### 📢 Paso 1: Declaración de Ataque
- 🎯 **Jugador activo declara ataque**
- ⚡ Se disparan las **habilidades asociadas a la declaración de ataque**

### 🛡️ Paso 2: Declaración de Bloqueo
- 🛡️ **Jugador defensor declara bloqueo**
- 👥 Asigna bloqueadores a los atacantes
- ⚡ Se disparan las **habilidades asociadas a la declaración de bloqueo**

### 🎴 Paso 3: Guerra de Talismanes
Una vez terminada la declaración de bloqueos, en orden de eventos:

- 🔄 **Jugador defensor** puede jugar talismanes o activar habilidades
- 🔄 **Jugador activo/atacante** puede hacer lo mismo
- 🔄 Se alternan **hasta que ningún jugador quiera ceder la prioridad**
- 🏁 Al ocurrir esto, **termina la guerra de talismanes**

#### ⚠️ Aclaración _Guerra de Talismanes_
- **Solo se puede jugar una carta por prioridad**.
  - Yo como defensor puedo jugar un talisman o activar una carta.
  - Luego pasa la prioridad al atacante y asi sucesivamente.
- **Si no hay declaración de ataque, la guerra de talismanes no ocurre**.

### 💥 Paso 4: Asignación de Daño
En **orden de eventos** ocurre:

1. 🧮 **Se calculan los daños**
2. 🎴 Se pueden jugar cartas y activar habilidades que digan **"En respuesta a que fueras a recibir daño"**
3. ⚡ **Daño que deba ser desterrado** ocurre **primero**, luego el **daño normal**
4. 🎴 Se pueden jugar cartas y activar habilidades que digan **"En respuesta a recibir daño"**
5. 💀 **Aliados que deban ser destruidos son destruidos**
6. 🛡️ Por último, los jugadores pueden jugar cartas que **prevengan que un aliado sea destruido**, partiendo por el **jugador activo**

---

## 🏁 4. Fase Final

### ⚡ Habilidades Especiales
Se disparan las **habilidades de cartas** que digan **"En la Fase Final"**.

### 🃏 Robo de Carta
- 🃏 El **jugador activo roba una carta**

### 🎯 Diferencias por Formato

#### 🔥 **Formatos de Furia**
- En el **primer turno de la partida**, el jugador que partió **NO roba una carta**

#### 🏛️ **Primer Bloque**
- En el **primer turno de la partida**, el jugador que partió **SÍ roba una carta**$info_gamePhases$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('playOrPut', $info_playOrPut$# 🎮 Jugar vs Poner en Juego

## 🃏 ¿Qué significa "Jugar" una carta?

Una carta es **jugada** cuando:

- ✅ Se **paga el costo** de esa carta
- ✅ Entra en juego mediante una **habilidad que diga "Juega una carta..."**

**Importante**: Estas cartas **son anulables**, porque solo las cartas jugadas pueden ser anuladas, a menos que específicamente diga que no puede ser anulada.

---

## 📥 ¿Qué significa "Poner en Juego" una carta?

Una carta puede **entrar en juego** por una habilidad que diga **"Pon una carta en juego..."**

**Importante**: Estas cartas **NO son anulables**.

---

## ⚡ Diferencias en Habilidades de Entrada

### ❌ Habilidades que NO se Disparan

Si una carta **puesta en juego** tenía una habilidad de tipo **"cuando la juegues..."** o similar, **esa habilidad NO se dispara** porque la carta no está siendo jugada.

### ✅ Habilidades que SÍ se Disparan

Si una carta **puesta en juego** tenía una habilidad de tipo **"cuando entra en juego..."**, **esa habilidad SÍ se dispara** porque se considera que la carta está entrando en juego.

---

## 📋 Resumen de la Distinción

| Acción | Descripción | Anulable |
|--------|-------------|----------|
| **Jugar** | Pagar costo o habilidad "Juega..." | ✅ Sí |
| **Poner en Juego** | Habilidad "Pon en juego..." | ❌ No |

Esta distinción es fundamental para entender cómo entran las cartas al juego y qué habilidades se activan.$info_playOrPut$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('abilityEffect', $info_abilityEffect$# 🎯 Habilidad vs Efecto

## 🃏 ¿Qué es una Habilidad?

La **habilidad** de una carta es **todo lo que está escrito en el cuadro de texto de la carta**.

- En formatos de **Primer Bloque**, las cartas tienen una sola habilidad.
- En formatos de **Furia**, las cartas pueden tener **múltiples habilidades**.

---

## ✨ ¿Qué es un Efecto?

El **efecto** es la **resolución** de la habilidad de una carta.

**Ejemplo simple:**
- **Habilidad** de Bola de Fuego (Primer Bloque): *"Destruye una carta en juego, que no sea un Oro"*
- **Efecto**: La destrucción efectiva de la carta objetivo

---

## 🛡️ Diferencia Crucial: Anulación

### ❌ Cuando una Habilidad es Anulada

Si una habilidad es **anulada** (por ejemplo, con contrahabilidades), la **habilidad se activa pero queda sin efecto**.

**Ejemplo detallado:**
1. 🎯 **Juego Bola de Fuego** a una carta oponente
2. 🛡️ **Mi oponente activa Ptolomeo II**: *"Una vez por turno, puedes pagar 1 Oro o botar 3 cartas para prevenir que una carta que controles sea afectada por una habilidad oponente"*
3. ⚡ **La habilidad de Bola de Fuego se dispara** (se activa)
4. 🚫 **Pero el efecto es prevenido** (la carta no se destruye)

### ✅ Resumen de la Distinción

- **Habilidad**: La capacidad escrita en la carta (lo que la carta "dice que hace")
- **Efecto**: El resultado real que ocurre en el juego (lo que "sucede" efectivamente)

Esta distinción es crucial para entender cómo funcionan las contrahabilidades y anulaciones en el juego.$info_abilityEffect$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.info_documents (slug, content)
VALUES ('oncePerTurn', $info_oncePerTurn$# 🔄 Aclaración 'Una Vez Por Turno'

Hay cartas que dicen **'una vez por turno'** sin especificar una fase del juego.

Estas cartas pueden activar esa habilidad:

- ⏰ Durante cualquier **Fase del juego** durante el turno de su dueño.
- ⚔️ Durante la **Guerra de Talismanes** en la **Fase de Batalla Mitológica** durante el turno oponente.

## ⚠️ Restricciones

- 🚫 Si no ocurre **Batalla Mitológica**, entonces no puede activarse esa carta en el turno oponente.
- 🚫 No puede ser activada en otras fases durante el turno oponente.
- 📝 Por Ejemplo: Si durante la **Batalla Mitológica** ya están en **Asignación de Daño** (o sea ya pasó la **Guerra de Talismanes**), entonces ya no se puede activar la carta durante el turno oponente.

## 📖 Ejemplo

**Lanza Divina** que dice en su habilidad: *'El portador gana 2 a la fuerza. Una vez por turno, tu oponente bota 2 cartas de su Mazo Castillo.'*

Yo como dueño de la carta podría activarla:

- ⏰ Durante cualquier **Fase del Juego** durante mi turno, o.
- ⚔️ Durante **Guerra de Talismanes** si es que se declaró **Batalla Mitológica** en el turno oponente.$info_oncePerTurn$)
ON CONFLICT (slug) DO NOTHING;

