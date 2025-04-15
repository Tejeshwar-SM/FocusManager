import React, { useState, useRef, useEffect, useCallback } from "react";
import { debounce } from "lodash";
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
} from "@fullcalendar/core";
import { useAuth } from "../../context/AuthContext";
import EventModal from "./EventModal";
import styles from "../../styles/calendar/Calendar.module.css";

interface CalendarProps {
  events: any[];
  onEventCreate: (eventData: any) => Promise<void>;
  onEventUpdate: (eventData: any) => Promise<void>;
  onEventDelete: (eventData: any) => Promise<boolean>;
  onDateRangeChange: (start: Date, end: Date) => void;
}

const Calendar: React.FC<CalendarProps> = ({
  events,
  onEventCreate,
  onEventUpdate,
  onEventDelete,
  onDateRangeChange,
}) => {
  const { theme } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedEvent, setSelectedEvent] = useState<any | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [isLoading, setIsLoading] = useState(false);
  const calendarRef = useRef<FullCalendar>(null);

  // Create a debounced version of the date range change handler
  // We use useCallback to avoid recreating this function on every render
  const handleDatesSet = useCallback(
    debounce((dateInfo: DatesSetArg) => {
      onDateRangeChange(dateInfo.start, dateInfo.end);
    }, 3000), // 3000ms debounce time
    [onDateRangeChange] // Recreate when onDateRangeChange changes
  );

  useEffect(() => {
    if (events.length > 0) {
      // After events load, ensure today is visible
      const calendarApi = calendarRef.current?.getApi();
      if (calendarApi) {
        calendarApi.today();
      }
    }
  }, [events]);

  // Format events for FullCalendar
  const formattedEvents: EventInput[] = events.map((event) => ({
    id: event.id,
    title: event.title,
    start: new Date(event.start),
    end: event.end ? new Date(event.end) : undefined,
    allDay: event.allDay || false,
    backgroundColor: getEventColor(event),
    borderColor: getEventColor(event),
    textColor: "#ffffff",
    extendedProps: {
      type: event.type,
      description: event.description,
      priority: event.priority,
      status: event.status,
    },
  }));

  // Handle date selection for new event
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDate(selectInfo.start);
    setSelectedEvent(null);
    setModalMode("create");
    setModalOpen(true);
  };

  // Handle event click for editing
  const handleEventClick = (clickInfo: EventClickArg) => {
    const event = clickInfo.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      type: event.extendedProps?.type || "task",
      description: event.extendedProps?.description || "",
      priority: event.extendedProps?.priority || "medium",
      status: event.extendedProps?.status,
    });
    setModalMode("edit");
    setModalOpen(true);
  };

  // Handle save from modal
  const handleSave = async (eventData: any) => {
    setIsLoading(true);
    try {
      if (modalMode === "create") {
        await onEventCreate(eventData);
      } else {
        await onEventUpdate(eventData);
      }
      setModalOpen(false);
    } catch (error) {
      console.error("Error saving event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle delete from modal
  const handleDelete = async (eventData: any) => {
    setIsLoading(true);
    try {
      const success = await onEventDelete(eventData);
      if (success) {
        setModalOpen(false);
      }
    } catch (error) {
      console.error("Error deleting event:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper to determine event color based on type and priority
  function getEventColor(event: any): string {
    if (event.type === "task") {
      // Color by task priority
      switch (event.priority) {
        case "high":
          return "var(--color-danger)";
        case "medium":
          return "var(--color-warning)";
        case "low":
          return "var(--color-success)";
        default:
          return "var(--color-text-tertiary)";
      }
    } else {
      // Pomodoro sessions
      return "var(--color-info)";
    }
  }

  return (
    <div
      className={`${styles.calendarContainer} ${
        theme === "dark" ? styles.calendarDark : ""
      }`}
    >
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{
          left: "prev,next today",
          center: "title",
          right: "dayGridMonth,timeGridWeek,timeGridDay,listWeek",
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
        height="auto"
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
      />

      <EventModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSave={handleSave}
        onDelete={handleDelete}
        initialData={selectedEvent}
        mode={modalMode}
        selectedDate={selectedDate}
        isSubmitting={isLoading}
      />
    </div>
  );
};

export default Calendar;
