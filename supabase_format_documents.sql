-- Format documents editable by admin (premier_player_id = 1)
CREATE TABLE IF NOT EXISTS public.format_documents (
  slug TEXT PRIMARY KEY,
  content TEXT NOT NULL DEFAULT '',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

ALTER TABLE public.format_documents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read format documents" ON public.format_documents;
CREATE POLICY "Anyone can read format documents"
  ON public.format_documents FOR SELECT
  TO anon, authenticated
  USING (true);

DROP POLICY IF EXISTS "Only admin can insert format documents" ON public.format_documents;
CREATE POLICY "Only admin can insert format documents"
  ON public.format_documents FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.profiles p
      WHERE p.id = auth.uid()
        AND p.premier_player_id = 1
    )
  );

DROP POLICY IF EXISTS "Only admin can update format documents" ON public.format_documents;
CREATE POLICY "Only admin can update format documents"
  ON public.format_documents FOR UPDATE
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

DROP TRIGGER IF EXISTS on_format_documents_updated ON public.format_documents;
CREATE TRIGGER on_format_documents_updated
  BEFORE UPDATE ON public.format_documents
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

GRANT SELECT ON public.format_documents TO anon, authenticated;
GRANT INSERT, UPDATE ON public.format_documents TO authenticated;

INSERT INTO public.format_documents (slug, content)
VALUES ('primerBloque', $fmt_primerBloque$# ⚔️ Primer Bloque _Extendido_

## 📋 Descripción General

El **Primer Bloque _Extendido_** es la evolución del formato original de Primer Bloque, que incluye las ediciones clásicas de Segunda Era junto con nuevos productos de extensión lanzados desde 2021.

Para este formato existen dos tipos de formatos de juego oficiales:
- **Primer Bloque Racial Libre**
- **Primer Bloque Racial Edición**

---

## 📖 Historia del Formato

El **Primer Bloque** nace en el año **2010**, como forma de oficializar los distintos tipos de juego en las ediciones de la Segunda Era.

Se determinó el Primer Bloque como las ediciones lanzadas originalmente entre **2003 y 2004**:
- Espada Sagrada
- Cruzadas
- Helénica
- Imperio
- Hijos de Daana
- Tierras Altas
- Dominios de Ra
- Encrucijada

Desde **2018** se comenzaron a reeditar estas cartas y en **2021** comienzan a salir nuevos productos para agregar nuevas cartas a estas ediciones, dándole el nombre **Primer Bloque _Extendido_** al formato.

---

## 👥 Razas de Aliados por Edición

Las razas de Aliados están divididas entre sus ediciones originales y posteriores productos asociados:

### ⚔️ Espada Sagrada
- Caballero
- Faerie
- Dragón

### 🏛️ Helénica
- Héroe
- Titán
- Olímpico

### 🍀 Hijos de Daana
- Defensor
- Desafiante
- Sombra

### 🌞 Dominios de Ra
- Eterno
- Faraón
- Sacerdote

---

## 📚 Ediciones Especiales

### 🦇 Drácula (2023)
Edición especial lanzada en 2023

### 🔥 Inferno (2024)
Edición especial lanzada en 2024

---

## 📦 Productos Permitidos

### 🎁 Productos Especiales de Extensión

- Kits Extensión Primer Bloque
- Espada Sagrada Aniversario
- Relatos de Espada Sagrada
- Relatos de Helénica
- Helénica Aniversario
- Hijos de Daana Aniversario
- Relatos de Hijos de Daana
- Dominios de Ra Aniversario
- Colecciones Raciales 1
- Colecciones Raciales 2
- Colecciones Raciales 2023
- Toolkit Fe sin Límites
- Toolkit Dragón Dorado
- Toolkit Juicio y Visión
- Toolkit Nobleza y Poder
- Colmillos de Avalon
- Colmillos del Inframundo
- Aniversario 25 años (selección de cartas)

### ⭐ Productos Especiales

- Leyendas Primer Bloque
- Leyendas Primer Bloque 2.0
- Leyendas Primer Bloque 3.0
- Shogun
- Shogun 2
- Shogun 3
- Shogun 4
- Lootbox 2024 Primer Bloque
- Producto Especial Zombies
- Colecciones Legendarias

---

## ✨ Características del Formato

### ✅ Ventajas

- **Amplia variedad** de cartas clásicas y modernas
- Acceso a **reediciones** con nuevos artes
- **Productos de extensión** que enriquecen las ediciones originales
- Combinación de **nostalgia** y **estrategias actualizadas**

### 🎲 Estilo de Juego

Este formato favorece:

- Construcción de mazos con **cartas clásicas** de Segunda Era
- **Sinergia** entre ediciones originales y productos nuevos
- **Diversidad racial** con múltiples opciones por edición
- Estrategias **competitivas** con pool amplio de cartas$fmt_primerBloque$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.format_documents (slug, content)
VALUES ('bloqueFuria', $fmt_bloqueFuria$# ⚔️ Bloque Furia _Extendido_

## 📋 Descripción General

El **Bloque Furia _Extendido_** se compone de la unión de dos bloques: el **Bloque Furia Clásico** y el **Furia Extendido**.

Desde **2026** se podrán usar las cartas de las ediciones del **Bloque Furia** en conjunto con las cartas del formato **Furia Extendido**, con el lanzamiento de la edición **Leyendas Bloque Furia 2.0**.

Para este formato existen dos tipos de formatos de juego oficiales:
- **Furia Extendido Racial Libre**
- **Furia Extendido Racial Limitado**

---

## 📚 Ediciones y Productos Permitidos

### 🔥 Furia Extendido

#### Ediciones:
- **Furia** [1FU]
- **Furia Extensión** [EF]
- **Sumeria** [SU]
- **Rebelión** [XS]
- **Asgard** [ASG]
- **Midgard** [MID]
- **Leyendas Bloque Furia** [LBF]
- **Roma** [ROM]
- **Excalibur** [EXC]
- **Troya** [TRO]
- **Guerreros del Sol** [GUE]
- **Guardianes de Daana** [GUA]
- **Leyendas Bloque Furia 2026** [LBF2]

#### Productos Especiales:
- **Reliquias del Dragón** [XP]
- **Tesoro Vikingo** [TV]
- Sobre de cartas FX de edición **Despertar Gótico** [★]
- **Lootbox 2022** (selección de cartas) [ROM]
- Kit de Batalla: Bola de Fuego [LBF]
- Kit de Batalla: Walkiria [LBF]
- Mystery Box: Leyendas Bloque Furia [LBF]
- Kit de Batalla: Destino [ROM]
- Kit de Batalla: Instinto [ROM]
- Mystery Box: Roma [ROM]
- **Reinos Perdidos: Leyendas del Metal** [HM]
- **Mazos Raciales** Preconstruidos [MI]
- Kit de Batalla: Coraje [EXC]
- Kit de Batalla: Impetu [EXC]
- Mystery Box: Excalibur [EXC]
- **Reinos Perdidos: Wasteland** [WAS]
- Kit de Batalla: Fortaleza Heroica [TRO]
- Kit de Batalla: Fortuna Olimpica [TRO]
- Mystery Box: Troya [TRO]
- **Reinos Perdidos: La Cofradía** [LCF]
- Kit de Batalla: Dominio [GUE]
- Kit de Batalla: Conquista [GUE]
- Mystery Box: Guerreros del Sol [GUE]
- **Reinos Perdidos: Vigilantes** [VIG]
- **Aniversario 2023** [ANIVERSARIO FURIA X]
- Kit de Batalla: Invasores Fomorianos [GUA]
- Kit de Batalla: Defensores Celtas [GUA]
- Mystery Box: Guardianes de Daana [GUA]
- **Furia Aniversario X** [FURIA 10 AÑOS] [FURIA X]
- **Kingdom Quest** [KIN]
- Kit Extensión Excalibur: Guerra Santa [EXC]
- Kit Extensión Excalibur: Sombras del Desierto [EXC]
- Kit Extensión Troya: Honor Espartano [TEX]
- Kit Extensión Troya: Dominio Persa [TEX]
- Kit Extensión Troya: Valor Ateniense [TEX]
- **Aniversario 25 años** (selección de cartas) [25 ANIVERSARIO]
- Cartas de Juego Organizado 
- Cartas Especiales **Casa MYL** (selección de cartas) [CML]
- Celebración de **Navidad 2024** (selección de cartas) [NFX]
- Toolkit 2025 Fortuna Oscura [TKFX25]
- Toolkit 2025 Destino Brillante [TKFX25]
- **Armagedon** [ARM]
- Kit de Batalla: Alianza Temporal [LBF2]
- Kit de Batalla: Concilio Milenario [LBF2]

---

## 👥 Razas Permitidas

### ⚔️ Razas Actuales (2025)

- Caballero
- Guerrero
- Eterno
- Sombra
- Dragón
- Bestia
- Sacerdote
- Ancestral
- Héroe
- Bárbaro

---

## 📖 Historia del Formato

El **Bloque Furia** nació desde la concepción de la **"Nueva Era"** de Mitos y Leyendas en **2014**, como un símil al formato Primer Bloque de Segunda Era.

El formato fue oficialmente **abandonado** al comenzar la rotación de ediciones en el formato **Imperio** de **Nueva Era** y el nacimiento del formato **Furia Extendido**.

**Furia Extendido** es el actual **formato oficial activo** en conjunto con **Imperio** y representan la evolución del juego competitivo de Nueva Era.

---

## ⚠️ Restricciones Importantes

Las siguientes cartas **NO** se pueden usar en mazos oficiales:

- ❌ Aliados sin raza
- ❌ Cartas que contengan **SP** en el nombre

Si una carta ha recibido un _rework_ (reconocible por tener un logo de rareza de color morado), entonces la carta original ya no se puede usar oficialmente.

---

## ✨ Características del Formato

### ✅ Ventajas

- **Máxima variedad** de cartas disponibles
- Combinación de dos generaciones de cartas
- **Mayor diversidad** de estrategias competitivas
- Acceso a cartas de productos especiales y promocionales

### 🎲 Estilo de Juego

Este formato favorece:

- Construcción de mazos **competitivos** con amplio pool de cartas
- **Sinergia** entre cartas de diferentes generaciones
- **Metagame diverso** y en constante evolución
- Estrategias tanto **clásicas** como **modernas**$fmt_bloqueFuria$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.format_documents (slug, content)
VALUES ('formatosEspeciales', $fmt_formatosEspeciales$# ✨ Formatos Especiales

Existen formatos que toman como base los formatos Full, Racial Edición o Racial Libre, para crear variantes con diferentes reglas y mecánicas especiales.

Para nuestros torneos tenemos a nuestra disposición los siguientes formatos especiales:

---

## 🏛️ Para **Primer Bloque**

### 🗡️ Infantería

**Disponible para:**
- ✅ Full
- ✅ Racial Edición
- ✅ Racial Libre

Formato accesible que limita las cartas a Vasallos y Cortesanos, perfecto para jugadores nuevos.

---

## 🔥 Para **Bloque Furia**

### 🗡️ Infantería

**Disponible para:**
- ✅ Full
- ✅ Racial Limitado
- ✅ Racial Libre

La versión mejorada de Infantería con más opciones de soporte del Bloque Furia.

### 👑 Vassallo, Cortesano, Real (VCR)

**Disponible para:**
- ✅ Full
- ✅ Racial Limitado
- ✅ Racial Libre

Formato intermedio que permite cartas hasta rareza Real, con más potencia que Infantería pero menos que el formato base.

### 🎭 Commander

**Disponible para:**
- ✅ Racial Libre

Formato de 4 jugadores o duelo con mecánicas únicas y una carta "Commander" especial que es el corazón del mazo.

### 🧌 Ragnarok

**Disponible para:**
- ✅ Primer Bloque (Full, Racial Libre, Racial Edición)
- ✅ Bloque Furia (Full, Racial Libre, Racial Limitado)

Formato de restricción única donde todas las cartas se consideran Únicas. Permite Rework y cartas promocionales de todas las rarezas para máxima diversidad.

---

## 🎁 Evento Especial

### 🎁 Sellado

**Disponible para:**
- ✅ Universal (Ambos Bloques)

Formato de evento especial donde cada jugador abre un producto y construye un mazo con un tiempo límite de 30 minutos. Perfecto para eventos comunitarios con igualdad de condiciones.

---

## 📊 Comparativa de Formatos Especiales

| Formato | Rarezas Permitidas | Rework | Oros con Habilidad | Complejidad | Jugadores |
|---------|-------------------|--------|-------------------|-----------|-----------| 
| **Infantería** | Vasallo, Cortesano | ❌ | ❌ | ⭐ Baja | 1v1 |
| **VCR** | Vasallo, Cortesano, Real | ✅ | ✅ | ⭐⭐ Media | 1v1 |
| **Commander** | Todas las rarezas | ✅ | ✅ | ⭐⭐⭐ Alta | 4 jugadores (o 1v1) |
| **Ragnarok** | Todas (Únicas) | ✅ | ✅ | ⭐⭐ Media | 1v1 |
| **Sellado** | Todas (Limitado) | Limitado | Limitado | ⭐⭐ Media | 1v1 |

---

## 🎮 Elige tu Formato

- **¿Buscas accesibilidad?** → 🗡️ **Infantería**
- **¿Quieres más poder?** → 👑 **VCR**
- **¿Buscas máxima diversidad?** → 🧌 **Ragnarok**
- **¿Prefieres épica grupal?** → 🎭 **Commander**
- **¿Quieres un evento comunitario?** → 🎁 **Sellado**$fmt_formatosEspeciales$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.format_documents (slug, content)
VALUES ('primerBloqueRacialLibre', $fmt_primerBloqueRacialLibre$# ⚔️ Primer Bloque Racial Libre

## 📋 Descripción General

El formato **Primer Bloque Racial Libre** permite construir mazos utilizando cartas de todas las ediciones del Primer Bloque, eligiendo una raza de Aliados como identidad principal de tu mazo, con total libertad en las cartas de soporte.

---

## 🎯 Requisitos del Mazo

### 👥 Requisito Racial

- Debes elegir **una raza de Aliados** de cualquiera de las ediciones del bloque.
- Tu mazo debe contener **al menos 16 aliados de la misma raza**.
- La raza elegida define la temática principal de tu estrategia.

### 🛡️ Cartas de Soporte

Las cartas de "soporte" pueden ser de **cualquier edición** del Primer Bloque:

- ⚜️ **Oros**
- 🔮 **Talismanes**
- 🗿 **Tótems**
- ⚔️ **Armas**

---

## 📚 Ediciones Permitidas

Todas las ediciones del **Primer Bloque** están permitidas:

### 🏛️ Ediciones Principales

1. **Espada Sagrada** / Cruzadas
2. **Helénica** / Imperio
3. **Hijos de Daana** / Tierras Altas
4. **Dominios de Ra** / Encrucijada
5. **Drácula** / Inferno

### 📦 Productos Asociados

Se incluyen todos los productos y expansiones asociados a estas ediciones:

- Productos de extensión
- Mazos preconstruidos
- Cartas promocionales
- Ediciones especiales

---

## ✨ Características del Formato

### ✅ Ventajas

- **Máxima libertad** para construir tu mazo
- Acceso a **todas las cartas** del Primer Bloque
- Mayor **diversidad de estrategias** disponibles

### 🎲 Estilo de Juego

Este formato favorece:

- Construcción de mazos **temáticos raciales**
- **Sinergia** entre cartas de diferentes ediciones
- **Creatividad máxima** en la construcción de mazos
- Uso estratégico de cartas de soporte de cualquier edición
- **Flexibilidad táctica** durante el juego

### 🎯 Estrategias Populares

Algunas estrategias viables incluyen:

- Mazos de **control** con amplio soporte
- Estrategias **agresivas** con razas rápidas
- Mazos de **combo** aprovechando sinergias entre ediciones
- Construcciones **temáticas** con identidad racial fuerte$fmt_primerBloqueRacialLibre$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.format_documents (slug, content)
VALUES ('primerBloqueRacialEdicion', $fmt_primerBloqueRacialEdicion$# 🛡️ Primer Bloque Racial Edición

## 📋 Descripción General

El formato **Primer Bloque Racial Edición** es una variante más restrictiva que requiere mantener coherencia de edición entre los aliados y las cartas de soporte, creando mazos más temáticos y balanceados.

---

## 🎯 Requisitos del Mazo

### 👥 Requisito Racial

- Debes elegir **una raza de Aliados** de cualquiera de las ediciones permitidas.
- Tu mazo debe contener **al menos 16 aliados de la misma raza**.
- ⚠️ **Importante:** Los **tótem cuentan como aliados** para este límite de 16 cartas.

### 🛡️ Cartas de Soporte - Regla de Edición

Las cartas de "soporte" **deben ser de la misma edición** que la raza de los Aliados:

- ⚜️ **Oros**
- 🔮 **Talismanes**
- 🗿 **Tótems**
- ⚔️ **Armas**

**Ejemplo:**
> Si eliges la raza **Sombra**, todas las cartas de soporte deben ser de **Hijos de Daana** y sus productos asociados.

---

## 📚 Ediciones Permitidas

En este formato **solo** son válidas las siguientes ediciones:

### 🏛️ Ediciones Principales

1. **Espada Sagrada** / Cruzadas
2. **Helénica** / Imperio
3. **Hijos de Daana** / Tierras Altas
4. **Dominios de Ra** / Encrucijada

### 📦 Productos Asociados

Se incluyen todos los productos y expansiones asociados a estas ediciones permitidas.

---

## 🚫 Restricciones Importantes

### ❌ Ediciones NO Permitidas

Las siguientes ediciones **NO** están permitidas:

- ❌ **Drácula**
- ❌ **Inferno**

### ✅ Excepción: Reimpresiones Permitidas

Cartas de **Drácula** o **Inferno** SÍ están permitidas si cumplen:

- ✔️ Son **reimpresiones** de cartas que originalmente pertenecen a las ediciones permitidas
- ✔️ La carta original existe en: Espada Sagrada, Helénica, Hijos de Daana o Dominios de Ra

**Ejemplo permitido:**
> **Martillo Pesado** de Drácula ✅
> *(Es reimpresión de una carta de edición permitida)*

### ❌ Coherencia de Edición

Recuerda que:

- Todas las cartas de soporte deben coincidir con la edición de la raza elegida
- No puedes mezclar cartas de soporte de diferentes ediciones
- La coherencia temática es obligatoria

---

## ✨ Características del Formato

### 🎯 Filosofía del Formato

Este formato busca:

- **Coherencia temática** en la construcción de mazos
- Mazos **balanceados** dentro de una edición específica
- Mayor **identidad** de cada edición del bloque
- Exclusión de las ediciones más poderosas (Drácula/Inferno)

### 🎲 Estilo de Juego

Este formato favorece:

- Construcción de mazos con **identidad clara**
- **Sinergia** dentro de una misma edición
- **Conocimiento** profundo de cada edición
- Partidas más **equilibradas** y temáticas
- Decisiones estratégicas más **enfocadas**

### 💡 Ventajas del Formato

- **Mazos más temáticos** y coherentes
- **Facilita** la construcción para nuevos jugadores
- **Equilibrio** entre ediciones del bloque
- Cada edición tiene su **identidad única**
- Mayor **previsibilidad** en el meta del formato$fmt_primerBloqueRacialEdicion$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.format_documents (slug, content)
VALUES ('bloqueFuriaRacialLibre', $fmt_bloqueFuriaRacialLibre$# ⚔️ Furia Extendido Racial Libre

## 📋 Descripción General

El formato **Furia Extendido Racial Libre** permite construir mazos utilizando cartas de todas las ediciones y productos especiales del Furia Extendido, con la condición de mantener una identidad racial clara en tu mazo.

---

## 🎯 Requisitos del Mazo

### 👥 Requisito Racial

- Debes elegir **una raza de Aliados** de cualquiera de las ediciones y/o productos especiales del bloque.
- Tu mazo debe contener **al menos 16 aliados de la misma raza**, o **al menos 16 totems**
- Si tu mazo es principalmente **Totems**, igual los **Aliados** que estén en el mazo deben ser de la **misma raza**.

### 🛡️ Cartas de Soporte

Las cartas de "soporte" pueden ser de **cualquier edición y/o productos especiales** del Furia Extendido:

- ⚜️ **Oros**
- 🔮 **Talismanes**
- 🗿 **Tótems**
- ⚔️ **Armas**

---

## 📚 Ediciones Permitidas

Todas las ediciones y productos especiales del **Furia Extendido** están permitidos, incluyendo:

- Ediciones principales del bloque
- Leyendas Bloque Furia
- Leyendas Bloque Furia 2
- Productos Extensión
- Productos Kit de Batalla
- Productos Reinos Perdidos
- Mazos preconstruidos
- Aniversarios
- Kingdom Quest
- Toolkit
- Lootbox
- Juego Organizado
- Cartas promocionales

---

## ✨ Características del Formato

### ✅ Ventajas

- **Amplia libertad** para construir tu mazo
- Acceso a **todas las cartas** del Furia Extendido
- Mayor **diversidad de estrategias** disponibles
- Posibilidad de usar **cartas promocionales y especiales**

### 🎲 Estilo de Juego

Este formato favorece:

- Construcción de mazos **temáticos raciales**
- **Sinergia** entre cartas de diferentes productos
- **Creatividad** en la construcción de mazos
- Uso estratégico de cartas de soporte versátiles$fmt_bloqueFuriaRacialLibre$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.format_documents (slug, content)
VALUES ('bloqueFuriaRacialLimitado', $fmt_bloqueFuriaRacialLimitado$# 🛡️ Furia Extendido Racial Limitado

## 📋 Descripción General

El formato **Furia Extendido Racial Limitado** es una variante más restrictiva que limita las cartas utilizables a ediciones específicas del Furia Extendido, enfocándose en las cartas obtenidas principalmente de sobres.

---

## 🎯 Requisitos del Mazo

### 👥 Requisito Racial

- Debes elegir **una raza de Aliados** de las ediciones permitidas.
- Tu mazo debe contener **al menos 16 aliados de la misma raza**, o **al menos 16 totems**
- Si tu mazo es principalmente **Totems**, igual los **Aliados** que estén en el mazo deben ser de la **misma raza**.

### 🛡️ Cartas de Soporte

Las cartas de "soporte" pueden ser de **cualquier edición permitida** del formato:

- ⚜️ **Oros**
- 🔮 **Talismanes**
- 🗿 **Tótems**
- ⚔️ **Armas**

---

## 📚 Ediciones Permitidas

En este formato **solo** son válidas las cartas de las siguientes ediciones:

### 🏛️ Ediciones Principales

1. **Roma**
2. **Excalibur**
3. **Troya**
4. **Guerreros del Sol**
5. **Guardianes de Daana**

---

## 🎴 Rarezas Permitidas

Solo se permiten cartas obtenidas en sobres con las siguientes rarezas:

- ⭐ **Legendarias**
- 💎 **Ultra Reales**
- 💠 **Mega Reales**
- 🔷 **Reales**
- 🔹 **Vasallos**
- 🔸 **Cortesanos**

---

## 🚫 Restricciones Importantes

### ❌ Productos NO Permitidos

Las siguientes cartas y productos **NO** están permitidos:

- Cartas promocionales (excepto reimpresiones, ver abajo)
- Cartas de productos especiales:
  - Leyendas Bloque Furia
  - Productos Extensión
  - Productos Reinos Perdidos
  - Mazos preconstruidos
  - Aniversarios
  - Kingdom Quest
  - Toolkit
  - Lootbox
  - Juego Organizado

### ✅ Excepciones: Reimpresiones Permitidas

Cartas **Secretas**, **Promocionales** o **Set Paralelo (SP)** SÍ están permitidas si cumplen:

- ✔️ Son **reimpresiones** de cartas que originalmente pertenecen a las ediciones permitidas
- ✔️ La carta original existe en: Roma, Excalibur, Troya, Guerreros del Sol o Guardianes de Daana

**Ejemplo permitido:**
> **Trempulcahue - SP** de Guardianes de Daana ✅

### ❌ Reimpresiones NO Permitidas

Reimpresiones de cartas que **originalmente pertenecen a ediciones NO permitidas** quedan excluidas, aunque aparezcan en ediciones nuevas:

**Ejemplo NO permitido:**
> **Fe sin Límite - SP** de Guardianes de Daana ❌
> *(La carta original no pertenece a las ediciones base permitidas)*

---

## ✨ Características del Formato

### 🎯 Filosofía del Formato

Este formato busca:

- **Equilibrio competitivo** mediante restricciones claras
- Enfoque en cartas **accesibles** de sobres
- Exclusión de cartas **ultra poderosas** de productos especiales
- Ambiente de juego más **balanceado**

### 🎲 Estilo de Juego

Este formato favorece:

- Construcción de mazos con recursos **más limitados**
- **Habilidad** en la construcción de mazos
- **Conocimiento** profundo de las ediciones clásicas
- Partidas más **equilibradas** entre jugadores$fmt_bloqueFuriaRacialLimitado$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.format_documents (slug, content)
VALUES ('infanteria', $fmt_infanteria$# 🗡️ Infantería

**Primer Bloque Racial Libre y Racial Edición | Furia Extendido Racial Libre y Racial Limitado**

## 📋 Descripción General

El formato **Infantería** es una variante del juego que restringe la construcción de mazos a solo cartas de las rarezas **Vasallo** y **Cortesano** (cartas de logo de edición color Rojo y Azul), **oros sin habilidad** y excluye todas las cartas con **Rework**.

Este formato busca crear un ambiente de juego más equilibrado y accesible, enfocándose en cartas de menor potencia.

---

## 🏯 Reglas de Construcción del Mazo

### 📚 Base del Formato

Las reglas de construcción de mazo son **las mismas** que en los formatos en los que está basado:

- **Infantería Racial Edición** → Sigue las reglas de Racial Edición + restricciones Infantería
- **Infantería Racial Libre** → Sigue las reglas de Racial Libre + restricciones Infantería

---

## 🚫 Restricciones de Infantería

### ✅ Cartas Permitidas

| Tipo | Detalle |
|------|--------|
| **Aliados** | Solo Vasallo y Cortesano |
| **Oros** | Solo sin habilidad |
| **Talismanes** | Solo Vasallo y Cortesano |
| **Tótems** | Solo Vasallo y Cortesano |
| **Armas** | Solo Vasallo y Cortesano |
| **Rework** | ❌ NO permitido |

### ❌ Cartas Prohibidas

- Cartas con **Rework**
- Aliados de rareza **Mayor** (Real, Ultra Real, Legendario)
- Oros con habilidad
- Banlist del formato

---

## ✨ Características del Formato

### 🎮 Estilo de Juego

Infantería promueve:

- **Accesibilidad** - Cartas más comunes y fáciles de obtener
- **Equilibrio** - Menos diferencia de poder entre mazos
- **Estrategia** - Mayor énfasis en construcción de mazo inteligente
- **Diversidad** - Múltiples arquetipo viables$fmt_infanteria$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.format_documents (slug, content)
VALUES ('vcr', $fmt_vcr$# 👑 Vasallo, Cortesano, Real (VCR)

**Furia Extendido Racial Libre**

## 📋 Descripción General

El formato **VCR** es una variante que restringe la construcción de mazos a cartas de rareza **Vasallo**, **Cortesano** y **Real**. Este formato permite cartas con **Rework** y **oros con habilidad**, creando un ambiente diferente al Infantería.

Las reglas de construcción de mazo son las mismas que en los formatos en los que está basado. Si un torneo es de VCR Racial Libre, se deben seguir las reglas de Racial Libre aplicando las restricciones de formato **VCR**.

---

## 🏯 Reglas de Construcción del Mazo

### 📚 Base del Formato

- Sigue todas las reglas de **Furia Extendido Racial Libre**
- Aplica las restricciones de rareza de **VCR**

---

## ✅ Cartas Permitidas

| Tipo | Rarezas Permitidas |
|------|-------------------|
| **Aliados** | Vasallo, Cortesano, Real |
| **Oros** | Vasallo, Cortesano, Real (Incluyendo con habilidad) |
| **Talismanes** | Vasallo, Cortesano, Real |
| **Tótems** | Vasallo, Cortesano, Real |
| **Armas** | Vasallo, Cortesano, Real |
| **Rework** | ✅ Permitido (Mientras sean Vasallo, Cortesano o Real) |

---

## 🚫 Cartas Prohibidas

- Cartas de rareza:
  - Mega Real
  - Ultra Real
  - Legendaria
  - Promocional
- Cartas originales que hayan recibido rework
- Banlist del formato

---

## ✨ Características del Formato

### 🎮 Estilo de Juego

VCR ofrece:

- **Mayor poder** que Infantería
- **Más opciones** de cartas de apoyo
- **Flexibilidad** con oros con habilidad
- **Estrategia avanzada** con Rework permitido$fmt_vcr$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.format_documents (slug, content)
VALUES ('commander', $fmt_commander$# 🎭 Commander

**Furia Extendido Racial Libre**

## 📋 Descripción General

El Formato **Commander** está basado en el formato Commander de Magic: The Gathering, adaptado a las reglas de Mitos y Leyendas. Es un formato pensado principalmente para **4 jugadores**, aunque también puede jugarse en duelos 1vs1.

Una nueva zona en el tablero alberga la carta de "Commander" al iniciar la partida, denominada **"zona de comando"** (ubicada sobre el cementerio, al lado de la zona de oros pagados).

---

## 🏯 Construcción del Mazo

| Requisito | Detalles |
|-----------|----------|
| **📋 Tamaño** | 80 cartas (incluyendo commander y oro inicial) |
| **👑 Commander** | Aliado de rareza Ultra Real |
| **🏛️ Alineación racial** | Todos los aliados deben tener la misma raza que el commander |
| **⚖️ Cartas Únicas** | Todas las cartas se consideran Únicas |
| **📚 Ediciones permitidas** | Todas las ediciones y promocionales de Furia Extendido |

---

## 🎮 Reglas Especiales del Commander

### 🏠 Ubicación y Coste

- El commander inicia en su zona especial (**zona de comando**)
- **Debe pagarse su coste en oro completo** para jugarlo
- NO puede ser jugado sin pagar su coste
- El coste NO puede ser reducido, pero sí puede pagarse con oros generados
- NO puede ser jugado con cartas que hagan referencia a búsqueda de cartas

### 🏯 Juego del Commander

- **Cualquier jugador** puede pagar el coste de oro de cualquier commander (propio o del oponente) para jugarlo en su línea de defensa
- Si el commander sale del juego (destruido, desterrado, barajado o llevado a la mano), **vuelve a la zona de comando**
- El coste aumenta **+2 oros** cada vez que sale del juego (mantén un contador de coste)
- Al jugar el commander de otro jugador, la **raza y todas las referencias a raza** en la habilidad de esa carta pasan a ser la raza elegida por el jugador que esté pagando el coste del commander
- NO puedes controlar más de un commander al mismo tiempo.

### 🏆 Condiciones de Victoria

- Si un jugador se queda **sin cartas en el mazo**, **pierde**
- Si un commander causa **41 de daño de combate** a un mismo jugador, **ese jugador pierde** (mantén un contador de daño)
- **Gana** el jugador que quede con cartas en el mazo

### ⚔️ Restricción de Ataque (Multiplayer)

En juegos de 4 jugadores: **Un mismo jugador no puede ser atacado dos veces consecutivas**

*Ejemplo: Jugador 1 ataca a Jugador 2 → Turno de Jugador 3 → Jugador 3 NO puede atacar a Jugador 2*

---

## ✨ Características del Formato

### 🎮 Estilo de Juego

Commander ofrece:

- **Partidas épicas** y memorables
- **Mayor interacción social**
- **Construcción creativa** de mazos
- **Experiencia comunitaria** en grupo$fmt_commander$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.format_documents (slug, content)
VALUES ('ragnarok', $fmt_ragnarok$# 🧌 Ragnarok

**Todas los bloques y formatos disponibles**

## 📋 Descripción General

El formato **Ragnarok** es una variante que restringe la construcción de mazos, obligando a considerar todas las cartas como **Únicas**. Este formato permite cartas con **Rework**, **oros con habilidad**, de cualquier rareza y cartas promocionales (dependiendo del bloque y formatos elegidos).

Las reglas de construcción de mazo son las mismas que en los formatos en los que está basado. Si un torneo es de Ragnarok Racial Libre, se deben seguir las reglas de Racial Libre aplicando las restricciones de formato **Ragnarok**.

---

## 🏯 Reglas de Construcción del Mazo

### 📚 Base del Formato

- Sigue todas las reglas del bloque y formato elegido
- Aplica las restricciones de cartas de **Ragnarok**

---

## ✅ Cartas Permitidas

| Tipo | Rarezas Permitidas |
|------|-------------------|
| **Aliados** | Todas |
| **Oros** | Todas |
| **Talismanes** | Todas |
| **Tótems** | Todas |
| **Armas** | Todas |
| **Rework** | ✅ Permitido |

---

## 🚫 Cartas Prohibidas

- Ban list del formato elegido

---

## ✨ Características del Formato

### 🎮 Estilo de Juego

Ragnarok ofrece:

- **Restricción única** de cartas (todas como Únicas)
- **Mayor diversidad** de estrategias
- **Flexibilidad** total de rarezas
- **Rework** y cartas promocionales permitidas$fmt_ragnarok$)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.format_documents (slug, content)
VALUES ('sellado', $fmt_sellado$# 🎁 Sellado

**Formato de Producto Especial**

## 📋 Descripción General

El formato **Sellado** es un formato especial basado en el formato Full Libre que se juega en eventos especiales llamados "sellado". En este formato, todos los participantes compran el mismo producto y tienen **30 minutos** para abrirlo y construir un mazo única y exclusivamente con las cartas que obtuvieron en ese producto.

Este formato es perfecto para eventos comunitarios, ya que iguala las condiciones iniciales para todos los jugadores y promueve la creatividad en la construcción limitada de mazos.

---

## 🏯 Construcción del Mazo

| Requisito | Detalles |
|-----------|----------|
| **📋 Tamaño** | Mínimo 40 cartas |
| **🚫 Ban List** | No aplica |
| **📚 Rareza** | Sin restricciones de rareza |
| **🎨 Razas** | Se pueden mezclar aliados de todas las razas |
| **⏱️ Construcción** | 30 minutos máximo |
| **🔐 Cartas Permitidas** | Solo del producto recién abierto |

---

## 🎮 Reglas Especiales del Sellado

### 🏠 Construcción del Mazo

- **Únicamente cartas del producto recién abierto** pueden ser utilizadas en el mazo
- La única excepción son los **oros sin habilidad**, que pueden traerse de fuera del producto
- Alternativamente, puedes usar **cartas al revés** para representar oros sin habilidad

### 🚨 Restricciones Importantes

- **Llevar cartas que no sean oros sin habilidad desde afuera del producto es causal de eliminación inmediata**
- Se aplican las **mismas reglas generales de armado de mazos** de Mitos y Leyendas
- No hay restricciones de edición (todas las versiones del producto son válidas)

### 🏛️ Reglas de Juego

- Se juegan con **modalidad sin restricción racial**
- Se pueden mezclar aliados de **todas las razas** en el mismo mazo
- Se aplican todas las reglas normales de combate y juego de Mitos y Leyendas

---

## ✨ Características del Formato

### 🎮 Estilo de Juego

Sellado ofrece:

- **Igualdad de condiciones** para todos los participantes
- **Juego en vivo** con construcción de mazo bajo presión
- **Máxima creatividad** en la construcción limitada
- **Experiencia emocionante** y diferente cada vez
- **Accesibilidad** para nuevos jugadores (no necesitan colección previa)

### 🏆 Ventajas

✅ Todos comienzan con las mismas condiciones  
✅ Prueba tu habilidad de adaptación  
✅ Evento comunitario inclusivo  
✅ Experiencia memorable$fmt_sellado$)
ON CONFLICT (slug) DO NOTHING;

