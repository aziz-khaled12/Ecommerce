import mongoose from "mongoose"
import argon2 from "argon2"
const userSchema = mongoose.Schema({
    username:{
        type: String,
        required: true,
        unique: true,
    },
    email:{
        type: String,
        required: true,
    },
    password:{
        type: String,
        required: true,
    },    
    role:{
        type: String,
        required: true,
    }
})

userSchema.pre('save', async function (next) {
    if (this.isModified('password')) {
      const hashedPassword = await argon2.hash(this.password, { type: argon2.argon2id });
      this.password = hashedPassword;
    }
    next();
  });

const userModel = mongoose.model('user', userSchema);
export default userModel;
