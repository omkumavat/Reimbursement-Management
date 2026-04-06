const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');
const path = require('path');

dotenv.config();

connectDB();

const app = express();

app.use(express.json());
app.use(cors());

// Make uploads folder static
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/users', require('./routes/userRoutes'));
app.use('/api/expenses', require('./routes/expenseRoutes'));
app.use('/api/approvals', require('./routes/approvalRoutes'));
app.use('/api/approval-rules', require('./routes/approvalRuleRoutes'));
app.use('/api/company', require('./routes/companyRoutes'));

app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// app.listen(PORT, console.log(`Server running on port ${PORT}`))
// expor;
export default app;
