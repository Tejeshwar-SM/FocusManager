import React, { useState, useRef, useEffect, useCallback } from "react";
import Calendar from "../components/calendar/Calendar";
import EventModal from "../components/calendar/EventModal";
import { EventData } from "../components/calendar/EventModal";
import CalendarService from "../services/CalendarService";
import {
  CalendarEntryType,
  Task,
  TaskPriority,
  TaskStatus,
} from "../types/types";
import styles from "../styles/calendar/CalendarPage.module.css";

// Create a stable debounce function outside the component
const createDebouncedFn = (callback: Function, delay: number = 300) => {
  let timeoutId: NodeJS.Timeout;

  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      callback(...args);
    }, delay);
  };
};

// Type for the date range
interface DateRange {
  start: Date;
  end: Date;
}

// Type for calendar events used internally in CalendarPage
interface CalendarEvent extends Omit<Partial<Task>, "start" | "end"> {
  id: string;
  title: string;
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  type: CalendarEntryType;
  priority?: TaskPriority;
  status?: TaskStatus;
}

// Interface for task/event payload sent to the API
interface TaskEventPayload {
  title: string;
  description?: string;
  type: CalendarEntryType;
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  priority?: TaskPriority;
  status?: string;
}

const CalendarPage: React.FC = () => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isModalSubmitting, setIsModalSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showModal, setShowModal] = useState<boolean>(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    start: new Date(),
    end: new Date(new Date().setMonth(new Date().getMonth() + 1)),
  });

  // Track mount time to avoid stale updates
  const mountedTimeRef = useRef<number>(Date.now());
  
  // Use initialLoadRef to ensure first load always completes
  const initialLoadRef = useRef<boolean>(true);
  
  // Use refs for throttling to allow direct access/bypass
  const lastFetchTimeRef = useRef<number>(0);
  const fetchEventsRef = useRef<
    ((start?: Date, end?: Date, forceRefresh?: boolean) => Promise<void>) | null
  >(null);

  // Function to fetch events
  const fetchEvents = useCallback(
    async (start?: Date, end?: Date, forceRefresh: boolean = false): Promise<void> => {
      const currentMountTime = mountedTimeRef.current;
      const now = Date.now();
      
      // Skip throttling if this is the initial load or a forced refresh
      if (!initialLoadRef.current && !forceRefresh && now - lastFetchTimeRef.current < 500) { 
        console.log("CalendarPage: Skipping fetch due to throttle");
        return;
      }
      
      // Update last fetch time
      lastFetchTimeRef.current = now;

      try {
        const today = new Date();
        const startDate = start || new Date(today.getFullYear(), today.getMonth(), 1);
        const endDate = end || new Date(today.getFullYear(), today.getMonth() + 2, 0);

        setDateRange({ start: startDate, end: endDate });

        console.log(
          `CalendarPage: Fetching events from ${startDate.toISOString()} to ${endDate.toISOString()} (forceRefresh: ${forceRefresh}, initialLoad: ${initialLoadRef.current})`
        );
        
        setIsLoading(true);

        // Pass forceRefresh or initialLoad flag to ensure fresh data
        const response = await CalendarService.getEvents(
          startDate, 
          endDate, 
          forceRefresh || initialLoadRef.current
        );

        // Reset the initial load flag
        if (initialLoadRef.current) {
          initialLoadRef.current = false;
        }

        // Only process the response if the component is still mounted and this isn't a stale request
        if (mountedTimeRef.current !== currentMountTime) {
          console.log("CalendarPage: Stale fetch completed, ignoring results");
          return;
        }

        if (!response || !response.data) {
          console.error("CalendarPage: Invalid or empty response received");
          setError("Failed to load calendar data: Server returned an invalid response");
          setIsLoading(false);
          return;
        }

        if (response.data.success !== false) {
          let eventData: any[] = [];
          if (Array.isArray(response.data.data)) {
            eventData = response.data.data;
          } else if (response.data.data) {
            // Handle the case where data is { tasks: [], events: [] }
            const tasks = Array.isArray((response.data.data as any).tasks) ? (response.data.data as any).tasks : [];
            const eventsArr = Array.isArray((response.data.data as any).events) ? (response.data.data as any).events : [];
            eventData = [...tasks, ...eventsArr];
          }

          // Convert API data to CalendarEvent format
          const typedEvents: CalendarEvent[] = eventData.map((ev) => ({
            ...ev,
            id: String(ev.id || ev._id),
            type: ev.type || CalendarEntryType.TASK,
            priority:
              ev.type === CalendarEntryType.TASK && !ev.priority
                ? TaskPriority.MEDIUM
                : ev.priority,
            start: ev.start ? new Date(ev.start) : new Date(),
            end: ev.end ? new Date(ev.end) : undefined,
            title: ev.title || "Untitled Event",
            allDay: ev.allDay ?? false,
          }));

          console.log(`CalendarPage: Setting ${typedEvents.length} events`);
          setEvents(typedEvents);
          setError(null);
        } else {
          const errorMsg = response.data.message || "Failed to load calendar data";
          console.error("Failed to load calendar data:", errorMsg);
          setError(errorMsg);
          setEvents([]);
        }
      } catch (error: any) {
        console.error("Error loading calendar data:", error);
        if (mountedTimeRef.current === currentMountTime) {
          setError(`Failed to load calendar data: ${error.message || 'Unknown error'}`);
          setEvents([]);
        }
      } finally {
        if (mountedTimeRef.current === currentMountTime) {
          setIsLoading(false);
        }
      }
    },
    [] // No dependencies for stability
  );

  // Effect for initial fetch
  useEffect(() => {
    fetchEventsRef.current = fetchEvents;
    mountedTimeRef.current = Date.now();
    initialLoadRef.current = true; // Ensure first load is treated specially
    
    // Initial fetch - will bypass throttling due to initialLoadRef
    fetchEvents();
    
    return () => {
      fetchEventsRef.current = null;
      mountedTimeRef.current = 0;
    };
  }, [fetchEvents]);

  // Handler for clicking on a date/time slot in the calendar
  const handleDateClick = useCallback((date: Date) => {
    setSelectedDate(date);
    setSelectedEvent(null);
    setShowModal(true);
  }, []);

  // Handler for clicking on an existing event in the calendar
  const handleEventClick = useCallback(
    (eventInfo: any) => {
      try {
        const clickedEventId = String(eventInfo.event.id);
        const foundEvent = events.find((event) => event.id === clickedEventId);

        if (foundEvent) {
          setSelectedEvent({
            ...foundEvent,
            start: foundEvent.start instanceof Date ? foundEvent.start : new Date(foundEvent.start),
            end: foundEvent.end ? (foundEvent.end instanceof Date ? foundEvent.end : new Date(foundEvent.end)) : undefined,
          });
          setSelectedDate(null);
          setShowModal(true);
        } else {
          console.error("Event not found in local state:", clickedEventId);
          setError(`Event with ID ${clickedEventId} not found.`);
        }
      } catch (error) {
        console.error("Error processing event click:", error);
        setError("Error processing event click.");
      }
    },
    [events]
  );

  // Helper to prepare data for the API payload
  const preparePayload = (eventData: EventData): TaskEventPayload => {
    const payload: TaskEventPayload = {
      title: eventData.title,
      description: eventData.description,
      type: eventData.type as CalendarEntryType,
      start: eventData.start ? new Date(eventData.start).toISOString() : new Date().toISOString(),
      end: eventData.end ? new Date(eventData.end).toISOString() : undefined,
      allDay: eventData.allDay,
    };
    if (payload.type === CalendarEntryType.TASK) {
      payload.priority = (eventData.priority as TaskPriority) || TaskPriority.MEDIUM;
      payload.status = eventData.status || TaskStatus.TODO;
    }
    return payload;
  };

  // Handler for creating a new event (called from Modal's onSave)
  const handleEventCreate = useCallback(
    async (eventData: EventData): Promise<void> => {
      try {
        setError(null);
        setIsModalSubmitting(true);
        const payload = preparePayload(eventData);
        
        // Step 1: Create the event
        await CalendarService.createTaskEvent(payload);
        
        // Step 2: Force a refresh immediately to get the latest data
        if (fetchEventsRef.current) {
          await fetchEventsRef.current(dateRange.start, dateRange.end, true);
        }
        
        // Step 3: Close the modal after successful refresh
        setShowModal(false);
      } catch (error: any) {
        console.error("Error creating event:", error);
        setError(`Failed to create event: ${error.response?.data?.message || error.message || "Unknown error"}`);
      } finally {
        setIsModalSubmitting(false);
      }
    },
    [dateRange]
  );

  // Handler for updating an existing event (called from Modal's onSave)
  const handleEventUpdate = useCallback(
    async (eventData: EventData): Promise<void> => {
      const eventId = eventData.id;
      if (!eventId) {
        setError("Cannot update event without an ID.");
        return;
      }

      try {
        setError(null);
        setIsModalSubmitting(true);
        const payload = preparePayload(eventData);
        
        // Step 1: Update the event
        await CalendarService.updateTaskEvent(eventId, payload);
        
        // Step 2: Force a refresh immediately to get the latest data
        if (fetchEventsRef.current) {
          await fetchEventsRef.current(dateRange.start, dateRange.end, true);
        }
        
        // Step 3: Close the modal after successful refresh
        setShowModal(false);
      } catch (error: any) {
        console.error("Error updating event:", error);
        setError(`Failed to update event: ${error.response?.data?.message || error.message || "Unknown error"}`);
      } finally {
        setIsModalSubmitting(false);
      }
    },
    [dateRange]
  );

  // Handler for deleting an event (called from Modal's onDelete)
  const handleEventDelete = useCallback(
    async (eventData: EventData): Promise<void> => {
      const eventId = eventData.id;
      if (!eventId) {
        setError("Cannot delete event without an ID.");
        return;
      }

      try {
        setError(null);
        setIsModalSubmitting(true);
        
        // Step 1: Delete the event
        await CalendarService.deleteTaskEvent(eventId);
        
        // Step 2: Force a refresh immediately to get the latest data
        if (fetchEventsRef.current) {
          await fetchEventsRef.current(dateRange.start, dateRange.end, true);
        }
        
        // Step 3: Close the modal after successful refresh
        setShowModal(false);
      } catch (error: any) {
        console.error("Error deleting event:", error);
        setError(`Failed to delete event: ${error.response?.data?.message || error.message || "Unknown error"}`);
      } finally {
        setIsModalSubmitting(false);
      }
    },
    [dateRange]
  );

  // Debounced handler for date range changes from the Calendar component
  const handleDateRangeChange = useCallback(
    createDebouncedFn((start: Date, end: Date) => {
      if (fetchEventsRef.current) {
        // Regular range change doesn't need to force refresh
        fetchEventsRef.current(start, end, false);
      }
    }, 500),
    []
  );

  // Helper to prepare data for the EventModal's initialData prop
  const prepareInitialDataForModal = (event: CalendarEvent | null): EventData | null => {
    if (!event) return null;
    return {
      ...event,
      id: String(event.id),
      start: event.start instanceof Date ? event.start : (event.start ? new Date(event.start) : null),
      end: event.end instanceof Date ? event.end : (event.end ? new Date(event.end) : null),
      priority: event.priority || TaskPriority.MEDIUM,
      status: event.status || TaskStatus.TODO,
      type: event.type || CalendarEntryType.TASK,
      title: event.title || "",
      allDay: event.allDay ?? false,
    };
  };

  const currentSaveHandler = selectedEvent ? handleEventUpdate : handleEventCreate;
  const modalInitialData = prepareInitialDataForModal(selectedEvent);

  return (
    <div className={styles.calendarPage}>
      <div className={styles.calendarHeader}>
        <h1>Calendar</h1>
      </div>

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button
            onClick={() => {
              setError(null);
              if (fetchEventsRef.current) {
                fetchEventsRef.current(dateRange.start, dateRange.end, true);
              }
            }}
            className={styles.retryButton}
          >
            Retry
          </button>
        </div>
      )}

      {isLoading && !isModalSubmitting && (
        <div className={styles.loadingOverlay}>
          <div className={styles.spinner}></div>
          <span>Loading...</span>
        </div>
      )}

      <Calendar
        events={events}
        onDateRangeChange={handleDateRangeChange}
        onDateSelect={handleDateClick}
        onEventClick={handleEventClick}
      />

      {showModal && (
        <EventModal
          isOpen={showModal}
          onClose={() => {
            setShowModal(false);
            setSelectedEvent(null);
            setSelectedDate(null);
          }}
          selectedDate={selectedDate}
          initialData={modalInitialData}
          onSave={currentSaveHandler}
          onDelete={handleEventDelete}
          mode={selectedEvent ? "edit" : "create"}
          isSubmitting={isModalSubmitting}
        />
      )}
    </div>
  );
};

export default CalendarPage;