import React, { useState, useEffect } from "react";
import JournalService from "../services/JournalService";
import { JournalEntry, JournalEntryForm } from "../types/types";
import styles from "../styles/Journal.module.css";
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  format,
  parseISO,
  isSameMonth,
  isSameYear,
  startOfMonth,
  getMonth,
  getYear,
} from "date-fns";

const JournalPage: React.FC = () => {
  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<JournalEntryForm>({
    title: "",
    content: "",
  });
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [currentEntryId, setCurrentEntryId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState<boolean>(false);
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(null);
  const [expandedMonths, setExpandedMonths] = useState<{
    [key: string]: boolean;
  }>({});
  const [previewMode, setPreviewMode] = useState<boolean>(false);
  const [showMarkdownHelp, setShowMarkdownHelp] = useState<boolean>(false);

  // Group entries by month and year
  const entriesByMonth = entries.reduce(
    (acc: { [key: string]: JournalEntry[] }, entry) => {
      const date = parseISO(entry.createdAt);
      const monthYear = format(date, "MMMM yyyy");

      if (!acc[monthYear]) {
        acc[monthYear] = [];
      }

      acc[monthYear].push(entry);
      return acc;
    },
    {}
  );

  // Sort months in reverse chronological order
  const sortedMonths = Object.keys(entriesByMonth).sort((a, b) => {
    const dateA = parseISO(entriesByMonth[a][0].createdAt);
    const dateB = parseISO(entriesByMonth[b][0].createdAt);
    return dateB.getTime() - dateA.getTime();
  });

  // Initialize expanded state for all months when entries load
  useEffect(() => {
    if (sortedMonths.length > 0 && Object.keys(expandedMonths).length === 0) {
      const initialExpandedState = sortedMonths.reduce(
        (acc: { [key: string]: boolean }, month) => {
          acc[month] = month === sortedMonths[0]; // Only expand the most recent month
          return acc;
        },
        {}
      );
      setExpandedMonths(initialExpandedState);
    }
  }, [sortedMonths]);

  // Toggle month expansion
  const toggleMonthExpansion = (month: string) => {
    setExpandedMonths((prev) => ({
      ...prev,
      [month]: !prev[month],
    }));
  };

  // Fetch journal entries
  const fetchEntries = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await JournalService.getEntries();
      setEntries(response.data.data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Error loading journal entries");
      console.error("Error fetching journal entries:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, []);

  // Handle form input changes
  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Create new entry
  const handleCreateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setError(null);
      await JournalService.createEntry(formData);
      setFormData({ title: "", content: "" });
      setShowForm(false);
      setPreviewMode(false);
      fetchEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error creating journal entry");
      console.error("Error creating entry:", err);
    }
  };

  // Update existing entry
  const handleUpdateEntry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentEntryId) return;

    try {
      setError(null);
      await JournalService.updateEntry(currentEntryId, formData);
      setFormData({ title: "", content: "" });
      setIsEditing(false);
      setCurrentEntryId(null);
      setSelectedEntry(null);
      setPreviewMode(false);
      fetchEntries();
    } catch (err: any) {
      setError(err.response?.data?.message || "Error updating journal entry");
      console.error("Error updating entry:", err);
    }
  };

  // Delete entry
  const handleDeleteEntry = async (id: string) => {
    if (window.confirm("Are you sure you want to delete this journal entry?")) {
      try {
        setError(null);
        await JournalService.deleteEntry(id);
        if (selectedEntry?._id === id) {
          setSelectedEntry(null);
        }
        fetchEntries();
      } catch (err: any) {
        setError(err.response?.data?.message || "Error deleting journal entry");
        console.error("Error deleting entry:", err);
      }
    }
  };

  // Start editing an entry
  const startEditingEntry = (entry: JournalEntry) => {
    setFormData({
      title: entry.title,
      content: entry.content,
    });
    setCurrentEntryId(entry._id);
    setIsEditing(true);
    setShowForm(true);
    setSelectedEntry(null);
    setPreviewMode(false);
  };

  // Cancel editing/creating
  const handleCancel = () => {
    setFormData({ title: "", content: "" });
    setIsEditing(false);
    setCurrentEntryId(null);
    setShowForm(false);
    setPreviewMode(false);
  };

  // View an entry
  const viewEntry = (entry: JournalEntry) => {
    setSelectedEntry(entry);
  };

  // Close the detailed view
  const closeDetailView = () => {
    setSelectedEntry(null);
  };

  // Format date for display
  const formatDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "MMMM d, yyyy 'at' h:mm a");
  };

  // Format date for grid display
  const formatGridDate = (dateString: string) => {
    const date = parseISO(dateString);
    return format(date, "d");
  };

  // Get entry count per month
  const getEntryCountForMonth = (month: string) => {
    return entriesByMonth[month].length;
  };

  return (
    <div className={styles.journalPage}>
      <header className={styles.journalHeader}>
        <h1>My Journal</h1>
        <p>Record your thoughts, ideas, and reflections</p>

        {!showForm && !selectedEntry && (
          <button
            onClick={() => setShowForm(true)}
            className={styles.createButton}
          >
            New Journal Entry
          </button>
        )}
      </header>

      {/* Error Message */}
      {error && <div className={styles.errorMessage}>{error}</div>}

      {/* Journal Form */}
      {showForm && (
        <div className={styles.formContainer}>
          <h2>{isEditing ? "Edit Entry" : "New Journal Entry"}</h2>
          <form onSubmit={isEditing ? handleUpdateEntry : handleCreateEntry}>
            <div className={styles.formGroup}>
              <label htmlFor="title">Title</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
                placeholder="Enter a title for your entry"
              />
            </div>

            <div className={styles.formGroup}>
              <div className={styles.editorHeader}>
                <label htmlFor="content">Content</label>
                <button 
                  type="button"
                  className={styles.previewToggle}
                  onClick={() => setPreviewMode(!previewMode)}
                >
                  {previewMode ? "Edit" : "Preview"}
                </button>
              </div>
              
              {previewMode ? (
                <div className={`${styles.markdownPreview} ${styles.entryDetailContent}`}>
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {formData.content}
                  </ReactMarkdown>
                </div>
              ) : (
                <textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  required
                  placeholder="What's on your mind today? You can use markdown formatting."
                  rows={8}
                ></textarea>
              )}
            </div>

            <div className={styles.markdownHelp}>
              <button 
                type="button"
                className={styles.helpToggle}
                onClick={() => setShowMarkdownHelp(!showMarkdownHelp)}
              >
                {showMarkdownHelp ? "Hide markdown help" : "Markdown formatting help"}
              </button>
              
              {showMarkdownHelp && (
                <div className={styles.helpContent}>
                  <h4>Basic Markdown Guide:</h4>
                  <div className={styles.markdownExamples}>
                    <div className={styles.exampleRow}>
                      <code># Heading 1</code>
                      <span>Creates a large heading</span>
                    </div>
                    <div className={styles.exampleRow}>
                      <code>## Heading 2</code>
                      <span>Creates a medium heading</span>
                    </div>
                    <div className={styles.exampleRow}>
                      <code>**bold text**</code>
                      <span>Makes text <strong>bold</strong></span>
                    </div>
                    <div className={styles.exampleRow}>
                      <code>*italic text*</code>
                      <span>Makes text <em>italic</em></span>
                    </div>
                    <div className={styles.exampleRow}>
                      <code>[link](https://example.com)</code>
                      <span>Creates a hyperlink</span>
                    </div>
                    <div className={styles.exampleRow}>
                      <code>- item</code>
                      <span>Creates a bullet list</span>
                    </div>
                    <div className={styles.exampleRow}>
                      <code>1. item</code>
                      <span>Creates a numbered list</span>
                    </div>
                    <div className={styles.exampleRow}>
                      <code>```code```</code>
                      <span>Formats text as code</span>
                    </div>
                    <div className={styles.exampleRow}>
                      <code> quote</code>
                      <span>Creates a blockquote</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className={styles.formActions}>
              <button
                type="button"
                onClick={handleCancel}
                className={styles.cancelButton}
              >
                Cancel
              </button>
              <button type="submit" className={styles.submitButton}>
                {isEditing ? "Update Entry" : "Save Entry"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Selected Entry Detail View */}
      {selectedEntry && !showForm && (
        <div className={styles.entryDetailContainer}>
          <div className={styles.entryDetailHeader}>
            <button
              onClick={closeDetailView}
              className={styles.backButton}
              title="Back to all entries"
            >
              ← Back
            </button>
            <div className={styles.entryDetailActions}>
              <button
                onClick={() => startEditingEntry(selectedEntry)}
                className={styles.editButton}
                title="Edit entry"
              >
                ✎
              </button>
              <button
                onClick={() => handleDeleteEntry(selectedEntry._id)}
                className={styles.deleteButton}
                title="Delete entry"
              >
                ✕
              </button>
            </div>
          </div>

          <h2 className={styles.entryDetailTitle}>{selectedEntry.title}</h2>

          <div className={styles.entryMeta}>
            <span className={styles.entryDate}>
              {formatDate(selectedEntry.createdAt)}
            </span>
          </div>

          <div className={styles.entryDetailContent}>
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {selectedEntry.content}
            </ReactMarkdown>
          </div>
        </div>
      )}

      {/* Journal Entries Grid with Collapsible Months */}
      {!showForm && !selectedEntry && (
        <div className={styles.journalGrid}>
          {loading ? (
            <div className={styles.loading}>Loading journal entries...</div>
          ) : entries.length > 0 ? (
            sortedMonths.map((monthYear) => (
              <div key={monthYear} className={styles.monthContainer}>
                <div 
                  className={styles.monthHeaderWrapper}
                  onClick={() => toggleMonthExpansion(monthYear)}
                >
                  <div className={styles.monthHeaderContent}>
                    <h2>{monthYear}</h2>
                    <span className={styles.entryCount}>
                      {getEntryCountForMonth(monthYear)}{" "}
                      {getEntryCountForMonth(monthYear) === 1
                        ? "entry"
                        : "entries"}
                    </span>
                  </div>
                  <div 
                    className={`${styles.chevron} ${
                      expandedMonths[monthYear] ? styles.expanded : ""
                    }`}
                  />
                </div>

                <div 
                  className={`${styles.entriesContainer} ${
                    expandedMonths[monthYear] ? styles.expanded : ""
                  }`}
                >
                  <div className={styles.entriesGrid}>
                    {entriesByMonth[monthYear].map((entry) => (
                      <div
                        key={entry._id}
                        className={styles.entryCard}
                        onClick={() => viewEntry(entry)}
                      >
                        <div className={styles.entryDate}>
                          {formatGridDate(entry.createdAt)}
                        </div>
                        <h3 className={styles.entryCardTitle}>{entry.title}</h3>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.emptyIcon}>📔</div>
              <h3>No journal entries yet</h3>
              <p>
                Create your first journal entry to start reflecting on your day.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default JournalPage;