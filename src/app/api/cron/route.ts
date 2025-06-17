'use server'
import {NextResponse} from "next/server";
import {prisma} from "@/lib/prisma";
import {sendTemplatedMail} from "@/lib/services/sendTemplatedMail";

export async function GET() {
    try {
        const tomorrow = new Date();
        tomorrow.setUTCHours(0, 0, 0, 0);
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);

        const dayAfterTomorrow = new Date(tomorrow);
        dayAfterTomorrow.setUTCDate(dayAfterTomorrow.getUTCDate() + 1);

        const rent = await prisma.rent.findMany({
            where: {
                arrivingDate: {
                    gte: tomorrow,
                    lt: dayAfterTomorrow
                },
                accepted: true,
            },
            include: {
              product: {
                  include: {
                      user: {
                          select: {
                              email: true,
                          }
                      }
                  }
              },
              user: {
                  select: {
                      email: true,
                  }
              }
            }
        });
        console.log('Résultats trouvés:', rent);

        rent.forEach((unique => {
            if (unique.product.user) {
                unique.product.user.forEach((async host => {
                    await sendTemplatedMail(
                        host.email,
                        'Rappel de réservation !',
                        'cron-reminder-host.html',
                        {
                            bookId: createdRent.id,
                            establishmentName: unique.product.name,
                            establishmentAddress: unique.product.address,
                            checkInDate: unique.arrivingDate.toDateString(),
                            checkInTime: unique.product.arriving,
                            checkOutDate: unique.leavingDate.toDateString(),
                            checkOutTime: unique.product.leaving,
                            establishmentPhone: unique.product.phone,
                            name: user.name || '',
                            bookUrl: (process.env.NEXTAUTH_URL + '/reservation/' + createdRent.id),
                        }
                    );
                }))
            }
        }))

        rent.forEach((unique => {
            if (unique.product.user) {
                unique.product.user.forEach((async host => {
                    await sendTemplatedMail(
                        host.email,
                        'Rappel de réservation !',
                        'cron-reminder-client.html',
                        {
                            bookId: createdRent.id,
                            name: user.name || '',
                            bookUrl: (process.env.NEXTAUTH_URL + '/reservation/' + createdRent.id),
                        }
                    );
                }))
            }
        }))
        return NextResponse.json('200');

    } catch (error) {
        console.error('Error fetching upcoming rents:', error);
        return NextResponse.json(
            { error: 'Failed to fetch upcoming rents' },
            { status: 500 }
        );
    }
}
