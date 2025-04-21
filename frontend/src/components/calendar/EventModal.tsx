import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/calendar/EventModal.module.css';

// Define the possible types for calendar entries
export type CalendarEntryType = 'task' | 'event';

// Define the possible priorities for tasks
export type TaskPriority = 'low' | 'medium' | 'high';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (eventData: EventData) => Promise<void>;
  onDelete: (eventData: EventData) => Promise<void>;
  initialData: EventData | null;
  mode: 'create' | 'edit';
  selectedDate: Date | null;
  isSubmitting: boolean;
}

// Updated EventData interface
export interface EventData {
  id?: string;
  title: string;
  start: Date | null;
  end: Date | null;
  allDay: boolean;
  description?: string;
  type: 'task' | 'event';
  priority?: 'low' | 'medium' | 'high';
  status?: 'todo' | 'inProgress' | 'completed';
}

const EventModal: React.FC<EventModalProps> = ({
  isOpen,
  onClose,
  onSave,
  onDelete,
  initialData,
  mode,
  selectedDate,
  isSubmitting
}) => {
  const { theme } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Default data structure, defaulting to 'task' type
  const defaultEventData: EventData = {
    title: '',
    start: selectedDate || new Date(),
    end: selectedDate ? new Date(selectedDate.getTime() + 60 * 60 * 1000) : new Date(new Date().getTime() + 60 * 60 * 1000),
    allDay: false,
    description: '',
    type: 'task', // Default to task
    priority: 'medium' // Default priority for tasks
  };

  const [eventData, setEventData] = useState<EventData>(defaultEventData);

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // Ensure the type is correctly set from initialData
        const currentType = initialData.type === 'task' || initialData.type === 'event' ? initialData.type : 'task'; // Fallback to task if type is unexpected
        setEventData({
          ...initialData,
          type: currentType, // Set the type
          // Ensure dates are Date objects
          start: initialData.start ? new Date(initialData.start) : null,
          end: initialData.end ? new Date(initialData.end) : null,
          // Set priority only if it's a task, otherwise default or leave undefined
          priority: currentType === 'task' ? (initialData.priority || 'medium') : undefined,
        });
      } else {
        // Reset to default for creation mode
        setEventData({
          ...defaultEventData,
          start: selectedDate || new Date(),
          end: selectedDate ? new Date(selectedDate.getTime() + 60 * 60 * 1000) : new Date(new Date().getTime() + 60 * 60 * 1000),
          type: 'task', // Default to task on create
          priority: 'medium'
        });
      }
      setError(null);
      setShowDeleteConfirm(false);
    }
  }, [isOpen, initialData, selectedDate]);

  // Handle escape key to close modal
  useEffect(() => {
    const handleEscapeKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, onClose]);

  // Handle input changes (including select dropdown)
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    setEventData(prev => {
        const newState = { ...prev, [name]: value };
        // If changing type to 'event', remove task-specific fields like priority
        if (name === 'type' && value === 'event') {
            newState.priority = undefined;
        }
        // If changing type back to 'task', set default priority if none exists
        else if (name === 'type' && value === 'task' && !newState.priority) {
            newState.priority = 'medium';
        }
        return newState;
    });
  };

  // Handle date input changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value) {
      // Parse the date-time string correctly
      setEventData(prev => ({ ...prev, [name]: new Date(value) }));
    } else {
      // Handle case where date is cleared
       setEventData(prev => ({ ...prev, [name]: null }));
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;

    if (name === 'allDay') {
      const startDate = eventData.start || new Date();
      // Create date at midnight of the start date
      const midnightStartDate = new Date(startDate);
      midnightStartDate.setHours(0, 0, 0, 0);

      setEventData(prev => ({
        ...prev,
        [name]: checked,
        // If setting to all day, adjust start to midnight and clear end time
        start: checked ? midnightStartDate : prev.start,
        end: checked ? null : prev.end // Clear end time for all-day
      }));
    } else {
      setEventData(prev => ({ ...prev, [name]: checked }));
    }
  };

  // Format date for datetime-local input
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    try {
        // Adjust for timezone offset before converting to ISO string
        const localDate = new Date(date.getTime() - (date.getTimezoneOffset() * 60000));
        return localDate.toISOString().slice(0, 16);
    } catch (e) {
        console.error("Error formatting date:", date, e);
        return ''; // Return empty string on error
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null); // Clear previous errors

    // --- Validation ---
    if (!eventData.title.trim()) {
      setError('Please enter a title.');
      return;
    }
    if (!eventData.start) {
      setError('Please select a start date and time.');
      return;
    }
    // End date is only required if it's not an all-day event
    if (!eventData.allDay && !eventData.end) {
      setError('Please select an end date and time for non-all-day events.');
      return;
    }
    // End must be after start for non-all-day events
    if (!eventData.allDay && eventData.start && eventData.end && eventData.end <= eventData.start) {
      setError('End time must be after start time.');
      return;
    }
    // Priority is required only if type is 'task'
    if (eventData.type === 'task' && !eventData.priority) {
        setError('Please select a priority for the task.');
        return;
    }
    // --- End Validation ---

    // Prepare data for saving (remove priority if type is 'event')
    const dataToSave = { ...eventData };
    if (dataToSave.type === 'event') {
        delete dataToSave.priority;
    }

    try {
      await onSave(dataToSave);
      // onClose(); // Let the parent component handle closing on success if needed
    } catch (err) {
      console.error('Error saving event:', err);
      // Display a more specific error if possible, otherwise generic
      setError('Failed to save the entry. Please check the details and try again.');
    }
  };

  // Handle delete event
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    // Ensure we have an ID to delete
    if (!eventData.id) {
        setError("Cannot delete an entry without an ID.");
        setShowDeleteConfirm(false);
        return;
    }
    try {
      await onDelete(eventData);
      // onClose(); // Let parent handle closing
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Failed to delete the entry. Please try again.');
      // Keep the confirmation dialog open on error? Or close it?
      // setShowDeleteConfirm(false); // Optionally close confirm on error
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`${styles.modalBackdrop} ${theme === 'dark' ? styles.darkTheme : ''}`}
      onClick={(e) => {
        // Close only if backdrop is clicked directly
        if (e.target === e.currentTarget && !isSubmitting) onClose();
      }}
    >
      <div className={styles.eventModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{mode === 'create' ? 'Create New Entry' : 'Edit Entry'}</h2>
          <button
            onClick={onClose}
            className={styles.closeButton}
            aria-label="Close"
            disabled={isSubmitting}
          >
            &times;
          </button>
        </div>

        {error && <div className={styles.modalError}>{error}</div>}

        {showDeleteConfirm ? (
          <div className={styles.deleteConfirmation}>
            <p>Are you sure you want to delete this entry?</p>
            <p className={styles.deleteWarning}>This action cannot be undone.</p>
            <div className={styles.deleteActions}>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className={`${styles.btn} ${styles.secondaryBtn}`}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDelete}
                className={`${styles.btn} ${styles.dangerBtn}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Deleting...' : 'Delete Entry'}
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Scrollable content area */}
            <div className={styles.scrollableContent}>
              <form id="eventForm">
                {/* Title Input */}
                <div className={styles.formGroup}>
                  <label htmlFor="title">Title</label>
                  <input
                    type="text"
                    id="title"
                    name="title"
                    value={eventData.title}
                    onChange={handleChange}
                    required
                    placeholder="What's this entry about?"
                    autoFocus={mode === 'create'} // Autofocus only when creating
                    disabled={isSubmitting}
                  />
                </div>

                {/* Type Selection */}
                <div className={styles.formGroup}>
                  <label htmlFor="type">Type</label>
                  <select
                    id="type"
                    name="type"
                    value={eventData.type}
                    onChange={handleChange}
                    className={styles.formSelect}
                    disabled={isSubmitting}
                  >
                    <option value="task">Task</option>
                    <option value="event">Event</option>
                  </select>
                </div>

                {/* All Day Checkbox */}
                <div className={`${styles.formGroup} ${styles.checkbox}`}>
                  <input
                    type="checkbox"
                    id="allDay"
                    name="allDay"
                    checked={eventData.allDay}
                    onChange={handleCheckboxChange}
                    disabled={isSubmitting}
                  />
                  <label htmlFor="allDay">All Day</label>
                </div>

                {/* Start/End Date/Time Inputs */}
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="start">
                      {eventData.allDay ? 'Date' : 'Start Date & Time'}
                    </label>
                    <input
                      type={eventData.allDay ? "date" : "datetime-local"} // Change input type based on allDay
                      id="start"
                      name="start"
                      value={eventData.allDay ? formatDateForInput(eventData.start)?.split('T')[0] : formatDateForInput(eventData.start)}
                      onChange={handleDateChange}
                      required
                      disabled={isSubmitting}
                    />
                  </div>

                  {/* Show End Date only if not All Day */}
                  {!eventData.allDay && (
                    <div className={styles.formGroup}>
                      <label htmlFor="end">End Date & Time</label>
                      <input
                        type="datetime-local"
                        id="end"
                        name="end"
                        value={formatDateForInput(eventData.end)}
                        onChange={handleDateChange}
                        required={!eventData.allDay} // Required only if not all day
                        disabled={isSubmitting}
                        min={formatDateForInput(eventData.start)} // Prevent end before start
                      />
                    </div>
                  )}
                </div>

                {/* Priority Selection (Only for Tasks) */}
                {eventData.type === 'task' && (
                  <div className={styles.formGroup}>
                    <label htmlFor="priority">Priority</label>
                    <select
                      id="priority"
                      name="priority"
                      value={eventData.priority || 'medium'} // Default to medium if undefined
                      onChange={handleChange}
                      className={styles.formSelect}
                      disabled={isSubmitting}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                )}

                {/* Description Textarea */}
                <div className={styles.formGroup}>
                  <label htmlFor="description">Description (optional)</label>
                  <textarea
                    id="description"
                    name="description"
                    value={eventData.description || ''}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Add notes or details..."
                    disabled={isSubmitting}
                  />
                </div>
              </form>
            </div>
            
            {/* Action Buttons - Fixed at bottom */}
            <div className={styles.formActions}>
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className={`${styles.btn} ${styles.dangerBtn}`}
                  disabled={isSubmitting || !eventData.id} // Disable if no ID
                >
                  Delete
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                className={`${styles.btn} ${styles.secondaryBtn}`}
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="button" 
                onClick={handleSubmit}
                form="eventForm"
                className={`${styles.btn} ${styles.primaryBtn}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Entry' : 'Update Entry'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default EventModal;