import express from 'express';
import userModel from '../models/user.js'; 

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await userModel.findOne({ email });
    if (!user) {
      return res.status(401).json({ error: 'Invalid email' });
    }

    const passwordMatch = await user.comparePassword(password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Invalid password' });
    }

    const jwtToken = jwt.sign({
        id: user._id, email: user.email, usrname: user.username
      },
      process.env.JWT_SECRET
      );
    res.status(200).json({ message: 'Login successful', token: jwtToken });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).json({ error: 'Error during login' });
  }
});

export default LoginRouter;
