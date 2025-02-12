// routes/users.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
require('dotenv').config();
const salt = 10;

// Register a new user
router.post('/register', async (req, res) => {
    try {
        const { name, email, password, role , gender } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Create a new user

        const encPassword = await bcrypt.hash(password , salt);
        const newUser = new User({ name, email, password : encPassword, role , gender });
        await newUser.save();

        res.status(201).json({ message: 'User registered successfully', user: newUser });
    } catch (error) {
        res.status(500).json({ message: 'Error registering user', error: error.message });
    }
});

// Login a user

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check if the user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate JWT Token
        const token = jwt.sign(
            { id: user._id , name : user.name , role : user.role},process.env.JWT_SECRET, { expiresIn: '1h' });

        // Remove password before sending the user object
        const { password: _, ...userWithoutPassword } = user.toObject();

        res.status(200).json({ message: 'Login successful', user: userWithoutPassword, token });
    } catch (error) {
        console.error('Login Error:', error);
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});


// Get all users
router.get('/', async (req, res) => {
    try {
        const users = await User.find();
        res.status(200).json(users);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching users', error: error.message });
    }
});

//get doctors

router.get('/find/doctors', async (req, res) => {
    try {
        const doctors = await User.find({ role: 'doctor' }).select('-password'); // Exclude password from response
        res.status(200).json(doctors);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching doctors', error: error.message });
    }
});


// Get a single user by ID
router.get('/:id', async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json(user);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user', error: error.message });
    }
});

// Update a user by ID
router.put('/:id', async (req, res) => {
    try {
        const { name, email, password, role } = req.body;
        const updatedUser = await User.findByIdAndUpdate(
            req.params.id,
            { name, email, password, role },
            { new: true }
        );
        if (!updatedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User updated successfully', user: updatedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error updating user', error: error.message });
        
    }
});

// Delete a user by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedUser = await User.findByIdAndDelete(req.params.id);
        if (!deletedUser) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.status(200).json({ message: 'User deleted successfully', user: deletedUser });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting user', error: error.message });
    }
});

module.exports = router;