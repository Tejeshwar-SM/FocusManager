import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import styles from '../../styles/calendar/EventModal.module.css';

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

export interface EventData {
  id?: string;
  title: string;
  start: Date | null;
  end: Date | null;
  allDay: boolean;
  description?: string;
  type: 'task' | 'session';
  priority?: 'low' | 'medium' | 'high';
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
  
  const defaultEventData: EventData = {
    title: '',
    start: selectedDate || new Date(),
    end: selectedDate ? new Date(selectedDate.getTime() + 60 * 60 * 1000) : new Date(new Date().getTime() + 60 * 60 * 1000),
    allDay: false,
    description: '',
    type: 'task',
    priority: 'medium'
  };

  const [eventData, setEventData] = useState<EventData>(defaultEventData);

  // Reset form when modal opens or initialData changes
  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setEventData({
          ...initialData,
          // Ensure dates are Date objects
          start: initialData.start ? new Date(initialData.start) : null,
          end: initialData.end ? new Date(initialData.end) : null
        });
      } else {
        setEventData({
          ...defaultEventData,
          start: selectedDate || new Date(),
          end: selectedDate ? new Date(selectedDate.getTime() + 60 * 60 * 1000) : new Date(new Date().getTime() + 60 * 60 * 1000)
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

  // Handle input changes
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setEventData(prev => ({ ...prev, [name]: value }));
  };

  // Handle date input changes
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (value) {
      setEventData(prev => ({ ...prev, [name]: new Date(value) }));
    }
  };

  // Handle checkbox changes
  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, checked } = e.target;
    
    // If setting to all day, adjust the end date as needed
    if (name === 'allDay' && checked) {
      const startDate = eventData.start || new Date();
      // Create date at midnight
      const midnightDate = new Date(startDate);
      midnightDate.setHours(0, 0, 0, 0);
      
      setEventData(prev => ({
        ...prev,
        [name]: checked,
        start: midnightDate,
        end: midnightDate // For all-day events, end is same as start
      }));
    } else {
      setEventData(prev => ({ ...prev, [name]: checked }));
    }
  };

  // Format date for datetime-local input
  const formatDateForInput = (date: Date | null): string => {
    if (!date) return '';
    // Adjust for timezone offset
    const localDate = new Date(date);
    localDate.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return localDate.toISOString().slice(0, 16);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!eventData.title.trim()) {
      setError('Please enter a title for this event');
      return;
    }
    
    if (!eventData.start) {
      setError('Please select a start date and time');
      return;
    }
    
    if (!eventData.allDay && !eventData.end) {
      setError('Please select an end time for this event');
      return;
    }
    
    if (!eventData.allDay && eventData.start && eventData.end && eventData.end <= eventData.start) {
      setError('End time must be after start time');
      return;
    }

    try {
      await onSave(eventData);
    } catch (err) {
      console.error('Error saving event:', err);
      setError('Something went wrong. Please try again.');
    }
  };
  
  // Handle delete event
  const handleDeleteClick = () => {
    setShowDeleteConfirm(true);
  };
  
  const handleConfirmDelete = async () => {
    try {
      await onDelete(eventData);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Something went wrong while deleting. Please try again.');
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className={`${styles.modalBackdrop} ${theme === 'dark' ? styles.darkTheme : ''}`}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={styles.eventModal} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalHeader}>
          <h2>{mode === 'create' ? 'Create New Event' : 'Edit Event'}</h2>
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
            <p>Are you sure you want to delete this event?</p>
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
                {isSubmitting ? 'Deleting...' : 'Delete Event'}
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={eventData.title}
                onChange={handleChange}
                required
                placeholder="What's this event about?"
                autoFocus
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="type">Event Type</label>
              <select
                id="type"
                name="type"
                value={eventData.type}
                onChange={handleChange}
                className={styles.formSelect}
                disabled={isSubmitting}
              >
                <option value="task">Task</option>
                <option value="session">Focus Session</option>
              </select>
            </div>

            <div className={`${styles.formGroup} ${styles.checkbox}`}>
              <input
                type="checkbox"
                id="allDay"
                name="allDay"
                checked={eventData.allDay}
                onChange={handleCheckboxChange}
                disabled={isSubmitting}
              />
              <label htmlFor="allDay">All Day Event</label>
            </div>

            <div className={styles.formRow}>
              <div className={styles.formGroup}>
                <label htmlFor="start">Start Date & Time</label>
                <input
                  type="datetime-local"
                  id="start"
                  name="start"
                  value={formatDateForInput(eventData.start)}
                  onChange={handleDateChange}
                  required
                  disabled={isSubmitting}
                />
              </div>

              {!eventData.allDay && (
                <div className={styles.formGroup}>
                  <label htmlFor="end">End Date & Time</label>
                  <input
                    type="datetime-local"
                    id="end"
                    name="end"
                    value={formatDateForInput(eventData.end)}
                    onChange={handleDateChange}
                    required
                    disabled={isSubmitting}
                  />
                </div>
              )}
            </div>

            {eventData.type === 'task' && (
              <div className={styles.formGroup}>
                <label htmlFor="priority">Priority</label>
                <select
                  id="priority"
                  name="priority"
                  value={eventData.priority}
                  onChange={handleChange}
                  className={styles.formSelect}
                  disabled={isSubmitting}
                >
                  <option value="low">Low Priority</option>
                  <option value="medium">Medium Priority</option>
                  <option value="high">High Priority</option>
                </select>
              </div>
            )}

            <div className={styles.formGroup}>
              <label htmlFor="description">Description (optional)</label>
              <textarea
                id="description"
                name="description"
                value={eventData.description || ''}
                onChange={handleChange}
                rows={3}
                placeholder="Add notes or details about this event"
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formActions}>
              {mode === 'edit' && (
                <button
                  type="button"
                  onClick={handleDeleteClick}
                  className={`${styles.btn} ${styles.dangerBtn}`}
                  disabled={isSubmitting}
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
                type="submit" 
                className={`${styles.btn} ${styles.primaryBtn}`}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Saving...' : mode === 'create' ? 'Create Event' : 'Update Event'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default EventModal;