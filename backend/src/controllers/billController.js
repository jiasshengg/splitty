const billModel = require('../models/billModel');
const responseView = require('../views/responseView');
const {
  buildBillPersistencePayload,
  serializeBillRecord,
  toNumber,
} = require('../helpers/billHelper');

function hasBlankString(value) {
  return !value || (typeof value === 'string' && value.trim() === '');
}

function getSessionUserId(req) {
  const userId = Number(req.session?.user?.id);

  if (!Number.isInteger(userId) || userId <= 0) {
    return null;
  }

  return userId;
}

module.exports.createBill = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const { billName, members, receipts, summary } = req.body;

    if (!userId) {
      return responseView.Unauthorized(res, 'Please register or login');
    }

    if (hasBlankString(billName)) {
      return responseView.BadRequest(res, 'BillName cannot be empty');
    }

    if (!Array.isArray(members) || members.length === 0) {
      return responseView.BadRequest(res, 'At least one person is required');
    }

    if (!Array.isArray(receipts) || receipts.length === 0) {
      return responseView.BadRequest(res, 'At least one receipt is required');
    }

    const payload = buildBillPersistencePayload({
      members,
      receipts,
      summary,
    });

    const visibleItemCount = payload.items.filter((item) => !String(item.name).startsWith('__adj_')).length;

    if (visibleItemCount === 0) {
      return responseView.BadRequest(res, 'At least one item is required');
    }

    const createdBill = await billModel.createBill(userId, {
      billName: String(billName).trim(),
      totalAmount: toNumber(summary?.total),
      members: payload.members,
      receipts: payload.receipts,
    });

    return responseView.confirmCreated(
      res,
      serializeBillRecord(createdBill),
      'Bill saved successfully',
    );
  } catch (error) {
    return responseView.sendError(res, 'Failed to save bill', error);
  }
};

module.exports.getBillsByUser = async (req, res) => {
  try {
    const userId = getSessionUserId(req);

    if (!userId) {
      return responseView.Unauthorized(res, 'Please register or login');
    }

    const bills = await billModel.getBillsByUserId(userId);

    return responseView.sendSuccess(
      res,
      bills.map(serializeBillRecord),
      'Fetched bills',
    );
  } catch (error) {
    return responseView.sendError(res, 'Failed to fetch bills', error);
  }
};

module.exports.getBillById = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const billId = Number(req.params.id);

    if (!userId) {
      return responseView.Unauthorized(res, 'Please register or login');
    }

    if (!Number.isInteger(billId) || billId <= 0) {
      return responseView.BadRequest(res, 'Invalid bill id');
    }

    const bill = await billModel.getBillById(billId, userId);

    if (!bill) {
      return responseView.NotFound(res, 'Bill not found');
    }

    return responseView.sendSuccess(res, serializeBillRecord(bill), 'Fetched bill');
  } catch (error) {
    return responseView.sendError(res, 'Failed to fetch bill', error);
  }
};

module.exports.deleteBill = async (req, res) => {
  try {
    const userId = getSessionUserId(req);
    const billId = Number(req.params.id);

    if (!userId) {
      return responseView.Unauthorized(res, 'Please register or login');
    }

    if (!Number.isInteger(billId) || billId <= 0) {
      return responseView.BadRequest(res, 'Invalid bill id');
    }

    const deletedBill = await billModel.deleteBill(billId, userId);

    if (!deletedBill) {
      return responseView.NotFound(res, 'Bill not found');
    }

    return responseView.noContent(res, null, 'Bill deleted successfully');
  } catch (error) {
    return responseView.sendError(res, 'Failed to delete bill', error);
  }
};
