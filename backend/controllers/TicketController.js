import TicketService from '../service/TicketService.js';

const ticketService = new TicketService();

export const createTicket = async (req, res) => {
  try {
    //console.log('📩 Request Body createTicket:', req.body);
    //console.log('📎 Uploaded Files:', req.files);

    // const attachments = req.files?.attachments?.map(file => file.path) || [];
    const attachments = req.files?.map(file => file.path) || [];

    

    const ticketData = {
      ...req.body,
      userId: req.user._id,
      attachments,
      messages: [
        {
          sender: req.user._id,
          message: req.body.description,
        },
      ]
    };

    const ticket = await ticketService.create(ticketData);

    return res.status(201).json({
      success: true,
      message: '✅ Support ticket created successfully',
      data: { ticket },
      err: {},
    });
  } catch (err) {
    console.error('❌ Create Ticket Error:', err);
    const isBadRequest = ['required', 'Invalid', 'enum'].some(msg => err.message.includes(msg));
    return res.status(isBadRequest ? 400 : 500).json({
      success: false,
      message: err.message,
      data: {},
      err: { message: err.message },
    });
  }
};


export const getTicketById = async (req, res) => {
  try {
    //console.log('📩 Request Params getTicketById:', req.params);

    const { id } = req.params;
    const userId = req.user._id;
    const isUserAdmin = req.user.role === 'admin';

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID is required',
        data: {},
        err: { message: 'Missing ticket ID parameter' },
      });
    }

    const ticket = await ticketService.getById(id, userId, isUserAdmin);

    return res.status(200).json({
      success: true,
      message: '✅ Ticket retrieved successfully',
      data: { ticket },
      err: {},
    });
  } catch (err) {
    console.error('❌ Get Ticket By ID Error:', err);
    if (err.message === 'Ticket not found') {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        data: {},
        err: { message: err.message },
      });
    }
    if (err.message.includes('Access denied')) {
      return res.status(403).json({
        success: false,
        message: err.message,
        data: {},
        err: { message: err.message },
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message,
      data: {},
      err: err.message,
    });
  }
};

export const getAllTickets = async (req, res) => {
  try {
    const { result: tickets, total, page, limit, totalPages } = await ticketService.getAll(req.query);
    return res.status(200).json({
      success: true,
      message: '✅ Tickets retrieved successfully',
      data: { tickets, total, page, limit, totalPages },
      err: {},
    });
  } catch (err) {
    console.error('❌ Get All Tickets Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message,
      data: {},
      err: err.message,
    });
  }
};

export const getMyTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const queryWithUserId = { ...req.query, userId: userId.toString() };
    
    const { result: tickets, total, page, limit, totalPages } = await ticketService.getUserTickets(queryWithUserId);
    return res.status(200).json({
      success: true,
      message: '✅ Your tickets retrieved successfully',
      data: { tickets, total, page, limit, totalPages },
      err: {},
    });
  } catch (err) {
    console.error('❌ Get My Tickets Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message,
      data: {},
      err: err.message,
    });
  }
};

export const updateTicket = async (req, res) => {
  try {
    //console.log('📩 Request Body updateTicket:', req.body);

    const { id } = req.params;
    const userId = req.user._id;
    const isUserAdmin = req.user.role === 'admin';

   
    //console.log('📩 Request User updateTicket:', req.user)
    //console.log('📎 Uploaded Files:', req.files
    // );
    //console.log('📩 Request Params updateTicket:', isUserAdmin);
    


    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID is required',
        data: {},
        err: { message: 'Missing ticket ID parameter' },
      });
    }

    const updatedTicket = await ticketService.updateById(id, req.body, userId, isUserAdmin);

    return res.status(200).json({
      success: true,
      message: '✅ Ticket updated successfully',
      data: { ticket: updatedTicket },
      err: {},
    });
  } catch (err) {
    console.error('❌ Update Ticket Error:', err);
    if (
      err.message === 'Ticket not found' ||
      err.message === 'No valid fields to update' ||
      err.message.includes('Access denied') ||
      err.message.includes('Invalid') ||
      err.message.includes('enum')
    ) {
      return res.status(400).json({
        success: false,
        message: err.message,
        data: {},
        err: { message: err.message },
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message,
      data: {},
      err: err.message,
    });
  }
};

