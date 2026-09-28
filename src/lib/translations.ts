/**
 * Diccionario de traducción Inglés → Español para Satisfactory.
 * Basado en los nombres oficiales del juego en español.
 * Los que no tienen traducción oficial se dejan en inglés o se traducen literalmente.
 */

const translations: Record<string, string> = {
  // === RECURSOS / MINERALES ===
  'Iron Ore': 'Mineral de Hierro',
  'Copper Ore': 'Mineral de Cobre',
  'Limestone': 'Piedra Caliza',
  'Coal': 'Carbón',
  'Crude Oil': 'Petróleo Crudo',
  'Caterium Ore': 'Mineral de Caterio',
  'Raw Quartz': 'Cuarzo Bruto',
  'Sulfur': 'Azufre',
  'Bauxite': 'Bauxita',
  'Uranium': 'Uranio',
  'Nitrogen Gas': 'Gas Nitrógeno',
  'Water': 'Agua',
  'SAM': 'SAM',

  // === LINGOTES ===
  'Iron Ingot': 'Lingote de Hierro',
  'Copper Ingot': 'Lingote de Cobre',
  'Steel Ingot': 'Lingote de Acero',
  'Caterium Ingot': 'Lingote de Caterio',
  'Aluminum Ingot': 'Lingote de Aluminio',

  // === PIEZAS BÁSICAS ===
  'Iron Rod': 'Barra de Hierro',
  'Iron Plate': 'Lámina de Hierro',
  'Reinforced Iron Plate': 'Lámina de Hierro Reforzada',
  'Screw': 'Tornillos',
  'Screws': 'Tornillos',
  'Wire': 'Alambre',
  'Cable': 'Cable',
  'Concrete': 'Hormigón',
  'Copper Sheet': 'Lámina de Cobre',
  'Quartz Crystal': 'Cristal de Cuarzo',
  'Silica': 'Sílice',
  'Steel Beam': 'Viga de Acero',
  'Steel Pipe': 'Tubería de Acero',
  'Quickwire': 'Turboalambre',
  'Plastic': 'Plástico',
  'Rubber': 'Goma',
  'Petroleum Coke': 'Coque de Petróleo',
  'Fuel': 'Combustible',
  'Polymer Resin': 'Resina Polimérica',
  'Heavy Oil Residue': 'Residuo de Petróleo Pesado',
  'Aluminum Scrap': 'Chatarra de Aluminio',
  'Alumina Solution': 'Solución de Alúmina',
  'Sulfuric Acid': 'Ácido Sulfúrico',
  'Nitric Acid': 'Ácido Nítrico',
  'Copper Powder': 'Cobre en Polvo',

  // === COMPONENTES INDUSTRIALES ===
  'Rotor': 'Rotor',
  'Stator': 'Estátor',
  'Motor': 'Motor',
  'Modular Frame': 'Estructura Modular',
  'Heavy Modular Frame': 'Estructura Modular Pesada',
  'Fused Modular Frame': 'Estructura Modular Fundida',
  'Encased Industrial Beam': 'Viga Industrial Reforzada',
  'Automated Wiring': 'Cableado Automático',
  'Circuit Board': 'Circuito Impreso',
  'Computer': 'Ordenador',
  'Supercomputer': 'Superordenador',
  'AI Limiter': 'Limitador IA',
  'High-Speed Connector': 'Conector de Alta Velocidad',
  'Radio Control Unit': 'Unidad de Control por Radio',
  'Adaptive Control Unit': 'Unidad de Control Adaptable',
  'Assembly Director System': 'Sistema de Montaje Director',
  'Magnetic Field Generator': 'Generador de Campos Magnético',
  'Electromagnetic Control Rod': 'Barra de Control Electromagnética',
  'Turbo Motor': 'Motor Turbo',
  'Thermal Propulsion Rocket': 'Cohete de Propulsión Térmica',
  'Cooling System': 'Sistema de Refrigeración',
  'Heat Sink': 'Disipador de Calor',
  'Battery': 'Batería',
  'Pressure Conversion Cube': 'Cubo Conversor de Presiones',
  'Nuclear Pasta': 'Pasta Nuclear',
  'Smart Plating': 'Placas Inteligentes',
  'Versatile Framework': 'Marco Versátil',
  'Modular Engine': 'Motor Modular',
  'Crystal Oscillator': 'Oscilador de Cristal',
  'Alclad Aluminum Sheet': 'Lámina de Aluminio Revestido',
  'Aluminum Casing': 'Carcasa de Aluminio',
  'Fabric': 'Tejido',
  'Biomass': 'Biomasa',
  'Solid Biofuel': 'Biocombustible Sólido',
  'Liquid Biofuel': 'Biocombustible Líquido',
  'Leaves': 'Hojas',
  'Wood': 'Madera',
  'Iron Rebar': 'Barra de Hierro Reforzada',
  'Compacted Coal': 'Carbón Compactado',
  'Black Powder': 'Pólvora',
  'Smokeless Powder': 'Pólvora sin Humo',

  // === COMBUSTIBLE NUCLEAR ===
  'Encased Uranium Cell': 'Célula de Uranio Encapsulada',
  'Uranium Fuel Rod': 'Barra de Combustible de Uranio',
  'Non-fissile Uranium': 'Uranio No Fisible',
  'Plutonium Pellet': 'Gránulos de Plutonio',
  'Encased Plutonium Cell': 'Célula de Plutonio Encapsulado',
  'Plutonium Fuel Rod': 'Barra de Combustible de Plutonio',
  'Uranium Waste': 'Desecho de Uranio',
  'Plutonium Waste': 'Desecho de Plutonio',

  // === ENVASADOS ===
  'Empty Canister': 'Garrafa Vacía',
  'Empty Fluid Tank': 'Bombona de Fluido Vacía',
  'Packaged Water': 'Agua Envasada',
  'Packaged Oil': 'Petróleo Envasado',
  'Packaged Fuel': 'Combustible Envasado',
  'Packaged Heavy Oil Residue': 'Residuo de Petróleo Pesado Envasado',
  'Packaged Liquid Biofuel': 'Biocombustible Líquido Envasado',
  'Packaged Alumina Solution': 'Solución de Alúmina Envasado',
  'Packaged Sulfuric Acid': 'Ácido Sulfúrico Envasado',
  'Packaged Nitric Acid': 'Ácido Nítrico Envasado',
  'Packaged Nitrogen Gas': 'Gas Nitrógeno Envasado',

  // === MÁQUINAS / EDIFICIOS ===
  'Constructor': 'Constructor',
  'Assembler': 'Ensambladora',
  'Manufacturer': 'Productor',
  'Smelter': 'Horno',
  'Foundry': 'Fundición',
  'Refinery': 'Refinería',
  'Blender': 'Mezcladora',
  'Packager': 'Envasadora',
  'Particle Accelerator': 'Acelerador de Partículas',
  'Converter': 'Convertidor',
  'Quantum Encoder': 'Codificador Cuántico',

  // === MINEROS ===
  'Miner Mk.1': 'Taladro Mk.1',
  'Miner Mk.2': 'Taladro Mk.2',
  'Miner Mk.3': 'Taladro Mk.3',
  'Oil Extractor': 'Extractor de Petróleo',
  'Water Extractor': 'Extractor de Agua',
  'Resource Well Pressurizer': 'Presurizador de Pozo de Recursos',
  'Resource Well Extractor': 'Extractor de Pozo de Recursos',

  // === GENERADORES ===
  'Biomass Burner': 'Quemador de Biomasa',
  'Coal-Powered Generator': 'Generador de Carbón',
  'Coal Generator': 'Generador de Carbón',
  'Fuel Generator': 'Generador de Combustible',
  'Nuclear Power Plant': 'Central Nuclear',
  'Geothermal Generator': 'Generador Geotérmico',

  // === LOGÍSTICA ===
  'Conveyor Belt Mk.1': 'Cinta Transportadora Mk.1',
  'Conveyor Belt Mk.2': 'Cinta Transportadora Mk.2',
  'Conveyor Belt Mk.3': 'Cinta Transportadora Mk.3',
  'Conveyor Belt Mk.4': 'Cinta Transportadora Mk.4',
  'Conveyor Belt Mk.5': 'Cinta Transportadora Mk.5',
  'Conveyor Lift Mk.1': 'Cinta Elevadora Mk.1',
  'Conveyor Lift Mk.2': 'Cinta Elevadora Mk.2',
  'Conveyor Lift Mk.3': 'Cinta Elevadora Mk.3',
  'Conveyor Lift Mk.4': 'Cinta Elevadora Mk.4',
  'Conveyor Lift Mk.5': 'Cinta Elevadora Mk.5',
  'Conveyor Splitter': 'Divisor de Transportadores',
  'Conveyor Merger': 'Unión de Transportadores',
  'Storage Container': 'Contenedor de Almacenamiento',
  'Industrial Storage Container': 'Contenedor de Almacenamiento Industrial',
  'Pipeline': 'Tubería',
  'Pipeline Mk.2': 'Tubería Mk.2',
  'Pipeline Pump Mk.1': 'Bomba de Tubería Mk.1',
  'Pipeline Pump Mk.2': 'Bomba de Tubería Mk.2',
  'Pipeline Junction Cross': 'Cruce de Unión de Tuberías',
  'Fluid Buffer': 'Regulador de Fluidos',
  'Industrial Fluid Buffer': 'Regulador de Fluidos Industrial',
  'Valve': 'Válvula',

  // === TRANSPORTE ===
  'Truck Station': 'Estación de Camiones',
  'Tractor': 'Tractor',
  'Truck': 'Camión',
  'Explorer': 'Explorador',
  'Factory Cart': 'Carro de Fábrica',
  'Train Station': 'Estación de Tren',
  'Freight Platform': 'Plataforma de Carga',
  'Fluid Freight Platform': 'Plataforma de Carga de Fluidos',
  'Empty Platform': 'Plataforma Vacía',
  'Railway': 'Raíl',
  'Electric Locomotive': 'Locomotora Eléctrica',
  'Train': 'Tren',
  'Freight Car': 'Vagón de Carga',
  'Drone Port': 'Estación de Drones',
  'Drone': 'Drón',

  // === ENERGÍA ===
  'Power Line': 'Línea Eléctrica',
  'Power Pole Mk.1': 'Poste de Energía Mk.1',
  'Power Pole Mk.2': 'Poste de Energía Mk.2',
  'Power Pole Mk.3': 'Poste de Energía Mk.3',
  'Power Storage': 'Acumulador de Energía',
  'Power Switch': 'Interruptor de Energía',
  'Priority Power Switch': 'Interruptor de Energía Prioritario',

  // === OTROS EDIFICIOS ===
  'Space Elevator': 'Elevador Espacial',
  'AWESOME Sink': 'Triturador AWESOME',
  'AWESOME Shop': 'Tienda AWESOME',
  'MAM': 'MAM',
  'HUB': 'HUB',
  'Craft Bench': 'Taller de Fabricación',
  'Equipment Workshop': 'Taller de Equipamiento',
  'Radar Tower': 'Torre de Radar',
  'Lookout Tower': 'Torre de Vigía',

  // === VEHÍCULOS / ESTADOS ===
  'Producing': 'Produciendo',
  'Idle': 'Inactivo',
  'Paused': 'Pausado',
  'Standby': 'En Espera',

  // === ITEMS MISCELÁNEOS ===
  'Power Slug': 'Babosa Eléctrica',
  'Blue Power Slug': 'Babosa Eléctrica Azul',
  'Power Shard': 'Fragmento de Energía',
  'Somersloop': 'Somersloop',
  'Mercer Sphere': 'Esfera de Mercer',
  'FICSIT Coupon': 'Cupón FICSIT',
  'Hard Drive': 'Disco Duro',
  'Object Scanner': 'Escáner de Objetos',
  'Beacon': 'Baliza',
  'Portable Miner': 'Taladro Portátil',
  'Chainsaw': 'Motosierra',
  'Xeno-Basher': 'Xeno-Basher',
  'Jetpack': 'Mochila Propulsora',
  'Hover Pack': 'Aeropropulsor',
  'Gas Mask': 'Máscara Antigás',
  'Gas Filter': 'Filtro de Gas',
  'Hazmat Suit': 'Traje para Materiales Peligrosos',
  'Iodine Infused Filter': 'Filtro de Filtrado de Yodo',
  'Blade Runners': 'Zancadas',
  'Parachute': 'Paracaídas',
  'Zipline': 'Tirolina',
  'Rifle': 'Rifle',
  'Nobelisk Detonator': 'Detonador de Nobelisk',
  'Nobelisk': 'Nobelisk',
  'Rebar Gun': 'Pistola de Barras',
  'Stun Rebar': 'Barra Aturdidora',
  'Alien DNA Capsule': 'Cápsula de ADN Alienígena',
  'Alien Protein': 'Proteína Alienígena',
  'Bacon Agaric': 'Agárico Bacon',
  'Beryl Nut': 'Nuez de Berilo',
  'Paleberry': 'Baya Pálida',
  'Mycelia': 'Micelio',
  'Stinger Remains': 'Restos de Stinger',
  'Personal Storage Box': 'Caja de Almacenamiento Personal',
  'Dimensional Depot Uploader': 'Cargador del Depósito Dimensional',
  'Hog Remains': 'Restos de Jabalí',
}

/**
 * Traduce un nombre del juego del inglés al español.
 * Si no existe traducción, devuelve el nombre original.
 */
export function t(name: string): string {
  if (!name) return name
  
  // Búsqueda exacta
  const direct = translations[name]
  if (direct) return direct

  // Búsqueda case-insensitive
  const lower = name.toLowerCase()
  for (const [key, value] of Object.entries(translations)) {
    if (key.toLowerCase() === lower) return value
  }

  return name
}

/**
 * Traduce un nombre, intentando también coincidencias parciales.
 * Útil para nombres compuestos como "Recipe_Concrete_C"
 */
export function tFuzzy(name: string): string {
  if (!name) return name
  
  const direct = t(name)
  if (direct !== name) return direct

  // Intentar sin prefijos/sufijos comunes de classnames
  const cleaned = name
    .replace(/^(Recipe_|Desc_|Build_)/, '')
    .replace(/_C$/, '')
    .replace(/_/g, ' ')
  
  const translated = t(cleaned)
  if (translated !== cleaned) return translated

  return name
}
