// ============================================================
// FRM (Ficsit Remote Monitoring) API Types
// Based on: https://github.com/featheredtoast/FicsitRemoteMonitoring
// ============================================================

// --- Common Types ---

export interface Location {
  x: number
  y: number
  z: number
  rotation: number
}

export interface PowerInfo {
  CircuitGroupID: number
  CircuitID: number
  PowerConsumed: number
  MaxPowerConsumed: number
}

export interface Features {
  properties: {
    name: string
    type: string
  }
  geometry: {
    coordinates: {
      x: number
      y: number
      z: number
    }
    type: string
  }
}

// --- Factory (Production Buildings) ---

export interface ProductionItem {
  Name: string
  ClassName: string
  Amount: number
  CurrentProd: number
  MaxProd: number
  ProdPercent: number
}

export interface IngredientItem {
  Name: string
  ClassName: string
  Amount: number
  CurrentConsumed: number
  MaxConsumed: number
  ConsPercent: number
}

export interface FactoryBuilding {
  ID: string
  Name: string
  ClassName: string
  location: Location
  Recipe: string
  RecipeClassName: string
  production: ProductionItem[]
  ingredients: IngredientItem[]
  InputInventory: InventoryItem[]
  OutputInventory: InventoryItem[]
  ManuSpeed: number
  Somersloops?: number
  PowerShards?: number
  IsConfigured: boolean
  IsProducing: boolean
  IsPaused: boolean
  Productivity: number
  PowerInfo: PowerInfo
  features: Features
}

// --- Power ---

export interface PowerCircuit {
  CircuitGroupID: number
  PowerProduction: number
  PowerConsumed: number
  PowerCapacity: number
  PowerMaxConsumed: number
  BatteryInput: number
  BatteryOutput: number
  BatteryDifferential: number
  BatteryPercent: number
  BatteryCapacity: number
  BatteryTimeEmpty: string
  BatteryTimeFull: string
  AssociatedCircuits: number[]
  FuseTriggered: boolean
}

// --- Extractors (Miners) ---

export interface ExtractorProductionItem {
  Name: string
  ClassName: string
  Amount: number
  CurrentProd: number
  MaxProd: number
  ProdPercent: number
}

export interface Extractor {
  ID: string
  Name: string
  ClassName: string
  location: Location
  Recipe: string
  RecipeClassName: string
  production: ExtractorProductionItem[]
  ManuSpeed: number
  IsConfigured: boolean
  IsProducing: boolean
  IsPaused: boolean
  PowerInfo: PowerInfo
  features: Features
}

// --- Storage Inventory ---

export interface InventoryItem {
  Name: string
  ClassName: string
  Amount: number
  MaxAmount: number
}

export interface StorageContainer {
  ID: string
  Name: string
  ClassName: string
  location: Location
  Inventory: InventoryItem[]
  features: Features
}

// --- Generators ---

export interface Generator {
  ID: string
  Name: string
  ClassName: string
  location: Location
  BaseProd: number
  DynamicProdCapacity: number
  DynamicProdDemandFactor: number
  RegulatedDemandProd: number
  IsFullSpeed: boolean
  CanStart: boolean
  LoadPercentage: number
  ProductionCapacity: number
  DefaultProductionCapacity: number
  PowerProductionPotential: number
  Somersloops: number
  PowerShards: number
  FuelAmount: number
  FuelResource: string
  Supplement: {
    Name: string
    ClassName: string
    CurrentConsumed: number
    MaxConsumed: number
    PercentFull: number
  }
  FuelInventory: { Name: string; ClassName: string; Amount: number; MaxAmount: number }[]
  PowerInfo: PowerInfo
  features: Features
}

// --- Player ---

export interface Player {
  ID: string
  Name: string
  ClassName: string
  location: Location
  Speed: number
  Online: boolean
  PlayerHP: number
  Dead: boolean
  Inventory: InventoryItem[]
  features: Features
}

// --- Map Markers ---

export interface MapMarker {
  ID: string
  Name: string
  location: { x: number; y: number; z: number }
  Category: string
  MapMarkerType: string
  IconID: number
  ColorSlot: string
  Scale: number
  CompassViewDistance: string
}

// --- World Inventory (aggregated) ---

export interface WorldInventoryItem {
  Name: string
  ClassName: string
  Amount: number
}

// --- Drone Station ---

export interface DroneStation {
  ID: string
  Name: string
  ClassName: string
  location: Location
  PairedStation: string
  DroneStatus: string
  AvgIncRate: number
  AvgOutRate: number
  LatestIncStack: string
  LatestOutStack: string
  features: Features
}

