import mongoose from "mongoose";

const jobSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  job_title: String,
  title: String, 
  company_name: String,
  location: String,
  type: String,
  total_candidates: Number,
  invitation_link: String,
  tests: [{ name: String }],
  status: String,
  created_at: Date,
}, { timestamps: true });

export const Job = mongoose.model("Job", jobSchema);
