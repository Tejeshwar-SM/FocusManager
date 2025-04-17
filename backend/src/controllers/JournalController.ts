import { Request, Response } from "express";
import mongoose from "mongoose";
import Journal from "../models/Journal";

// Get all journal entries for the current user
export const getJournalEntries = async (req: Request, res: Response): Promise<void> => {
  try {
    const entries = await Journal.find({ user: req.user?.id })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      data: entries
    });
  } catch (error) {
    console.error("Error fetching journal entries:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Get a single journal entry
export const getJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Journal.findOne({
      _id: req.params.id,
      user: req.user?.id
    });

    if (!entry) {
      res.status(404).json({ success: false, message: "Journal entry not found" });
      return;
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error("Error fetching journal entry:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Create a new journal entry
export const createJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;

    if (!title || !content) {
      res.status(400).json({ success: false, message: "Title and content are required" });
      return;
    }

    const entry = await Journal.create({
      user: req.user?.id,
      title,
      content
    });

    res.status(201).json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error("Error creating journal entry:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Update a journal entry
export const updateJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, content } = req.body;
    
    const entry = await Journal.findOneAndUpdate(
      { _id: req.params.id, user: req.user?.id },
      { title, content },
      { new: true, runValidators: true }
    );

    if (!entry) {
      res.status(404).json({ success: false, message: "Journal entry not found" });
      return;
    }

    res.json({
      success: true,
      data: entry
    });
  } catch (error) {
    console.error("Error updating journal entry:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Delete a journal entry
export const deleteJournalEntry = async (req: Request, res: Response): Promise<void> => {
  try {
    const entry = await Journal.findOneAndDelete({
      _id: req.params.id,
      user: req.user?.id
    });

    if (!entry) {
      res.status(404).json({ success: false, message: "Journal entry not found" });
      return;
    }

    res.json({
      success: true,
      data: {}
    });
  } catch (error) {
    console.error("Error deleting journal entry:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};