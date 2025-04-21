import React, { useState, useRef, useCallback, useEffect, useMemo } from "react";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import {
  EventInput,
  DateSelectArg,
  EventClickArg,
  DatesSetArg,
  ViewApi,
  MoreLinkArg,
} from "@fullcalendar/core";
import { useAuth } from "../../context/AuthContext";
import styles from "../../styles/calendar/Calendar.module.css";
import { CalendarEntryType, TaskPriority } from "../../types/types";

// Updated props interface to match what CalendarPage is passing
interface CalendarProps {
  events: any[];
  onDateRangeChange: (start: Date, end: Date) => void;
  onDateSelect: (date: Date) => void;
  onEventClick: (eventInfo: any) => void;
}

// Default view constant - use month view as default
const DEFAULT_VIEW = "dayGridMonth";

// Save current view to localStorage so it persists across sessions
const saveCurrentView = (viewName: string) => {
  try {
    localStorage.setItem("calendarView", viewName);
  } catch (e) {
    console.error("Failed to save calendar view to localStorage");
  }
};

// Get saved view from localStorage, default to dayGridMonth
const getSavedView = (): string => {
  try {
    const savedView = localStorage.getItem("calendarView");
    return savedView || DEFAULT_VIEW;
  } catch (e) {
    return DEFAULT_VIEW;
  }
};

const Calendar = React.memo(function Calendar({
  events,
  onDateRangeChange,
  onDateSelect,
  onEventClick
}: CalendarProps) {
  const { theme } = useAuth();
  
  // Track the current view
  const [currentView, setCurrentView] = useState<string>(getSavedView());

  const calendarRef = useRef<FullCalendar>(null);
  
  // Track if this is initial render
  const initialRenderRef = useRef(true);
  
  // Track date range for fetch optimization
  const prevDatesRef = useRef<{ start: string | null; end: string | null }>({
    start: null,
    end: null,
  });

  // Format events for FullCalendar
  const formattedEvents: EventInput[] = useMemo(
    () =>
      events.map((event) => {
        // Get appropriate classes based on event type and priority
        const classes = [];
        if (event.type === CalendarEntryType.TASK) {
          classes.push("event-task");
          if (event.priority) {
            classes.push(`priority-${event.priority}`);
          }
        } else {
          classes.push("event-standard");
        }

        return {
          id: String(event.id || event._id),
          title: event.title,
          start: new Date(event.start),
          end: event.end ? new Date(event.end) : undefined,
          allDay: event.allDay || false,
          className: classes.join(" "),
          extendedProps: {
            type: event.type === CalendarEntryType.TASK ? "task" : "event",
            description: event.description,
            priority: event.priority,
            status: event.status,
          },
        };
      }),
    [events]
  );

  // Handler for view changes
  const handleViewChange = useCallback((viewInfo: { view: ViewApi }) => {
    const viewName = viewInfo.view.type;
    // Only log and save if the view actually changed
    if (viewName !== currentView) {
      console.log(`Calendar: View changed to ${viewName}`);
      setCurrentView(viewName);
      saveCurrentView(viewName);
    }
  }, [currentView]);

  // Handler for date range change
  const handleDatesSet = useCallback(
    (dateInfo: DatesSetArg) => {
      if (initialRenderRef.current) {
        initialRenderRef.current = false;
        // Store initial date range
        prevDatesRef.current = {
          start: dateInfo.start.toISOString(),
          end: dateInfo.end.toISOString(),
        };
        
        // On initial render, always fetch data
        onDateRangeChange(dateInfo.start, dateInfo.end);
        return;
      }

      // Convert dates to strings for comparison
      const startStr = dateInfo.start.toISOString();
      const endStr = dateInfo.end.toISOString();

      // Skip if the date range hasn't changed
      if (
        prevDatesRef.current.start === startStr &&
        prevDatesRef.current.end === endStr
      ) {
        return;
      }

      // Update refs and trigger the fetch
      prevDatesRef.current = { start: startStr, end: endStr };
      onDateRangeChange(dateInfo.start, dateInfo.end);
    },
    [onDateRangeChange]
  );

  // Date selection handler - delegate to parent via prop
  const handleDateSelect = useCallback((selectInfo: DateSelectArg) => {
    // Call parent handler with the selected date
    onDateSelect(selectInfo.start);

    // Clear selection in the calendar
    const calendarApi = selectInfo.view.calendar;
    calendarApi.unselect();
  }, [onDateSelect]);

  // Event click handler - delegate to parent via prop
  const handleEventClick = useCallback((clickInfo: EventClickArg) => {
    // Pass the event click info to parent
    onEventClick(clickInfo);
  }, [onEventClick]);

  // Handler for "more" link click
  const handleMoreLinkClick = useCallback((info: MoreLinkArg) => {
    // Get the calendar API
    const calendarApi = info.view.calendar;
    
    // Change to day view for the clicked date
    calendarApi.changeView('timeGridDay', info.date);
    
    // Save this view preference
    setCurrentView('timeGridDay');
    saveCurrentView('timeGridDay');
    
    // Return 'string' to tell FullCalendar we're handling this click
    return 'day';
  }, []);

  return (
    <div
      className={`${styles.calendarContainer} ${
        theme === "dark" ? styles.calendarDark : ""
      }`}
    >
      <FullCalendar
        key={`calendar-${theme}`} // Only re-render on theme change
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView={currentView} // Use the current view from state
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
        }}
        views={{
          dayGridMonth: {
            dayMaxEvents: 4,
          },
          listWeek: {
            listDayFormat: { weekday: "long" },
            listDaySideFormat: { month: "short", day: "numeric" },
            displayEventTime: true,
            displayEventEnd: true,
          },
        }}
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={formattedEvents}
        select={handleDateSelect}
        eventClick={handleEventClick}
        datesSet={handleDatesSet}
        viewDidMount={handleViewChange}
        height="auto"
        contentHeight="auto"
        nowIndicator={true}
        eventTimeFormat={{
          hour: "numeric",
          minute: "2-digit",
          meridiem: "short",
        }}
        slotMinTime="06:00:00"
        slotMaxTime="22:00:00"
        allDaySlot={true}
        allDayText="All day"
        slotDuration="00:30:00"
        eventDisplay="block"
        listDayFormat={{ weekday: "long" }}
        listDaySideFormat={{ day: "numeric", month: "short" }}
        moreLinkClick={handleMoreLinkClick} // Add this handler for "more" link clicks
      />
    </div>
  );
});

export default Calendar;