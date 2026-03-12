import dataSource from '../config/data-source';
import { Branch } from '../typeorm/entities/branch.entity';
import { VehicleType } from '../typeorm/entities/vehicle-type.entity';
import { CargoType } from '../typeorm/entities/cargo-type.entity';

async function seed() {
  await dataSource.initialize();
  console.log('Database connected. Starting seeding...');

  const branchRepo = dataSource.getRepository(Branch);
  const vehicleTypeRepo = dataSource.getRepository(VehicleType);
  const cargoTypeRepo = dataSource.getRepository(CargoType);

  // Seed Branches
  const existingBranches = await branchRepo.count();
  if (existingBranches === 0) {
    console.log('Seeding Branches...');
    await branchRepo.save([
      { branchId: 1, branchCode: 'GT-C', branchName: 'Sede Central', city: 'Guatemala', country: 'Guatemala', isActive: true },
      { branchId: 2, branchCode: 'GT-X', branchName: 'Sede Xela', city: 'Quetzaltenango', country: 'Guatemala', isActive: true },
    ]);
  }

  // Seed Vehicle Types
  const existingVehicles = await vehicleTypeRepo.count();
  if (existingVehicles === 0) {
    console.log('Seeding Vehicle Types...');
    await vehicleTypeRepo.save([
      { vehicleTypeId: 1, typeCode: 'PANEL', typeName: 'Panel Cerrada', minCapacityTon: 0.5, maxCapacityTon: 1.5, ratePerKm: 5.50 },
      { vehicleTypeId: 2, typeCode: 'CAMION-P', typeName: 'Camión Pequeño', minCapacityTon: 2.0, maxCapacityTon: 5.0, ratePerKm: 8.50 },
      { vehicleTypeId: 3, typeCode: 'CABEZAL', typeName: 'Cabezal Articulado', minCapacityTon: 10.0, maxCapacityTon: 30.0, ratePerKm: 15.00 },
    ]);
  }

  // Seed Cargo Types
  const existingCargo = await cargoTypeRepo.count();
  if (existingCargo === 0) {
    console.log('Seeding Cargo Types...');
    await cargoTypeRepo.save([
      { cargoTypeId: 1, cargoName: 'Carga General Seca', requiresRefrigeration: false },
      { cargoTypeId: 2, cargoName: 'Perecederos / Frigoríficos', requiresRefrigeration: true },
      { cargoTypeId: 3, cargoName: 'Material Peligroso', requiresRefrigeration: false },
    ]);
  }

  console.log('Seeding completed.');
  await dataSource.destroy();
}

seed().catch((err) => {
  console.error('Error during seeding:', err);
  process.exit(1);
});
