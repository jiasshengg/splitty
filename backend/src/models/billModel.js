const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports.createBill = async function createBill(userId, billData) {
  const {
    billName,
    totalAmount,
    members,
    receipts,
  } = billData;

  return prisma.$transaction(async function (tx) {
    const createdBill = await tx.bills.create({
      data: {
        user_id: userId,
        bill_name: billName,
        total_amt: totalAmount,
      },
    });

    const participantIdMap = new Map();

    for (const member of members) {
      const participant = await tx.bill_participants.create({
        data: {
          bill_id: createdBill.id,
          name: member.name,
        },
      });

      participantIdMap.set(member.clientId, participant.id);
    }

    for (const receipt of receipts) {
      const createdReceipt = await tx.bill_receipts.create({
        data: {
          bill_id: createdBill.id,
          receipt_name: receipt.label,
          gst_rate: receipt.gstRate,
          service_charge: receipt.serviceChargeAmount,
          discount_type: receipt.discountType,
          discount_value: receipt.discountValue,
        },
      });

      for (const item of receipt.items) {
        const createdItem = await tx.bill_items.create({
          data: {
            receipt_id: createdReceipt.id,
            item_name: item.name,
            price: item.price,
          },
        });

        const assignmentRows = item.assignedTo
          .map((memberClientId) => participantIdMap.get(String(memberClientId)))
          .filter(Boolean)
          .map((participantId) => ({
            item_id: createdItem.id,
            participant_id: participantId,
          }));

        if (assignmentRows.length > 0) {
          await tx.bill_item_assignments.createMany({
            data: assignmentRows,
            skipDuplicates: true,
          });
        }
      }
    }

    return tx.bills.findUnique({
      where: { id: createdBill.id },
      include: {
        bill_receipts: {
          include: {
            bill_items: {
              include: {
                bill_item_assignments: true,
              },
              orderBy: {
                id: 'asc',
              },
            },
          },
          orderBy: {
            id: 'asc',
          },
        },
        bill_participants: {
          orderBy: {
            id: 'asc',
          },
        },
      },
    });
  });
};

module.exports.getBillsByUserId = async function getBillsByUserId(userId) {
  return prisma.bills.findMany({
    where: { user_id: userId },
    include: {
      bill_receipts: {
        include: {
          bill_items: {
            include: {
              bill_item_assignments: true,
            },
            orderBy: {
              id: 'asc',
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      },
      bill_participants: {
        orderBy: {
          id: 'asc',
        },
      },
    },
    orderBy: {
      created_at: 'desc',
    },
  });
};

module.exports.getBillById = async function getBillById(id, userId) {
  return prisma.bills.findFirst({
    where: {
      id,
      user_id: userId,
    },
    include: {
      bill_receipts: {
        include: {
          bill_items: {
            include: {
              bill_item_assignments: true,
            },
            orderBy: {
              id: 'asc',
            },
          },
        },
        orderBy: {
          id: 'asc',
        },
      },
      bill_participants: {
        orderBy: {
          id: 'asc',
        },
      },
    },
  });
};

module.exports.deleteBill = async function deleteBill(id, userId) {
  const bill = await prisma.bills.findFirst({
    where: {
      id,
      user_id: userId,
    },
    select: {
      id: true,
    },
  });

  if (!bill) {
    return null;
  }

  return prisma.bills.delete({
    where: { id: bill.id },
  });
};
