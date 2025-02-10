// server.js
const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// MongoDB Connection

mongoose.connect(process.env.DB_URL).then(()=>{
    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`);
    });
}).catch((error) =>{
    console.log(error)
});



// Routes
const userRouter = require('./routes/userRouter')
app.use('/user' , userRouter);
const appointmentRoute = require('./routes/appointmentRoute');
app.use('/appointment' , appointmentRoute);

// Start the server