// --- Train Station ---

export interface TrainStationCargo {
  ID: string
  Name: string
  ClassName: string
  location: Location
  TransferRate: number
  InflowRate: number
  OutflowRate: number
  LoadingMode: string
  LoadingStatus: string
  DockingStatus: string
  Inventory: InventoryItem[]
  PowerInfo: PowerInfo
}

export interface TrainStation {
  ID: string
  Name: string
  ClassName: string
  location: Location
  TransferRate: number
  InflowRate: number
  OutflowRate: number
  CargoInventory: TrainStationCargo[]
  PowerInfo: PowerInfo
  features: Features
}

// --- Train ---

export interface TrainVehicle {
  Name: string
  ClassName: string
  TotalMass: number
  PayloadMass: number
  MaxPayloadMass: number
  Inventory: InventoryItem[]
}

export interface Train {
  ID: string
  Name: string
  ClassName: string
  location: Location
  TotalMass: number
  PayloadMass: number
  MaxPayloadMass: number
  ForwardSpeed: number
  ThrottlePercent: number
  TrainStation: string
  Derailed: boolean
  PendingDerail: boolean
  Status: string
  TimeTable: any[]
  TimeTableIndex: number
  SelfDriving: string
  Docking: string
  Path: string
  Vehicles: TrainVehicle[]
  PowerInfo: PowerInfo
  features: Features
}

// --- Truck Station ---

export interface TruckStation {
  ID: string
  Name: string
  ClassName: string
  location: Location
  LoadMode: string
  TransferRate: number
  MaxTransferRate: number
  StationStatus: string
  FuelRate: number
  Inventory: InventoryItem[]
  FuelInventory: InventoryItem[]
  PowerInfo: PowerInfo
  features: Features
}

// --- Vehicle ---

export interface Vehicle {
  ID: string
  Name: string
  ClassName: string
  location: Location
  PathName: string
  AutoPilotStatus: string
  Driver: string
  CurrentGear: number
  ForwardSpeed: number
  EngineRPM: number
  ThrottlePercent: number
  Airborne: boolean
  FollowingPath: boolean
  Autopilot: boolean
  HasFuel: boolean
  FuelConsumption: number
  Inventory: InventoryItem[]
  FuelInventory: InventoryItem[]
  features: Features
}

// --- Session Info ---

export interface SessionInfo {
  SessionName: string
  PlayerCount: number
  TotalGameDuration: number
  SessionVisibility: string
}

// --- Sink ---

export interface ResourceSink {
  TotalPoints: number
  PointsToCoupon: number
  NumCoupon: number
  Percent: number
}

// --- Collectables (Power Slugs, Artifacts, Drop Pods) ---

export interface PowerSlug {
  ID: string
  Name: string
  ClassName: string
  location: Location
  features: Features
}

export interface Artifact {
  ID: string
  Name: string
  ClassName: string
  location: Location
  features: Features
}

export interface DropPod {
  ID: string
  location: Location
  Opened: boolean
  Looted: boolean
  CostType: string
  RequiredItem: {
    Name: string
    ClassName: string
    Amount: number
    MaxAmount: number
  }
  RequiredPower: number
  features: Features
}

// --- API Response Union (for generic polling) ---

export type FRMEndpoint =
  | 'getFactory'
  | 'getPower'
  | 'getStorageInv'
  | 'getExtractor'
  | 'getGenerators'
  | 'getWorldInv'
  | 'getDroneStation'
  | 'getTrainStation'
  | 'getSessionInfo'
  | 'getResourceSink'
  | 'getPlayer'
  | 'getMapMarkers'
  | 'getCables'
  | 'getPipes'
  | 'getTruckStation'
  | 'getVehicles'
  | 'getTrains'
  | 'getPowerSlug'
  | 'getArtifacts'
  | 'getDropPod'

export type FRMDataMap = {
  getFactory: FactoryBuilding[]
  getPower: PowerCircuit[]
  getStorageInv: StorageContainer[]
  getExtractor: Extractor[]
  getGenerators: Generator[]
  getWorldInv: WorldInventoryItem[]
  getDroneStation: DroneStation[]
  getTrainStation: TrainStation[]
  getSessionInfo: SessionInfo[]
  getResourceSink: ResourceSink[]
  getPlayer: Player[]
  getMapMarkers: MapMarker[]
  getCables: any[]
  getPipes: any[]
  getTruckStation: TruckStation[]
  getVehicles: Vehicle[]
  getTrains: Train[]
  getPowerSlug: PowerSlug[]
  getArtifacts: Artifact[]
  getDropPod: DropPod[]
}
