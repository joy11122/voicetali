import mongoose from "mongoose";

interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};

global.mongooseCache = cached;

function getMongoUri(): string {
  const uri = process.env.MONGODB_URI;

  if (!uri || uri.trim().length === 0) {
    throw new Error(
      "MONGODB_URI is not configured. Add MONGODB_URI to your .env.local file."
    );
  }

  return uri;
}

export async function connectDB(): Promise<typeof mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const mongoUri: string = getMongoUri();

    cached.promise = mongoose.connect(mongoUri, {
      bufferCommands: false,
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;

    console.error("MongoDB connection failed:", error);

    throw new Error(
      `MongoDB connection failed: ${
        error instanceof Error ? error.message : "Unknown database error"
      }`
    );
  }

  return cached.conn;
}

export async function disconnectDB(): Promise<void> {
  if (!cached.conn) {
    return;
  }

  try {
    await mongoose.disconnect();
  } finally {
    cached.conn = null;
    cached.promise = null;
  }
}