import mongoose from "mongoose"

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


const userModel = mongoose.model('user', userSchema);
export default userModel;
