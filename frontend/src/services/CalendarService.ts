import api from "./api";
import { AxiosResponse } from "axios";
import { CalendarEntryType, TaskPriority, Task } from "../types/types";

// Define the payload type for task/event operations
interface TaskEventPayload {
  title: string;
  description?: string;
  type: CalendarEntryType;  // Using enum for type safety
  start: Date | string;
  end?: Date | string;
  allDay?: boolean;
  priority?: TaskPriority;
  status?: string;
  estimatedTime?: number;
}

interface CalendarResponse {
  success: boolean;
  data: Task[] | { tasks?: Task[], events?: Task[] };
  message?: string;
}

// Simple cache to reduce redundant requests
const requestCache: Record<string, { data: any; timestamp: number }> = {};
const CACHE_TTL = 30000; // 30 seconds cache

const CalendarService = {
  // Get all tasks and events in a date range
  getCalendarEntries: async (
    start: Date,
    end: Date,
    forceRefresh: boolean = false // Add forceRefresh parameter
  ): Promise<AxiosResponse<CalendarResponse> | { data: CalendarResponse }> => {
    try {
      const startStr = start.toISOString();
      const endStr = end.toISOString();
      const cacheKey = `calendar_${startStr}_${endStr}`;

      // Check cache only if forceRefresh is false
      const now = Date.now();
      if (!forceRefresh && requestCache[cacheKey] && now - requestCache[cacheKey].timestamp < CACHE_TTL) {
        console.log(`CalendarService: Returning cached data for ${cacheKey}`);
        return {
          data: {
            success: true,
            data: requestCache[cacheKey].data
          }
        };
      }

      console.log(`CalendarService: Fetching fresh data for ${cacheKey} (forceRefresh: ${forceRefresh})`);
      const response = await api.get<CalendarResponse>("/tasks", {
        params: {
          start: startStr,
          end: endStr
        },
        // Add cache-busting headers if needed, though usually handled by backend/browser
        // headers: {
        //   'Cache-Control': 'no-cache',
        //   'Pragma': 'no-cache',
        //   'Expires': '0',
        // }
      });

      // Cache the response data if successful
      if (response.data && response.data.success && response.data.data) {
        console.log(`CalendarService: Caching data for ${cacheKey}`);
        requestCache[cacheKey] = {
          data: response.data.data,
          timestamp: now
        };
      } else if (response.data && !response.data.success) {
         console.warn(`CalendarService: API call failed, not caching. Message: ${response.data.message}`);
      }

      // Ensure the response has a success flag (might be redundant if backend always provides it)
      if (response.data && !response.data.hasOwnProperty('success')) {
        response.data.success = true; // Assume success if not specified and no error thrown
      }

      return response;
    } catch (error: any) {
      console.error("Error in getCalendarEntries:", error);
      // Return properly formatted error response
      return {
        data: {
          success: false,
          data: [],
          message: error.response?.data?.message || error.message || "Failed to fetch calendar data"
        }
      };
    }
  },

  // Alias for getCalendarEntries, passing forceRefresh through
  getEvents: async (
    start: Date,
    end: Date,
    forceRefresh: boolean = false // Add forceRefresh parameter
  ): Promise<AxiosResponse<CalendarResponse> | { data: CalendarResponse }> => {
    try {
      // Pass forceRefresh to the underlying function
      return await CalendarService.getCalendarEntries(start, end, forceRefresh);
    } catch (error: any) {
      console.error("Error fetching calendar events:", error);
      // Return a properly formatted error response
      return {
        data: {
          success: false,
          data: [],
          message: error.response?.data?.message || error.message || "Failed to fetch calendar events"
        }
      };
    }
  },

  // Get a single entry by ID - typically not cached or cache cleared on mutation
  getEntry: (id: string): Promise<AxiosResponse> => {
    return api.get(`/tasks/${id}`);
  },

  // Create a new task or event
  createTaskEvent: (entryData: TaskEventPayload): Promise<AxiosResponse> => {
    const dataToSend = { ...entryData };
    if (!dataToSend.start) dataToSend.start = new Date();
    if (dataToSend.type === CalendarEntryType.TASK && !dataToSend.priority) {
      dataToSend.priority = TaskPriority.MEDIUM;
    }

    console.log('CalendarService: Creating calendar entry with data:', dataToSend);
    return api.post("/tasks", dataToSend)
      .then(response => {
        CalendarService.clearCache(); // Clear cache after successful creation
        return response;
      })
      .catch(error => {
        console.error("Error creating calendar entry:", error);
        throw error; // Re-throw to be handled by the caller
      });
  },

  // Update an existing task or event
  updateTaskEvent: (id: string, entryData: Partial<TaskEventPayload>): Promise<AxiosResponse> => {
    const dataToSend = { ...entryData };
    // Ensure required fields like type/start are included if necessary for backend validation
    // Or fetch the existing task first to merge if backend doesn't support partial updates well

    console.log(`CalendarService: Updating calendar entry ${id} with data:`, dataToSend);
    return api.put(`/tasks/${id}`, dataToSend)
      .then(response => {
        CalendarService.clearCache(); // Clear cache after successful update
        return response;
      })
      .catch(error => {
        console.error(`Error updating calendar entry ${id}:`, error);
        throw error; // Re-throw
      });
  },

  // Delete a task or event
  deleteTaskEvent: (id: string): Promise<AxiosResponse> => {
    console.log(`CalendarService: Deleting calendar entry ${id}`);
    return api.delete(`/tasks/${id}`)
      .then(response => {
        CalendarService.clearCache(); // Clear cache after successful deletion
        return response;
      })
      .catch(error => {
        console.error(`Error deleting calendar entry ${id}:`, error);
        throw error; // Re-throw
      });
  },

  // Helper method to clear the entire cache
  clearCache: (): void => {
    console.log("CalendarService: Clearing request cache.");
    Object.keys(requestCache).forEach(key => delete requestCache[key]);
  }
};

export default CalendarService;