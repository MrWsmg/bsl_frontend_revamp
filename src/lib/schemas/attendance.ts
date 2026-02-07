import { z } from "zod";

// Attendance Check-In Schema
export const attendanceCheckInSchema = z.object({
  farm_id: z.string().min(1, "Please select a farm"),
  worker_id: z.string().min(1, "Please select a worker"),
});

export type AttendanceCheckInFormData = z.infer<typeof attendanceCheckInSchema>;
