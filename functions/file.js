import AWS from "aws-sdk";
import File from "../models/File";
import { connectDB } from "../utils/database";
import { verifyToken } from "../utils/auth-middleware";

const s3 = AWS.S3();

export const handler = async (event) => {
  try {
    await connectDB();

    const user = verifyToken(event.headers);

    // Upload files
    if (event.httpMethod === "POST" && event.path.endsWith("upload")) {
      const body = JSON.parse(event.body);
      const buffer = Buffer.from(body.fileContent, "base64");

      const key = `${Date.now()}-${body.fileName}`;
      const params = {
        Bucket: process.env.S3_BUCKET,
        Key: key,
        Body: buffer,
      };
      const data = await s3.upload(params).promise();

      const fileDoc = await File.create({
        userId: user.id,
        fileName: body.fileName,
        fileKey: key,
        fileUrl: data.Location,
      });

      return { statusCode: 200, body: JSON.stringify(fileDoc) };
    }

    // List files
    if (event.httpMethod === "GET" && event.path.endsWith("files")) {
      const files = await File.find({ userId: user.id });
      return { statusCode: 200, body: JSON.stringify(files) };
    }

    // Delete files
    if (event.httpMethod === "DELETE") {
      const { id } = event.pathParameters;
      const file = await File.findById(id);
      if (!file) return { statusCode: 404, body: "File not found" };

      await s3
        .deleteObject({ Bucket: process.env.S3_BUCKET, Key: file.fileKey })
        .promise();
      await file.deleteOne();
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "File deleted" }),
      };
    }

    return { statusCode: 400, body: "Invalid request" };
  } catch (error) {
    console.log("file handler err: ", error);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};
