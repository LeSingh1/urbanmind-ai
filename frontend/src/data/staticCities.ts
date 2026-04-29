import type { CityProfile, Landmark } from '@/types/city.types'

export const STATIC_CITIES: CityProfile[] = [
  city('new_york', 'New York City', 'United States', 40.75, -73.99, 13, 'Humid subtropical', 8300000, 85000, 0.4,
    'Island geography limits outward sprawl. AI focuses on vertical densification, infill, and waterfront flood adaptation.',
    'Water boundaries, coastal flood risk, historic preservation districts',
    [-74.26, 40.48, -73.7, 40.92],
    [
      // Central Park: CPW (-73.9812) to 5th Ave (-73.9492), 59th St (40.7641) to 110th St (40.8008)
      { name: 'Central Park', lat: 40.7824, lng: -73.9654, zone_type_id: 'PARK_SMALL', category: 'Parks & Green', data_source: 'real', w_deg: 0.0320, h_deg: 0.0367 },
      { name: 'Columbia University', lat: 40.8075, lng: -73.9626, zone_type_id: 'EDU_HIGH', category: 'Education', data_source: 'real', w_deg: 0.008, h_deg: 0.007 },
      { name: 'Bellevue Hospital', lat: 40.7392, lng: -73.9749, zone_type_id: 'HEALTH_HOSPITAL', category: 'Healthcare', data_source: 'real', w_deg: 0.005, h_deg: 0.003 },
      { name: 'Grand Central Terminal', lat: 40.7527, lng: -73.9772, zone_type_id: 'BUS_STATION', category: 'Transit', data_source: 'real', w_deg: 0.003, h_deg: 0.002 },
      { name: 'Wall Street Financial District', lat: 40.7074, lng: -74.0113, zone_type_id: 'COM_OFFICE_PLAZA', category: 'Commercial', data_source: 'real', w_deg: 0.013, h_deg: 0.009 },
      { name: 'Times Square Commercial Core', lat: 40.7580, lng: -73.9855, zone_type_id: 'COM_SMALL_SHOP', category: 'Commercial', data_source: 'real', w_deg: 0.006, h_deg: 0.007 },
      { name: 'LaGuardia Airport', lat: 40.7769, lng: -73.8740, zone_type_id: 'BUS_STATION', category: 'Transit', data_source: 'real', w_deg: 0.029, h_deg: 0.014 },
      { name: 'Yankee Stadium', lat: 40.8296, lng: -73.9262, zone_type_id: 'CULT_ARENA', category: 'Culture & Sport', data_source: 'real', w_deg: 0.003, h_deg: 0.002 },
      { name: 'Brooklyn Navy Yard Industrial', lat: 40.7006, lng: -73.9708, zone_type_id: 'IND_WAREHOUSE', category: 'Industrial', data_source: 'real', w_deg: 0.014, h_deg: 0.006 },
      { name: 'NYC Housing Authority — Red Hook', lat: 40.6744, lng: -74.0082, zone_type_id: 'RES_AFFORDABLE', category: 'Residential', data_source: 'real', w_deg: 0.009, h_deg: 0.005 },
      { name: 'Hudson Yards Smart District', lat: 40.7536, lng: -74.0014, zone_type_id: 'SMART_TRAFFIC_LIGHT', category: 'Smart Infrastructure', data_source: 'real', w_deg: 0.009, h_deg: 0.005 },
      { name: 'Con Edison Power Grid — E14', lat: 40.7282, lng: -73.9766, zone_type_id: 'POWER_SUBSTATION', category: 'Utility', data_source: 'real', w_deg: 0.002, h_deg: 0.002 },
    ]
  ),
  city('los_angeles', 'Los Angeles', 'United States', 34.05, -118.25, 12, 'Mediterranean', 3900000, 78000, 0.5,
    'Regional growth is constrained by mountains, fire risk, congestion, and housing scarcity.',
    'Mountains, wildfire corridors, coastal protection, freeway congestion',
    [-118.67, 33.7, -118.15, 34.34],
    [
      { name: 'Cedars-Sinai Medical Center', lat: 34.0762, lng: -118.3801, zone_type_id: 'HEALTH_HOSPITAL', category: 'Healthcare', data_source: 'real', w_deg: 0.007, h_deg: 0.004 },
      { name: 'UCLA Campus', lat: 34.0689, lng: -118.4452, zone_type_id: 'EDU_HIGH', category: 'Education', data_source: 'real', w_deg: 0.018, h_deg: 0.014 },
      { name: 'Union Station', lat: 34.0561, lng: -118.2364, zone_type_id: 'BUS_STATION', category: 'Transit', data_source: 'real', w_deg: 0.004, h_deg: 0.004 },
      // Griffith Park: -118.363 to -118.249, 34.083 to 34.170 (actual measured bounds)
      { name: 'Griffith Park', lat: 34.1265, lng: -118.3060, zone_type_id: 'PARK_SMALL', category: 'Parks & Green', data_source: 'real', w_deg: 0.114, h_deg: 0.087 },
      { name: 'Downtown LA Financial Core', lat: 34.0522, lng: -118.2437, zone_type_id: 'COM_OFFICE_PLAZA', category: 'Commercial', data_source: 'real', w_deg: 0.022, h_deg: 0.023 },
      // LAX: -118.429 to -118.360, 33.934 to 33.957 (actual measured bounds)
      { name: 'LAX International Airport', lat: 33.9455, lng: -118.3945, zone_type_id: 'BUS_STATION', category: 'Transit', data_source: 'real', w_deg: 0.069, h_deg: 0.023 },
      { name: 'Hollywood Entertainment District', lat: 34.0928, lng: -118.3287, zone_type_id: 'ENT_CINEMA', category: 'Culture & Sport', data_source: 'real', w_deg: 0.022, h_deg: 0.009 },
      { name: 'Port of Long Beach Industrial', lat: 33.7542, lng: -118.2165, zone_type_id: 'IND_WAREHOUSE', category: 'Industrial', data_source: 'real', w_deg: 0.087, h_deg: 0.036 },
      { name: 'Watts Affordable Housing Zone', lat: 33.9447, lng: -118.2359, zone_type_id: 'RES_AFFORDABLE', category: 'Residential', data_source: 'real', w_deg: 0.022, h_deg: 0.014 },
      { name: 'Santa Monica Green Corridor', lat: 34.0195, lng: -118.4912, zone_type_id: 'ENV_TREE_BELT', category: 'Parks & Green', data_source: 'real', w_deg: 0.033, h_deg: 0.003 },
    ]
  ),
  city('tokyo', 'Tokyo', 'Japan', 35.69, 139.70, 13, 'Humid subtropical', 14000000, 72000, 0.1,
    'Extreme transit demand, aging population, and limited flat land require precision infill.',
    'Bay edge, seismic risk, rail capacity, protected neighborhoods',
    [139.42, 35.48, 139.91, 35.9],
    [
      { name: 'Tokyo University Hospital', lat: 35.7142, lng: 139.7613, zone_type_id: 'HEALTH_HOSPITAL', category: 'Healthcare', data_source: 'real', w_deg: 0.004, h_deg: 0.004 },
      { name: 'University of Tokyo', lat: 35.7130, lng: 139.7624, zone_type_id: 'EDU_HIGH', category: 'Education', data_source: 'real', w_deg: 0.013, h_deg: 0.011 },
      { name: 'Shinjuku Station', lat: 35.6896, lng: 139.7006, zone_type_id: 'METRO_STATION', category: 'Transit', data_source: 'real', w_deg: 0.008, h_deg: 0.005 },
      // Ueno Park: ~640m wide × 1200m tall
      { name: 'Ueno Park', lat: 35.7146, lng: 139.7742, zone_type_id: 'PARK_SMALL', category: 'Parks & Green', data_source: 'real', w_deg: 0.007, h_deg: 0.011 },
      { name: 'Tokyo Station Business District', lat: 35.6812, lng: 139.7671, zone_type_id: 'COM_OFFICE_PLAZA', category: 'Commercial', data_source: 'real', w_deg: 0.006, h_deg: 0.003 },
      { name: 'Akihabara Tech & Commerce', lat: 35.7022, lng: 139.7741, zone_type_id: 'COM_SMALL_SHOP', category: 'Commercial', data_source: 'real', w_deg: 0.006, h_deg: 0.005 },
      { name: 'Shibuya Commercial Hub', lat: 35.6580, lng: 139.7016, zone_type_id: 'COM_SMALL_SHOP', category: 'Commercial', data_source: 'real', w_deg: 0.007, h_deg: 0.005 },
      // Haneda Airport: ~4km × 3km
      { name: 'Haneda Airport', lat: 35.5494, lng: 139.7798, zone_type_id: 'BUS_STATION', category: 'Transit', data_source: 'real', w_deg: 0.044, h_deg: 0.027 },
      { name: 'Odaiba Smart Waterfront', lat: 35.6267, lng: 139.7745, zone_type_id: 'SMART_TRAFFIC_LIGHT', category: 'Smart Infrastructure', data_source: 'real', w_deg: 0.022, h_deg: 0.008 },
      { name: 'Koto Ward Industrial Zone', lat: 35.6722, lng: 139.8175, zone_type_id: 'IND_WAREHOUSE', category: 'Industrial', data_source: 'real', w_deg: 0.028, h_deg: 0.014 },
    ]
  ),
  city('lagos', 'Lagos', 'Nigeria', 6.50, 3.39, 13, 'Tropical savanna', 15000000, 6200, 3.2,
    'Rapid population growth demands flood-safe housing, power, roads, and health access.',
    'Lagoon systems, wetlands, informal settlement pressure, coastal flood exposure',
    [3.1, 6.39, 3.69, 6.7],
    [
      { name: 'Lagos University Teaching Hospital', lat: 6.5158, lng: 3.3820, zone_type_id: 'HEALTH_HOSPITAL', category: 'Healthcare', data_source: 'real', w_deg: 0.005, h_deg: 0.004 },
      { name: 'University of Lagos', lat: 6.5158, lng: 3.4022, zone_type_id: 'EDU_HIGH', category: 'Education', data_source: 'real', w_deg: 0.011, h_deg: 0.011 },
      // Murtala Muhammed Airport: ~4km × 2.5km
      { name: 'Murtala Muhammed Airport', lat: 6.5774, lng: 3.3212, zone_type_id: 'BUS_STATION', category: 'Transit', data_source: 'real', w_deg: 0.036, h_deg: 0.023 },
      { name: 'Victoria Island Business District', lat: 6.4281, lng: 3.4219, zone_type_id: 'COM_OFFICE_PLAZA', category: 'Commercial', data_source: 'real', w_deg: 0.027, h_deg: 0.018 },
      { name: 'Apapa Port Industrial', lat: 6.4493, lng: 3.3636, zone_type_id: 'IND_WAREHOUSE', category: 'Industrial', data_source: 'real', w_deg: 0.027, h_deg: 0.018 },
      { name: 'Eko Atlantic Reclamation Zone', lat: 6.4082, lng: 3.4108, zone_type_id: 'WATER_COASTAL', category: 'Waterfront', data_source: 'real', w_deg: 0.018, h_deg: 0.014 },
      { name: 'Ikeja GRA Residential', lat: 6.6018, lng: 3.3515, zone_type_id: 'RES_LOW_DETACHED', category: 'Residential', data_source: 'real', w_deg: 0.022, h_deg: 0.018 },
      { name: 'Lagos BRT Terminal', lat: 6.4530, lng: 3.3894, zone_type_id: 'BUS_STATION', category: 'Transit', data_source: 'real', w_deg: 0.003, h_deg: 0.002 },
      { name: 'Makoko Flood-Risk Settlement', lat: 6.4969, lng: 3.3947, zone_type_id: 'RES_AFFORDABLE', category: 'Residential', data_source: 'real', w_deg: 0.006, h_deg: 0.005 },
    ]
  ),
  city('london', 'London', 'United Kingdom', 51.51, -0.11, 13, 'Temperate oceanic', 9300000, 79000, 0.8,
    'Growth must balance heritage conservation, green belt limits, and affordability.',
    'Green belt, heritage districts, Thames flood risk, rail capacity',
    [-0.51, 51.29, 0.33, 51.69],
    [
      { name: "St Thomas' Hospital", lat: 51.4988, lng: -0.1178, zone_type_id: 'HEALTH_HOSPITAL', category: 'Healthcare', data_source: 'real', w_deg: 0.006, h_deg: 0.003 },
      { name: "King's College London", lat: 51.5115, lng: -0.1160, zone_type_id: 'EDU_HIGH', category: 'Education', data_source: 'real', w_deg: 0.007, h_deg: 0.004 },
      { name: 'Waterloo Station', lat: 51.5036, lng: -0.1143, zone_type_id: 'TRAIN_STATION', category: 'Transit', data_source: 'real', w_deg: 0.009, h_deg: 0.004 },
      // Hyde Park: -0.1826 to -0.1468 wide, 51.5026 to 51.5167 tall (actual measured bounds)
      { name: 'Hyde Park', lat: 51.5097, lng: -0.1647, zone_type_id: 'PARK_SMALL', category: 'Parks & Green', data_source: 'real', w_deg: 0.0358, h_deg: 0.0141 },
      { name: 'Canary Wharf Financial District', lat: 51.5054, lng: -0.0235, zone_type_id: 'COM_OFFICE_PLAZA', category: 'Commercial', data_source: 'real', w_deg: 0.022, h_deg: 0.009 },
      // Heathrow: ~6km × 3km at lat 51.47°N (1°lon ≈ 69.5km)
      { name: 'Heathrow Airport', lat: 51.4700, lng: -0.4543, zone_type_id: 'BUS_STATION', category: 'Transit', data_source: 'real', w_deg: 0.087, h_deg: 0.027 },
      { name: 'Tower of London Heritage Zone', lat: 51.5081, lng: -0.0759, zone_type_id: 'LAND_MONUMENT', category: 'Landmark', data_source: 'real', w_deg: 0.005, h_deg: 0.002 },
      { name: 'Stratford Regeneration District', lat: 51.5415, lng: -0.0023, zone_type_id: 'RES_MED_APARTMENT', category: 'Residential', data_source: 'real', w_deg: 0.029, h_deg: 0.014 },
      { name: 'Lee Valley Green Corridor', lat: 51.6001, lng: -0.0190, zone_type_id: 'ENV_TREE_BELT', category: 'Parks & Green', data_source: 'real', w_deg: 0.014, h_deg: 0.036 },
      { name: 'Battersea Power Station (Mixed Use)', lat: 51.4827, lng: -0.1442, zone_type_id: 'COM_SMALL_SHOP', category: 'Commercial', data_source: 'real', w_deg: 0.007, h_deg: 0.003 },
    ]
  ),
  city('sao_paulo', 'Sao Paulo', 'Brazil', -23.56, -46.65, 13, 'Subtropical highland', 12300000, 18500, 0.9,
    'Dense growth must reconnect services, jobs, water systems, and affordable housing.',
    'Hillside settlement risk, watershed protection, severe traffic congestion',
    [-46.83, -23.77, -46.36, -23.36],
    [
      { name: 'Hospital das Clínicas (USP)', lat: -23.5561, lng: -46.6694, zone_type_id: 'HEALTH_HOSPITAL', category: 'Healthcare', data_source: 'real', w_deg: 0.007, h_deg: 0.005 },
      // USP campus: ~3.5km × 3.5km
      { name: 'Universidade de São Paulo', lat: -23.5613, lng: -46.7301, zone_type_id: 'EDU_HIGH', category: 'Education', data_source: 'real', w_deg: 0.034, h_deg: 0.032 },
      { name: 'Luz Train Station', lat: -23.5382, lng: -46.6396, zone_type_id: 'TRAIN_STATION', category: 'Transit', data_source: 'real', w_deg: 0.002, h_deg: 0.002 },
      // Ibirapuera Park: ~1.5km × 1.5km
      { name: 'Ibirapuera Park', lat: -23.5874, lng: -46.6576, zone_type_id: 'PARK_SMALL', category: 'Parks & Green', data_source: 'real', w_deg: 0.015, h_deg: 0.014 },
      // Paulista Ave: ~2.8km long × narrow commercial strip
      { name: 'Paulista Avenue Financial Core', lat: -23.5643, lng: -46.6543, zone_type_id: 'COM_OFFICE_PLAZA', category: 'Commercial', data_source: 'real', w_deg: 0.028, h_deg: 0.003 },
      // Guarulhos Airport: ~4.5km × 3km
      { name: 'Guarulhos International Airport', lat: -23.4356, lng: -46.4731, zone_type_id: 'BUS_STATION', category: 'Transit', data_source: 'real', w_deg: 0.044, h_deg: 0.027 },
      { name: 'Paraisópolis Favela (Affordable)', lat: -23.6073, lng: -46.7142, zone_type_id: 'RES_AFFORDABLE', category: 'Residential', data_source: 'real', w_deg: 0.010, h_deg: 0.009 },
      { name: 'ABC Industrial Corridor', lat: -23.6740, lng: -46.5639, zone_type_id: 'IND_WAREHOUSE', category: 'Industrial', data_source: 'real', w_deg: 0.039, h_deg: 0.018 },
      // Marginal Tietê: ~10km long expressway corridor
      { name: 'Marginal Tietê Expressway', lat: -23.5253, lng: -46.6726, zone_type_id: 'SMART_TRAFFIC_LIGHT', category: 'Smart Infrastructure', data_source: 'real', w_deg: 0.098, h_deg: 0.003 },
    ]
  ),
  city('singapore', 'Singapore', 'Singapore', 1.29, 103.85, 14, 'Tropical rainforest', 5900000, 72500, 1.0,
    'A land-constrained city-state must intensify while preserving resilience and quality of life.',
    'Coastline, land reclamation limits, water security, biodiversity corridors',
    [103.61, 1.22, 104.04, 1.47],
    [
      { name: 'Singapore General Hospital', lat: 1.2797, lng: 103.8360, zone_type_id: 'HEALTH_HOSPITAL', category: 'Healthcare', data_source: 'real', w_deg: 0.005, h_deg: 0.005 },
      // NUS campus: ~2km × 1.5km
      { name: 'National University of Singapore', lat: 1.2966, lng: 103.7764, zone_type_id: 'EDU_HIGH', category: 'Education', data_source: 'real', w_deg: 0.018, h_deg: 0.014 },
      { name: 'Raffles Place MRT', lat: 1.2840, lng: 103.8516, zone_type_id: 'METRO_STATION', category: 'Transit', data_source: 'real', w_deg: 0.002, h_deg: 0.002 },
      { name: 'Gardens by the Bay', lat: 1.2816, lng: 103.8636, zone_type_id: 'PARK_SMALL', category: 'Parks & Green', data_source: 'real', w_deg: 0.014, h_deg: 0.009 },
      { name: 'Marina Bay Financial Centre', lat: 1.2802, lng: 103.8545, zone_type_id: 'COM_OFFICE_PLAZA', category: 'Commercial', data_source: 'real', w_deg: 0.011, h_deg: 0.007 },
      // Changi Airport: ~7km × 5km (one of the world's largest airports)
      { name: 'Changi Airport', lat: 1.3592, lng: 103.9894, zone_type_id: 'BUS_STATION', category: 'Transit', data_source: 'real', w_deg: 0.063, h_deg: 0.045 },
      { name: 'Jurong Industrial Estate', lat: 1.3162, lng: 103.7062, zone_type_id: 'IND_WAREHOUSE', category: 'Industrial', data_source: 'real', w_deg: 0.045, h_deg: 0.036 },
      { name: 'Tengah Eco Smart Town', lat: 1.3733, lng: 103.7356, zone_type_id: 'SMART_TRAFFIC_LIGHT', category: 'Smart Infrastructure', data_source: 'projected', w_deg: 0.027, h_deg: 0.027 },
      { name: 'Bukit Timah Nature Reserve', lat: 1.3520, lng: 103.7767, zone_type_id: 'FOREST_RESERVE', category: 'Parks & Green', data_source: 'real', w_deg: 0.014, h_deg: 0.014 },
      { name: 'Pasir Ris HDB Town', lat: 1.3721, lng: 103.9490, zone_type_id: 'RES_MED_APARTMENT', category: 'Residential', data_source: 'real', w_deg: 0.027, h_deg: 0.023 },
    ]
  ),
  city('dubai', 'Dubai', 'United Arab Emirates', 25.20, 55.27, 12, 'Hot desert', 3500000, 43000, 2.1,
    'Desert expansion needs water, energy, shade, transit, and heat-resilient public space.',
    'Desert heat, coastal exposure, water demand, linear highway dependence',
    [55.03, 24.79, 55.57, 25.36],
    [
      { name: 'Dubai Hospital', lat: 25.2716, lng: 55.3128, zone_type_id: 'HEALTH_HOSPITAL', category: 'Healthcare', data_source: 'real', w_deg: 0.004, h_deg: 0.003 },
      { name: 'American University in Dubai', lat: 25.1338, lng: 55.2073, zone_type_id: 'EDU_HIGH', category: 'Education', data_source: 'real', w_deg: 0.005, h_deg: 0.005 },
      { name: 'Dubai Metro — Mall of Emirates', lat: 25.1175, lng: 55.2009, zone_type_id: 'METRO_STATION', category: 'Transit', data_source: 'real', w_deg: 0.002, h_deg: 0.002 },
      { name: 'Safa Park', lat: 25.1880, lng: 55.2387, zone_type_id: 'PARK_SMALL', category: 'Parks & Green', data_source: 'real', w_deg: 0.008, h_deg: 0.005 },
      // Downtown Dubai / Burj Khalifa area: ~1.5km × 1.5km
      { name: 'Burj Khalifa / Downtown Dubai', lat: 25.1972, lng: 55.2744, zone_type_id: 'COM_OFFICE_PLAZA', category: 'Commercial', data_source: 'real', w_deg: 0.015, h_deg: 0.014 },
      // Dubai International Airport: ~7km × 3km
      { name: 'Dubai International Airport', lat: 25.2532, lng: 55.3657, zone_type_id: 'BUS_STATION', category: 'Transit', data_source: 'real', w_deg: 0.070, h_deg: 0.027 },
      // Jebel Ali Port & Free Zone: ~10km × 4km
      { name: 'Jebel Ali Port & Free Zone', lat: 25.0069, lng: 55.0662, zone_type_id: 'IND_WAREHOUSE', category: 'Industrial', data_source: 'real', w_deg: 0.099, h_deg: 0.036 },
      { name: 'Dubai Marina Waterfront', lat: 25.0805, lng: 55.1373, zone_type_id: 'WATER_COASTAL', category: 'Waterfront', data_source: 'real', w_deg: 0.020, h_deg: 0.005 },
      { name: 'Al Quoz Solar Energy District', lat: 25.1485, lng: 55.2219, zone_type_id: 'SOLAR_FARM', category: 'Utility', data_source: 'estimated', w_deg: 0.015, h_deg: 0.014 },
      { name: 'Mohammed Bin Rashid Smart City', lat: 25.1916, lng: 55.3985, zone_type_id: 'SMART_TRAFFIC_LIGHT', category: 'Smart Infrastructure', data_source: 'real', w_deg: 0.050, h_deg: 0.045 },
    ]
  ),
  city('mumbai', 'Mumbai', 'India', 19.07, 72.87, 13, 'Tropical wet and dry', 12500000, 11500, 1.2,
    'A narrow peninsula needs flood-safe densification, transit capacity, and equitable services.',
    'Coastline, mangroves, monsoon flooding, land scarcity',
    [72.75, 18.89, 73.02, 19.28],
    [
      { name: 'KEM Hospital', lat: 19.0010, lng: 72.8414, zone_type_id: 'HEALTH_HOSPITAL', category: 'Healthcare', data_source: 'real', w_deg: 0.005, h_deg: 0.003 },
      // IIT Bombay campus: ~1.5km × 1.5km
      { name: 'IIT Bombay', lat: 19.1334, lng: 72.9133, zone_type_id: 'EDU_HIGH', category: 'Education', data_source: 'real', w_deg: 0.014, h_deg: 0.014 },
      { name: 'Chhatrapati Shivaji Terminus', lat: 18.9402, lng: 72.8356, zone_type_id: 'TRAIN_STATION', category: 'Transit', data_source: 'real', w_deg: 0.002, h_deg: 0.002 },
      // Sanjay Gandhi NP: ~12km × 14km (bounds: 72.855-72.975 × 19.125-19.285)
      { name: 'Sanjay Gandhi National Park', lat: 19.2050, lng: 72.9150, zone_type_id: 'FOREST_RESERVE', category: 'Parks & Green', data_source: 'real', w_deg: 0.119, h_deg: 0.160 },
      { name: 'Bandra Kurla Complex (BKC)', lat: 19.0683, lng: 72.8683, zone_type_id: 'COM_OFFICE_PLAZA', category: 'Commercial', data_source: 'real', w_deg: 0.014, h_deg: 0.009 },
      // CSI Airport: ~3.5km × 2km
      { name: 'Chhatrapati Shivaji Airport', lat: 19.0896, lng: 72.8656, zone_type_id: 'BUS_STATION', category: 'Transit', data_source: 'real', w_deg: 0.033, h_deg: 0.018 },
      { name: 'Dharavi Redevelopment Zone', lat: 19.0404, lng: 72.8530, zone_type_id: 'RES_AFFORDABLE', category: 'Residential', data_source: 'real', w_deg: 0.019, h_deg: 0.014 },
      // JNPT: ~5km × 3km
      { name: 'JNPT Industrial Port', lat: 18.9480, lng: 72.9502, zone_type_id: 'IND_WAREHOUSE', category: 'Industrial', data_source: 'real', w_deg: 0.048, h_deg: 0.027 },
      { name: 'Mangrove Coastal Buffer Zone', lat: 19.1720, lng: 72.9600, zone_type_id: 'ENV_TREE_BELT', category: 'Parks & Green', data_source: 'real', w_deg: 0.019, h_deg: 0.027 },
      { name: 'Versova Koliwada Waterfront', lat: 19.1347, lng: 72.8119, zone_type_id: 'WATER_COASTAL', category: 'Waterfront', data_source: 'real', w_deg: 0.007, h_deg: 0.004 },
    ]
  ),
]

