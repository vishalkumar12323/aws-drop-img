import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    fileName: String,
    fileKey: String,
    fileUrl: String,
  },
  { timestamps: true }
);

export default mongoose.models.File || mongoose.model("File", fileSchema);
