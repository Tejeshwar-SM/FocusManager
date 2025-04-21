import { Request, Response } from "express";
import Task, { CalendarEntryType } from "../models/Task"; // Import the enum too

// Get all calendar events (tasks and events from Task model) within a date range
export const getCalendarEvents = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    // Parse date range from query params
    const { start, end } = req.query;

    if (!start || !end) {
      res
        .status(400)
        .json({ success: false, message: "Start and end dates are required" });
      return;
    }

    const startDate = new Date(start as string);
    const endDate = new Date(end as string);

    // Validate dates
    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      res.status(400).json({ success: false, message: "Invalid date format" });
      return;
    }

    // Fetch tasks and events from the Task model that overlap with the date range
    // Overlap condition:
    // - Starts before the range ends AND
    // - (Ends after the range starts OR is an all-day event starting within or before the range end)
    const calendarEntries = await Task.find({
      user: req.user?.id,
      start: { $lt: endDate }, // Starts before the end of the query range
      $or: [
        { end: { $gt: startDate } }, // Ends after the start of the query range (for timed events)
        { allDay: true, start: { $gte: startDate } } // Is all-day and starts within the query range
        // Note: Depending on how you handle all-day events spanning multiple days,
        // you might need a more complex query, but this covers most common cases.
        // A simpler overlap: { start: { $lt: endDate }, end: { $gt: startDate } } works if 'end' is always set.
        // Let's refine the overlap logic for robustness:
        // An entry overlaps if its start is before the range end AND its end is after the range start.
        // For all-day events, we treat their 'end' as start + 1 day conceptually for overlap.
        // Query: Find where entry.start < range.end AND (entry.end > range.start OR (entry.allDay AND entry.start < range.end))
      ]
      // Simpler Overlap Query (often sufficient):
      // start: { $lt: endDate }, // It must start before the range ends
      // $or: [
      //   { end: { $gt: startDate } }, // It must end after the range starts (for timed events)
      //   { allDay: true } // Or it's an all-day event (implicitly overlaps if start < endDate)
      // ]
    }).sort({ start: 1 }); // Sort by start time

    // Format the response - map directly from the fetched entries
    const formattedEvents = calendarEntries.map((entry) => ({
      id: entry._id,
      title: entry.title,
      start: entry.start,
      end: entry.end, // Will be undefined if allDay is true due to pre-save hook
      allDay: entry.allDay,
      description: entry.description,
      status: entry.status, // Only relevant for type 'task'
      priority: entry.priority, // Only relevant for type 'task'
      type: entry.type, // 'task' or 'event'
    }));

    // Send back a single array of events
    res.json({
      success: true,
      // Keep the structure consistent if frontend expects { tasks: [], sessions: [] }
      // Otherwise, simplify to data: formattedEvents
      data: {
          tasks: formattedEvents.filter(e => e.type === CalendarEntryType.TASK),
          // Send an empty array for sessions, or adjust frontend to expect just 'events'
          events: formattedEvents.filter(e => e.type === CalendarEntryType.EVENT),
          // OR simply: data: formattedEvents
      }
    });
  } catch (error) {
    console.error("Error fetching calendar events:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};