function city(
  id: string,
  name: string,
  country: string,
  center_lat: number,
  center_lng: number,
  default_zoom: number,
  climate_zone: string,
  population_current: number,
  gdp_per_capita: number,
  urban_growth_rate: number,
  key_planning_challenge: string,
  expansion_constraint: string,
  bbox: [number, number, number, number],
  landmarks: import('@/types/city.types').Landmark[] = []
): CityProfile {
  return {
    id,
    name,
    country,
    center_lat,
    center_lng,
    default_zoom,
    climate_zone,
    population_current,
    gdp_per_capita,
    urban_growth_rate,
    key_planning_challenge,
    expansion_constraint,
    bbox,
    landmarks,
    historical_snapshots: [
      { year: 1950, population: Math.round(population_current * 0.48), area_km2: 420, key_event: 'Post-war urban expansion begins shaping the modern footprint' },
      { year: 1980, population: Math.round(population_current * 0.7), area_km2: 610, key_event: 'Suburbanization and major transport corridors accelerate growth' },
      { year: 2010, population: Math.round(population_current * 0.92), area_km2: 760, key_event: 'Climate, housing, and mobility planning become central priorities' },
      { year: 2024, population: population_current, area_km2: 800, key_event: 'Current planning baseline for UrbanMind simulation' },
    ],
  }
}
