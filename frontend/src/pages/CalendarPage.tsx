import React, { useState, useEffect, useCallback } from "react";
import Calendar from "../components/calendar/Calendar";
import { useAuth } from "../context/AuthContext";
import CalendarService from "../services/CalendarService";
import Loader from "../components/Loader";
import styles from "../styles/calendar/CalendarPage.module.css";
import { debounce } from 'lodash';

const CalendarPage: React.FC = () => {
  const { theme } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [dateRangeCache, setDateRangeCache] = useState<string>('');

  // Fetch calendar events
  const fetchCalendarEvents = async (start?: Date, end?: Date) => {
    try {
      // Default to current month if no dates provided
      const today = new Date();
      const startDate = start || new Date(today.getFullYear(), today.getMonth(), 1);
      const endDate = end || new Date(today.getFullYear(), today.getMonth() + 2, 0);
      
      // Create a cache key for this date range
      const newCacheKey = `${startDate.toISOString()}-${endDate.toISOString()}`;
      
      // Skip API call if we just called for the same range
      if (dateRangeCache === newCacheKey) {
        return;
      }
      
      setDateRangeCache(newCacheKey);
      setIsLoading(true);

      const response = await CalendarService.getEvents(startDate, endDate);

      if (response.data.success) {
        // Combine tasks and sessions into a unified events array
        const combinedEvents = [
          ...response.data.data.tasks,
          ...response.data.data.sessions,
        ];

        setEvents(combinedEvents);
        setError(null);
      } else {
        setError("Failed to load calendar data");
      }
    } catch (error) {
      console.error("Error loading calendar data:", error);
      setError("An error occurred while loading your calendar");
    } finally {
      setIsLoading(false);
    }
  };

  // Create a debounced version of fetchCalendarEvents with lodash
  const debouncedFetchEvents = useCallback(
    debounce((start: Date, end: Date) => {
      fetchCalendarEvents(start, end);
    }, 300), 
    [] // Empty dependencies array since we want this function created only once
  );

  // Initial data load
  useEffect(() => {
    fetchCalendarEvents();
  }, []);

  const handleEventCreate = async (eventData: any) => {
    try {
      if (eventData.type === "task") {
        await CalendarService.createTaskEvent({
          title: eventData.title,
          description: eventData.description,
          priority: eventData.priority || "medium",
          dueDate: eventData.start,
        });
      } else {
        await CalendarService.createSessionEvent({
          duration: calculateDuration(eventData.start, eventData.end),
          type: "focus",
          title: eventData.title,
        });
      }

      // Refresh calendar data
      await fetchCalendarEvents();
    } catch (error) {
      console.error("Error creating event:", error);
      setError("Failed to create event");
      throw error;
    }
  };

  const handleEventUpdate = async (eventData: any) => {
    try {
      if (eventData.type === "task") {
        await CalendarService.updateTaskEvent(eventData.id, {
          title: eventData.title,
          description: eventData.description,
          priority: eventData.priority,
          dueDate: eventData.start,
        });
      } else {
        // Update session logic would go here
        console.log("Session updates not yet implemented");
      }

      // Refresh calendar data
      await fetchCalendarEvents();
    } catch (error) {
      console.error("Error updating event:", error);
      setError("Failed to update event");
      throw error;
    }
  };
  
  const handleEventDelete = async (eventData: any) => {
    try {
      if (eventData.type === "task") {
        await CalendarService.deleteTaskEvent(eventData.id);
      } else {
        await CalendarService.deleteSessionEvent(eventData.id);
      }
      
      // Refresh calendar data
      await fetchCalendarEvents();
      return true;
    } catch (error) {
      console.error("Error deleting event:", error);
      setError("Failed to delete event");
      throw error;
    }
  };

  // Calculate duration in minutes between two dates
  const calculateDuration = (start: Date, end: Date): number => {
    return Math.floor((end.getTime() - start.getTime()) / 60000);
  };

  return (
    <div className={styles.calendarPage}>
      <header className={styles.calendarHeader}>
        <h1>Calendar</h1>
        <p>
          Plan your tasks and focus sessions with an integrated calendar view
        </p>
      </header>

      {error && (
        <div className={styles.errorMessage}>
          <p>{error}</p>
          <button onClick={() => fetchCalendarEvents()}>Retry</button>
        </div>
      )}

      {isLoading && !events.length ? (
        <Loader />
      ) : (
        <Calendar
          events={events}
          onEventCreate={handleEventCreate}
          onEventUpdate={handleEventUpdate}
          onEventDelete={handleEventDelete}
          onDateRangeChange={debouncedFetchEvents}
        />
      )}
    </div>
  );
};

export default CalendarPage;