import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import foodTrucksRouter from './routes/foodTrucks.js';
import placePhotoRouter from './routes/placePhoto.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api/food-trucks', foodTrucksRouter);
app.use('/api/place-photo', placePhotoRouter);

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://0.0.0.0:${PORT}`);
});
