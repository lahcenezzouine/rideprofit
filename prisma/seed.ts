import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const existingSettings = await prisma.vehicleSettings.findFirst();
  if (!existingSettings) {
    await prisma.vehicleSettings.create({
      data: {
        vehicleName: "Seat Leon FR 2025",
        fuelType: "Diesel",
        currency: "MAD",
        fuelPricePerLiter: 16,
        avgConsumptionPer100: 6.2,
        maintenancePerKm: 0.3,
        maintenanceEnabled: true,
        tireCostPerKm: 0.15,
        tireEnabled: true,
        oilServicePerKm: 0.2,
        oilServiceEnabled: true,
        depreciationPerKm: 0.5,
        depreciationEnabled: true,
        otherCostPerKm: 0.1,
        otherEnabled: true,
        tollEnabled: true,
        desiredProfitAmount: 200,
        desiredProfitMargin: 20,
        profitMode: "fixed",
        defaultReturnType: "NONE",
        defaultTollEnabled: true,
      },
    });
    console.log("Created default VehicleSettings (Seat Leon FR 2025).");
  } else {
    console.log("VehicleSettings already present — skipping.");
  }

  await prisma.fuelPriceHistory.upsert({
    where: { id: 1 },
    update: {},
    create: {
      fuelType: "Diesel",
      pricePerLiter: 16,
      station: null,
      city: null,
    },
  });

  const routeCount = await prisma.route.count();
  if (routeCount === 0) {
    await prisma.route.createMany({
      data: [
        { origin: "Casablanca", destination: "Rabat", typicalDistanceKm: 90, outboundToll: 20, returnToll: 20, notes: "A3 highway" },
        { origin: "Casablanca", destination: "Kenitra", typicalDistanceKm: 120, outboundToll: 30, returnToll: 30, notes: null },
        { origin: "Casablanca", destination: "Tangier", typicalDistanceKm: 350, outboundToll: 110, returnToll: 110, notes: "Long highway run" },
        { origin: "Casablanca", destination: "Marrakech", typicalDistanceKm: 240, outboundToll: 70, returnToll: 70, notes: null },
        { origin: "Casablanca", destination: "Essaouira", typicalDistanceKm: 370, outboundToll: 75, returnToll: 75, notes: "No direct highway for full stretch" },
        { origin: "Casablanca", destination: "Agadir", typicalDistanceKm: 460, outboundToll: 140, returnToll: 140, notes: null },
        { origin: "Casablanca", destination: "El Jadida", typicalDistanceKm: 95, outboundToll: 15, returnToll: 15, notes: null },
        { origin: "Casablanca", destination: "Settat", typicalDistanceKm: 70, outboundToll: 15, returnToll: 15, notes: null },
      ],
    });
    console.log("Seeded 8 default routes.");
  } else {
    console.log("Routes already present — skipping.");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
