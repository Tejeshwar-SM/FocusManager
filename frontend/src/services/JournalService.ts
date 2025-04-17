import api from "./api";

const JournalService = {
  // Get all journal entries
  getEntries: () => {
    return api.get("/journal");
  },

  // Get a specific journal entry by ID
  getEntry: (id: string) => {
    return api.get(`/journal/${id}`);
  },

  // Create a new journal entry
  createEntry: (data: { title: string; content: string }) => {
    return api.post("/journal", data);
  },

  // Update an existing journal entry
  updateEntry: (id: string, data: { title: string; content: string }) => {
    return api.put(`/journal/${id}`, data);
  },

  // Delete a journal entry
  deleteEntry: (id: string) => {
    return api.delete(`/journal/${id}`);
  }
};

export default JournalService;