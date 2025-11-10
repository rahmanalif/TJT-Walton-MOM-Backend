const Event = require('../models/Event.model');
const Parent = require('../models/Parent.model');

// @desc    Create new event
// @route   POST /api/events
// @access  Private
exports.createEvent = async (req, res) => {
  try {
    const {
      title,
      description,
      location,
      allDayEvent,
      startDate,
      startTime,
      endDate,
      endTime,
      visibility,
      assignedTo,
      assignedToAll
    } = req.body;

    // Prepare event data
    const eventData = {
      title,
      description,
      location,
      allDayEvent: allDayEvent || false,
      startDate,
      startTime,
      endDate,
      endTime,
      visibility: visibility || 'shared',
      createdBy: req.parent.id,
      assignedToAll: assignedToAll || false
    };

    // Handle assigned family members
    if (assignedTo && Array.isArray(assignedTo)) {
      // Validate that assigned members exist and belong to the same linked family
      const current = await Parent.findById(req.parent._id).select('familyMembers');
      const allowedParentIds = [current._id, ...(current.familyMembers || [])].map(id => id.toString());

      // Ensure every assignedTo id is within allowedParentIds
      const invalid = assignedTo.some(id => !allowedParentIds.includes(id.toString()));
      if (invalid) {
        return res.status(400).json({
          success: false,
          message: 'Some assigned family members do not exist or do not belong to your family'
        });
      }

      eventData.assignedTo = assignedTo;
    } else {
      eventData.assignedTo = [];
    }

    // If assignedToAll is true, get all family members
    if (assignedToAll) {
      // assignedToAll should include current parent + merged family members
      const current = await Parent.findById(req.parent._id).select('familyMembers');
      const allIds = [current._id, ...(current.familyMembers || [])];
      eventData.assignedTo = allIds.map(id => id._id ? id._id : id);
    }

    const event = await Event.create(eventData);

    // Populate creator and assigned members
    await event.populate('createdBy', 'firstname lastname email avatar');
    await event.populate('assignedTo', 'firstname lastname email avatar');

    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        errors: messages
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get all events for current user
// @route   GET /api/events
// @access  Private
exports.getAllEvents = async (req, res) => {
  try {
    // Get events created by user OR assigned to user
    const events = await Event.find({
      $or: [
        { createdBy: req.parent.id },
        { assignedTo: req.parent.id }
      ]
    })
      .populate('createdBy', 'firstname lastname email avatar')
      .populate('assignedTo', 'firstname lastname email avatar')
      .sort({ startDate: 1, startTime: 1 }); // Sort by date and time ascending

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get events by date range
// @route   GET /api/events/range?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD
// @access  Private
exports.getEventsByDateRange = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both startDate and endDate parameters'
      });
    }

    const events = await Event.find({
      $or: [
        { createdBy: req.parent.id },
        { assignedTo: req.parent.id }
      ],
      startDate: {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    })
      .populate('createdBy', 'firstname lastname email avatar')
      .populate('assignedTo', 'firstname lastname email avatar')
      .sort({ startDate: 1, startTime: 1 });

    res.status(200).json({
      success: true,
      count: events.length,
      data: events
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get single event by ID
// @route   GET /api/events/:id
// @access  Private
exports.getEventById = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id)
      .populate('createdBy', 'firstname lastname email avatar')
      .populate('assignedTo', 'firstname lastname email avatar');

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user has access to this event (creator or assigned member)
    const isCreator = event.createdBy._id.toString() === req.parent.id;
    const isAssigned = event.assignedTo.some(
      member => member._id.toString() === req.parent.id
    );

    if (!isCreator && !isAssigned) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to access this event'
      });
    }

    // Filter event details based on visibility
    let eventData = event.toObject();

    // If not the creator and visibility is 'busy', hide details
    if (!isCreator && event.visibility === 'busy') {
      eventData = {
        _id: event._id,
        title: 'Busy',
        startDate: event.startDate,
        endDate: event.endDate,
        startTime: event.startTime,
        endTime: event.endTime,
        allDayEvent: event.allDayEvent,
        visibility: 'busy',
        createdBy: {
          firstname: event.createdBy.firstname,
          lastname: event.createdBy.lastname
        }
      };
    }

    // If not the creator and visibility is 'private', deny access
    if (!isCreator && event.visibility === 'private') {
      return res.status(403).json({
        success: false,
        message: 'This event is private'
      });
    }

    res.status(200).json({
      success: true,
      data: eventData
    });
  } catch (error) {
    // Handle invalid MongoDB ID
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/:id
// @access  Private
exports.updateEvent = async (req, res) => {
  try {
    let event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the creator
    if (event.createdBy.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to update this event'
      });
    }

    const {
      title,
      description,
      location,
      allDayEvent,
      startDate,
      startTime,
      endDate,
      endTime,
      visibility,
      assignedTo,
      assignedToAll
    } = req.body;

    // Prepare update data
    const updateData = {};

    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (location !== undefined) updateData.location = location;
    if (allDayEvent !== undefined) updateData.allDayEvent = allDayEvent;
    if (startDate !== undefined) updateData.startDate = startDate;
    if (startTime !== undefined) updateData.startTime = startTime;
    if (endDate !== undefined) updateData.endDate = endDate;
    if (endTime !== undefined) updateData.endTime = endTime;
    if (visibility !== undefined) updateData.visibility = visibility;
    if (assignedToAll !== undefined) updateData.assignedToAll = assignedToAll;

    // Handle assigned family members update
    if (assignedTo !== undefined && Array.isArray(assignedTo)) {
      if (assignedTo.length > 0) {
        const current = await Parent.findById(req.parent._id).select('familyMembers');
        const allowedParentIds = [current._id, ...(current.familyMembers || [])].map(id => id.toString());

        const invalid = assignedTo.some(id => !allowedParentIds.includes(id.toString()));
        if (invalid) {
          return res.status(400).json({
            success: false,
            message: 'Some assigned family members do not exist or do not belong to your family'
          });
        }
      }

      updateData.assignedTo = assignedTo;
    }

    // If assignedToAll is true, get all family members
    if (assignedToAll) {
      const current = await Parent.findById(req.parent._id).select('familyMembers');
      const allIds = [current._id, ...(current.familyMembers || [])];
      updateData.assignedTo = allIds.map(id => id._id ? id._id : id);
    }

    event = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true
      }
    )
      .populate('createdBy', 'firstname lastname email avatar')
      .populate('assignedTo', 'firstname lastname email avatar');

    res.status(200).json({
      success: true,
      message: 'Event updated successfully',
      data: event
    });
  } catch (error) {
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        errors: messages
      });
    }

    // Handle invalid MongoDB ID
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/:id
// @access  Private
exports.deleteEvent = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    // Check if user is the creator
    if (event.createdBy.toString() !== req.parent.id) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized to delete this event'
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Event deleted successfully',
      data: {}
    });
  } catch (error) {
    // Handle invalid MongoDB ID
    if (error.name === 'CastError') {
      return res.status(404).json({
        success: false,
        message: 'Event not found'
      });
    }

    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};

// @desc    Get family members for event assignment
// @route   GET /api/events/family-members
// @access  Private
exports.getFamilyMembers = async (req, res) => {
  try {
    // Return parents associated via familyMembers and include self
    const user = await Parent.findById(req.parent._id)
      .populate('familyMembers', 'firstname lastname email avatar role');

    const members = [
      {
        _id: user._id,
        firstname: user.firstname,
        lastname: user.lastname,
        email: user.email,
        avatar: user.avatar,
        role: user.role || 'parent'
      },
      ...user.familyMembers
    ];

    res.status(200).json({
      success: true,
      count: members.length,
      data: members
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
