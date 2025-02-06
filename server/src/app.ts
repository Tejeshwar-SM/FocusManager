import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import connectDB from './config/db';
import authRoutes from './routes/authRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

//Middleware
app.use(cors());
app.use(express.json());

//connect to MongoDB
connectDB();

//routing
app.use('/api/auth', authRoutes);

app.get('/', (req,res) => {
    res.send('The API is running');
});

app.listen(PORT, ()=> {
    console.log(`Server is running onnnnnnn... port ${PORT}`);
})

