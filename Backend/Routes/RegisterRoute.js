const express = require('express');
import userModel from '../models/user.js';

router.post('/register', async (req, res) => {
  try {
    const { username, email, role, password } = req.body;



    const user = new userModel({
        username: username,
        email: email,
        role: role,
        password: password,
      });
  
      const savedUser = await user.save();

  
    res.status(201).json({ message: 'User registered successfully' });
  } catch (error) {
    console.error('Error registering user:', error);
    if (error.code === 11000) {
      // Handle unique constraint errors (username/email already exists)
      if (error.keyPattern.username) {
        res.status(400).json({ error: 'Username already taken' });
      } else if (error.keyPattern.email) {
        res.status(400).json({ error: 'Email already taken' });
      }
    } else {
      res.status(500).json({ error: 'Error registering user' });
    }
  }
});

export default RegisterRoute;