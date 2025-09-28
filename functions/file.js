import AWS from "aws-sdk";
import { client } from "../utils/database";
import { verifyToken } from "../utils/auth-middleware";

const s3 = AWS.S3();

export const handler = async (event) => {
  try {
    await client.connect();

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

      const query = `
        INSERT INTO files(userId, fileName, fileKey, fileUrl)
        VALUES ($1, $2, $3, $4)
        RETURNING *;
      `;
      const fileDoc = await client.query(query, [
        user.id,
        body.fileName,
        body.fileKey,
        data.Location,
      ]);

      return { statusCode: 200, body: JSON.stringify(fileDoc.rows[0]) };
    }

    // List files
    if (event.httpMethod === "GET" && event.path.endsWith("files")) {
      const query = `
        SELECT * FROM files
        WHERE userId = $1;
      `;
      const files = await client.query(query, [user.id]);
      return { statusCode: 200, body: JSON.stringify(files.rows[0]) };
    }

    // Delete files
    if (event.httpMethod === "DELETE") {
      const { id } = event.pathParameters;

      const query = `SELECT * FROM files WHERE id = $1;`;
      const file = await client.query(query, [id]);
      if (!file) return { statusCode: 404, body: "File not found" };

      await s3
        .deleteObject({ Bucket: process.env.S3_BUCKET, Key: file.fileKey })
        .promise();

      const deleteQuery = `
        DELETE FROM files
        WHERE id = $1;
      `;
      await client.query(deleteQuery, [id]);
      return {
        statusCode: 200,
        body: JSON.stringify({ message: "File deleted" }),
      };
    }

    return { statusCode: 400, body: "Invalid request" };
  } catch (error) {
    console.log("file handler err: ", error);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  } finally {
    await client.end();
  }
};
