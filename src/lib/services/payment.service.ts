import { PrismaClient, Rent, Product } from '@prisma/client';

const prisma = new PrismaClient();

interface FinancialStats {
  totalRevenue: number;
  totalCommission: number;
  totalWithoutCommission: number;
  rents: (Rent & { product: Product })[];
}

export async function getFinancialStats(
  startDate: Date,
  endDate: Date
): Promise<FinancialStats> {
  const rents = await prisma.rent.findMany({
    where: {
      AND: [
        {
          arrivingDate: {
            gte: startDate,
          },
        },
        {
          leavingDate: {
            lte: endDate,
          },
        },
        {
          payment: 'CLIENT_PAID',
        },
      ],
    },
    include: {
      product: true,
    },
  });

  const initialStats: FinancialStats = {
    totalRevenue: 0,
    totalCommission: 0,
    totalWithoutCommission: 0,
    rents: [],
  };

  const stats = rents.reduce<FinancialStats>(
    (acc, rent) => {
      const price = Number(rent.prices);
      const commission = (price * rent.product.commission) / 100;
      
      return {
        totalRevenue: acc.totalRevenue + price,
        totalCommission: acc.totalCommission + commission,
        totalWithoutCommission: acc.totalWithoutCommission + (price - commission),
        rents: [...acc.rents, rent],
      };
    },
    initialStats
  );

  return stats;
}
