import express from "express";
import { protect } from "../middleware/Authentication";
import {
  getJournalEntries,
  getJournalEntry,
  createJournalEntry,
  updateJournalEntry,
  deleteJournalEntry
} from "../controllers/JournalController";

const router = express.Router();

router.route("/")
  .get(protect, getJournalEntries)
  .post(protect, createJournalEntry);

router.route("/:id")
  .get(protect, getJournalEntry)
  .put(protect, updateJournalEntry)
  .delete(protect, deleteJournalEntry);

export default router;