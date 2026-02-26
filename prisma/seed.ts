import 'dotenv/config';
import { PrismaClient, Role } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@treiden.pro';
  const adminPassword = process.env.ADMIN_PASSWORD || 'Admin123!';
  const adminName = process.env.ADMIN_NAME || 'Treiden Admin';

  if (adminPassword.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters long');
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      displayName: adminName,
      role: Role.ADMIN,
      isActive: true,
    },
    update: {
      passwordHash,
      displayName: adminName,
      role: Role.ADMIN,
      isActive: true,
    },
  });

  await prisma.userRating.upsert({
    where: { userId: admin.id },
    create: { userId: admin.id, points: 0, level: 1 },
    update: {},
  });

  console.log(`Admin seeded: ${admin.email} (${admin.id})`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
