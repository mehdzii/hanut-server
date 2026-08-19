import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' }));

const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/hanut_db';

// Connect to MongoDB Atlas
mongoose
  .connect(MONGODB_URI)
  .then(() => console.log('✅ Connected to MongoDB Atlas Cloud Database!'))
  .catch((err) => console.error('❌ MongoDB Connection Error:', err));

// 1. Product Schema
const ProductSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  name_ar: String,
  price: Number,
  category: String,
  image_url: String,
  stock_quantity: Number,
  times_sold_total: Number,
  times_sold_recent: Number,
  created_at: String
}, { timestamps: true });

// 2. Customer Schema
const CustomerSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: String,
  phone: String,
  total_owed: Number,
  created_at: String,
  last_activity: String
}, { timestamps: true });

// 3. Sale Schema
const SaleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  items: Array,
  total_amount: Number,
  payment_method: String,
  customer_id: String,
  customer_name: String,
  created_at: String
}, { timestamps: true });

// 4. Credit Payment Schema
const CreditPaymentSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  customer_id: String,
  amount: Number,
  created_at: String,
  notes: String
}, { timestamps: true });

const ProductModel = mongoose.model('Product', ProductSchema);
const CustomerModel = mongoose.model('Customer', CustomerSchema);
const SaleModel = mongoose.model('Sale', SaleSchema);
const CreditPaymentModel = mongoose.model('CreditPayment', CreditPaymentSchema);

// --- API ROUTES ---

// Health Check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Hanut MongoDB Cloud API is Running! 🚀' });
});

// Products Routes
app.get('/api/products', async (req, res) => {
  const products = await ProductModel.find();
  res.json(products);
});

app.post('/api/products', async (req, res) => {
  const productData = req.body;
  const updated = await ProductModel.findOneAndUpdate(
    { id: productData.id },
    productData,
    { upsert: true, new: true }
  );
  res.json(updated);
});

// Customers Routes
app.get('/api/customers', async (req, res) => {
  const customers = await CustomerModel.find();
  res.json(customers);
});

app.post('/api/customers', async (req, res) => {
  const custData = req.body;
  const updated = await CustomerModel.findOneAndUpdate(
    { id: custData.id },
    custData,
    { upsert: true, new: true }
  );
  res.json(updated);
});

// Sales Routes
app.get('/api/sales', async (req, res) => {
  const sales = await SaleModel.find().sort({ created_at: -1 });
  res.json(sales);
});

app.post('/api/sales', async (req, res) => {
  const saleData = req.body;
  const updated = await SaleModel.findOneAndUpdate(
    { id: saleData.id },
    saleData,
    { upsert: true, new: true }
  );
  res.json(updated);
});

// Full Bulk Sync Route (From PWA IndexedDB to MongoDB Atlas)
app.post('/api/sync', async (req, res) => {
  try {
    const { products, customers, sales, credit_payments } = req.body;

    if (products && Array.isArray(products)) {
      for (const p of products) {
        await ProductModel.findOneAndUpdate({ id: p.id }, p, { upsert: true });
      }
    }

    if (customers && Array.isArray(customers)) {
      for (const c of customers) {
        await CustomerModel.findOneAndUpdate({ id: c.id }, c, { upsert: true });
      }
    }

    if (sales && Array.isArray(sales)) {
      for (const s of sales) {
        await SaleModel.findOneAndUpdate({ id: s.id }, s, { upsert: true });
      }
    }

    if (credit_payments && Array.isArray(credit_payments)) {
      for (const cp of credit_payments) {
        await CreditPaymentModel.findOneAndUpdate({ id: cp.id }, cp, { upsert: true });
      }
    }

    res.json({ success: true, message: 'Full shop database synced with MongoDB Atlas Cloud! ☁️' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Hanut MongoDB Backend Server running on http://localhost:${PORT}`);
});
