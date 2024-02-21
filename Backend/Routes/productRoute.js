import express from 'express';
const router = express.Router();
import productModel from '../models/Product.js'; 

router.get('/products/categories/:category', async (req, res) => {
  const category = req.params.category;

  try {
    const products = await productModel.find({ categories: category });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default router;
