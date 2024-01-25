import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import { PORT, mongoDBURL } from './config.js';
import userModel from './models/user.js';
import productModel from './models/Product.js';

const app = express();
app.use(express.json());
app.use(bodyParser.json());
app.use(cors({
  origin: 'http://localhost:3000', 
  credentials: true,
}));


mongoose
  .connect(mongoDBURL, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    userModel.createIndexes({ username: 1 }, { unique: true });
    userModel.createIndexes({ email: 1 }, { unique: true });
    console.log('App is connected to the database');
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.log(error);
  });

app.post('/api/register', async (req, res) => {
  try {
    const userData = req.body;

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    const user = new userModel({
      username: userData.username,
      email: userData.email,
      role: userData.role,
      password: hashedPassword,
    });

    const savedUser = await user.save();
    // Multer configuration for handling file uploads
    
    res.status(201).json(savedUser);
  } catch (error) {
    if (error.code === 11000) {
      if (error.keyPattern.username) {
        return res.status(400).json({ error: 'Username already taken' });
      } else if (error.keyPattern.email) {
        return res.status(400).json({ error: 'Email already taken' });
      }
    } else {
      console.error('Error saving user:', error);
      res.status(500).send('Error saving user to the database');
    }
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    console.log('Received credentials:', { email, password });

    const user = await userModel.findOne({ email });

    if (!user) {
      console.log('User not found');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatch = await bcrypt.compare(password, user.password);

    if (!passwordMatch) {
      console.log('Incorrect password');
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    console.log('Login successful');
    res.status(200).json({ message: 'Login successful', user });
  } catch (error) {
    console.error('Error during login:', error);
    res.status(500).send('Error during login');
  }
});
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension); 
  },
});

const upload = multer({ storage: storage });

app.post('/api/products/add', upload.array('photos', 10), async (req, res) => {
  try {
    const productData = req.body;

    const photos = req.files.map(file => file.path);

    const product = new productModel({
      price: productData.price,
      name: productData.name,
      description: productData.description,
      colors: productData.colors,
      materials: productData.materials,
      sizes: productData.sizes,
      photos: photos,
    });

    const savedProduct = await product.save();

    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).send('Error adding product to the database');
  }
});

app.get('/api/products/get', async (req, res) => {
  try {
    const products = await productModel.find({});

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error fetching products from the database' });
  }
});

app.get('/api/products/get', async (req, res) => {
  try {
    const productId = req.params.productId;
    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Error fetching product from the database' });
  }
});

app.get('/', (req, res) => {
  res.status(200).send('Hello, the server is up and running!');
});
