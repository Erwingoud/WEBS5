import mongoose, { HydratedDocument, Model } from "mongoose";
import bcrypt from "bcrypt";
import type { PublicUser, UserRole } from "@photo-prestiges/common";

export interface UserAttrs {
  email: string;
  username: string;
  password: string;
  role: UserRole;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserMethods {
  comparePassword(candidatePassword: string): Promise<boolean>;
  toPublic(): PublicUser;
}

export interface UserModel extends Model<UserAttrs, {}, UserMethods> {
  findByEmail(
    email: string,
  ): Promise<HydratedDocument<UserAttrs, UserMethods> | null>;
}

const userSchema = new mongoose.Schema<UserAttrs, UserModel, UserMethods>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email address"],
    },
    username: {
      type: String,
      required: [true, "Username is required"],
      unique: true,
      trim: true,
      minlength: [2, "Username must be at least 2 characters"],
      maxlength: [30, "Username must be at most 30 characters"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
    },
    role: {
      type: String,
      enum: ["owner", "participant"],
      required: [true, "Role is required"],
    },
  },
  {
    timestamps: true,
  },
);

userSchema.method(
  "comparePassword",
  function comparePassword(candidatePassword: string) {
    return bcrypt.compare(candidatePassword, this.password);
  },
);

userSchema.method("toPublic", function toPublic() {
  return {
    id: this._id.toString(),
    email: this.email,
    username: this.username,
    role: this.role,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
});

userSchema.static("findByEmail", function findByEmail(email: string) {
  return this.findOne({ email: email.toLowerCase().trim() });
});

userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

export const User = mongoose.model<UserAttrs, UserModel>("User", userSchema);
