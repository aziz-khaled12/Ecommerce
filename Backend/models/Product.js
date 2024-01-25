
import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  price: { type: Number, required: true },
  name: { type: String, required: true },
  description: { type: String, required: true },
  colors: { type: [String], required: true },
  materials: { type: String, required: true },
  sizes: { type: String, required: true },
  photos: { type: [String], required: true },
});

const Product = mongoose.model('Product', productSchema);

export default Product;