export const updateTicketStatus = async (req, res) => {
  try {
    //console.log('📩 Request Body updateTicketStatus:', req.body);

    const { id } = req.params;
    const { status } = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID is required',
        data: {},
        err: { message: 'Missing ticket ID parameter' },
      });
    }

    if (!status) {
      return res.status(400).json({
        success: false,
        message: 'Status is required',
        data: {},
        err: { message: 'Missing status parameter' },
      });
    }

    const updatedTicket = await ticketService.updateStatus(id, status);

    //console.log('🗑️ Ticket cache cleared for status update:', id);

    return res.status(200).json({
      success: true,
      message: '✅ Ticket status updated successfully',
      data: { ticket: updatedTicket },
      err: {},
    });
  } catch (err) {
    console.error('❌ Update Ticket Status Error:', err);
    if (
      err.message === 'Ticket not found' ||
      err.message.includes('Invalid') ||
      err.message.includes('enum')
    ) {
      return res.status(400).json({
        success: false,
        message: err.message,
        data: {},
        err: { message: err.message },
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message,
      data: {},
      err: err.message,
    });
  }
};

export const addMessage = async (req, res) => {
  try {
    //console.log('📩 Request Body addMessage:', req.body);
    //console.log('📎 Uploaded Files:', req.files);

    const { id } = req.params;
    const { message } = req.body;
    const attachments = req.files?.map(file => file.path) || [];
    
    const userId = req.user._id;
    const isUserAdmin = req.user.role === 'admin';

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID is required',
        data: {},
        err: { message: 'Missing ticket ID parameter' },
      });
    }

    let messageData = {};

if(message && message != ''){ 
    messageData = {
      message,
      attachments
    };
  } else {
    messageData = {
      attachments
    };
  }

    const updatedTicket = await ticketService.addMessage(id, messageData, userId, isUserAdmin);

    //console.log('🗑️ Ticket cache cleared for message addition:', id);

    return res.status(200).json({
      success: true,
      message: '✅ Message added successfully',
      data: { ticket: updatedTicket },
      err: {},
    });
  } catch (err) {
    console.error('❌ Add Message Error:', err);
    if (
      err.message === 'Ticket not found' ||
      err.message.includes('Access denied') ||
      err.message.includes('required')
    ) {
      return res.status(400).json({
        success: false,
        message: err.message,
        data: {},
        err: { message: err.message },
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message,
      data: {},
      err: err.message,
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id, messageId } = req.params;
    const userId = req.user._id;
    const isUserAdmin = req.user.role === 'admin';

    if (!id || !messageId) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID and message ID are required',
        data: {},
        err: { message: 'Missing ticket ID or message ID parameter' },
      });
    }

    const updatedTicket = await ticketService.deleteMessage(
      id,
      messageId,
      userId,
      isUserAdmin
    );


    return res.status(200).json({
      success: true,
      message: '✅ Message deleted successfully',
      data: { ticket: updatedTicket },
      err: {},
    });
  } catch (err) {
    console.error('❌ Delete Message Error:', err);
    if (
      err.message === 'Ticket not found' ||
      err.message === 'Message not found' ||
      err.message.includes('Access denied')
    ) {
      return res.status(400).json({
        success: false,
        message: err.message,
        data: {},
        err: { message: err.message },
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message,
      data: {},
      err: err.message,
    });
  }
};

export const deleteTicket = async (req, res) => {
  try {
    //console.log('📩 Request Params deleteTicket:', req.params);

    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Ticket ID is required',
        data: {},
        err: { message: 'Missing ticket ID parameter' },
      });
    }

    const deletedTicket = await ticketService.softDeleteById(id);

    //console.log('🗑️ Ticket cache cleared:', id);

    return res.status(200).json({
      success: true,
      message: '✅ Ticket deleted successfully',
      data: { ticket: deletedTicket },
      err: {},
    });
  } catch (err) {
    console.error('❌ Delete Ticket Error:', err);
    if (err.message === 'Ticket not found') {
      return res.status(404).json({
        success: false,
        message: 'Ticket not found',
        data: {},
        err: { message: err.message },
      });
    }
    return res.status(500).json({
      success: false,
      message: err.message,
      data: {},
      err: err.message,
    });
  }
};

export const getMyResolvedTickets = async (req, res) => {
  try {
    const userId = req.user._id;
    const queryWithUserId = { ...req.query, userId: userId.toString() };
    
    const { result: tickets, total, page, limit, totalPages } = await ticketService.getUserResolvedTickets(queryWithUserId);
    
    return res.status(200).json({
      success: true,
      message: '✅ Your resolved tickets retrieved successfully',
      data: { tickets, total, page, limit, totalPages },
      err: {},
    });
  } catch (err) {
    console.error('❌ Get My Resolved Tickets Error:', err);
    return res.status(500).json({
      success: false,
      message: err.message,
      data: {},
      err: err.message,
    });
  }
};