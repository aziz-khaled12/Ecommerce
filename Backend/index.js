import express from 'express';
import mongoose from 'mongoose';
import bodyParser from 'body-parser';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { JWT_SECRET, PORT, mongoDBURL } from './config.js';
import userModel from './models/user.js';
import productModel from './models/Product.js';
import  argon2  from 'argon2';
import jwt from 'jsonwebtoken';
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
  
      const user = new userModel({
        username: userData.username,
        email: userData.email,
        role: userData.role,
        password: userData.password,
      });
  
      const savedUser = await user.save();
  
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
      if (!email || !password) {
        return res.status(400).json({ error: 'Email and password are required' });
      }
      const user = await userModel.findOne({ email });
      if (!user) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const passwordMatch = await argon2.verify(user.password, password);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }
      const token = jwt.sign({ userId: user._id, role: user.role }, JWT_SECRET, { expiresIn: '1h' });
      res.status(200).json({ message: 'Login successful', token});
    } catch (error) {
      console.error('Error during login:', error);
      res.status(500).json({ error: 'Error during login' });
    }
  });
  

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const extension = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + extension);
  },
});

const upload = multer({ storage: storage });
const __filename = new URL(import.meta.url).pathname;
const __dirname = path.dirname(__filename);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/api/profile', authenticateUser, (req, res) => {
  res.status(200).json({ user: req.user });
});

// Middleware to authenticate user
function authenticateUser(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  const decodedToken = jwt.decode(token);

  console.log(decodedToken);

  if (!token) {
    return res.status(401).json({ error: 'Authentication required - No token provided' });
  }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      console.error('Error authenticating user:', error);
      return res.status(401).json({ error: 'Invalid token' });
    } else if (error.name === 'TokenExpiredError') {
      console.error('Error authenticating user:', error);
      return res.status(401).json({ error: 'Token expired' });
    } else {
      console.error('Error authenticating user:', error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }
}


app.post('/products', authenticateUser, upload.array('photos'), async (req, res) => {
  try {
    console.log(req.user.role)
    if (req.user.role !== 'seller') {
      return res.status(403).json({ error: 'Only sellers are allowed to add products' });
    }
    
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
      categories: productData.categories,
    });
    const savedProduct = await product.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    console.error('Error adding product:', error);
    res.status(500).send('Error adding product to the database');
  }
});


app.get('/products', async (req, res) => {
  try {
    const products = await productModel.find({});

    res.status(200).json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error fetching products from the database' });
  }
});

app.get('/products/:productId', async (req, res) => {
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

app.get('/sellers', async (req, res) => {
  try {
    const users = await userModel.find({role: 'seller'});

    res.status(200).json(users);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Error fetching users from the database' });
  }
});

app.get('/products/categories/:category', async (req, res) => {
  const category = req.params.category;

  try {
    const products1 = await productModel.find({ categories: category });
    res.status(200).json(products1);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.post('/logout', (req, res) => {
  try {
    console.log('User logged out successfully');

    res.status(200).json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Error during logout:', error);
    res.status(500).json({ error: 'Error during logout' });
  }
});



app.get('/', (req, res) => {
  res.status(200).send('Hello, the server is up and running!');
});
