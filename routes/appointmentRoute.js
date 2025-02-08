const express = require('express');
const Appointment = require('../models/Appointment');
const User = require('../models/User');
const { authenticateUser } = require('../middlewares/auth'); 

const router = express.Router();

/**
 * @route   POST /appointments
 * @desc    Book an appointment (Patient)
 * @access  Private (Only Patients)
 */
router.post('/', authenticateUser, async (req, res) => {
    try {
        const { doctorId, date, time, reason } = req.body;
        
        
        if (req.user.role !== 'patient') {
            return res.status(403).json({ message: 'Only patients can book appointments' });
        }

        
        const doctor = await User.findById(doctorId);
        if (!doctor || doctor.role !== 'doctor') {
            return res.status(404).json({ message: 'Doctor not found' });
        }


        const appointment = new Appointment({
            patient: req.user.id,
            doctor: doctorId,
            date,
            time,
            reason,
            status: 'pending',
        });

        await appointment.save();
        res.status(201).json({ message: 'Appointment booked successfully', appointment });
    } catch (error) {
        res.status(500).json({ message: 'Error booking appointment', error: error.message });
    }
});

/**
 * @route   GET /appointments
 * @desc    Get all appointments (Admin)
 * @access  Private (Only Admin)
 */
router.get('/', authenticateUser, async (req, res) => {
    try {
        if (req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Admins only' });
        }

        const appointments = await Appointment.find()
            .populate('patient', 'name email')
            .populate('doctor', 'name email');
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching appointments', error: error.message });
    }
});

/**
 * @route   GET /appointments/doctor
 * @desc    Get all appointments for the logged-in doctor
 * @access  Private (Only Doctor)
 */
router.get('/doctor', authenticateUser, async (req, res) => {
    try {
        if (req.user.role !== 'doctor') {
            return res.status(403).json({ message: 'Access denied. Doctors only' });
        }

        const appointments = await Appointment.find({ doctor: req.user.id })
            .populate('patient', 'name email');
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching doctor appointments', error: error.message });
    }
});

/**
 * @route   GET /appointments/patient
 * @desc    Get all appointments for the logged-in patient
 * @access  Private (Only Patient)
 */
router.get('/patient', authenticateUser, async (req, res) => {
    try {
        if (req.user.role !== 'patient') {
            return res.status(403).json({ message: 'Access denied. Patients only' });
        }

        const appointments = await Appointment.find({ patient: req.user.id })
            .populate('doctor', 'name email');
        res.status(200).json(appointments);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching patient appointments', error: error.message });
    }
});

/**
 * @route   PUT /appointments/:id
 * @desc    Update appointment status (Doctor or Admin)
 * @access  Private (Doctor/Admin)
 */
router.put('/:id', authenticateUser, async (req, res) => {
    try {
        const { status } = req.body;

        // Ensure only doctors or admins can update appointments
        if (req.user.role !== 'doctor' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied. Only doctors or admins can update appointments' });
        }

        let appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Ensure doctors can only update their own appointments
        if (req.user.role === 'doctor' && appointment.doctor.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied. You can only update your own appointments' });
        }

        appointment.status = status;
        await appointment.save();

        res.status(200).json({ message: 'Appointment status updated', appointment });
    } catch (error) {
        res.status(500).json({ message: 'Error updating appointment', error: error.message });
    }
});

/**
 * @route   DELETE /appointments/:id
 * @desc    Cancel an appointment (Patient or Admin)
 * @access  Private (Patient/Admin)
 */
router.delete('/:id', authenticateUser, async (req, res) => {
    try {
        let appointment = await Appointment.findById(req.params.id);
        if (!appointment) {
            return res.status(404).json({ message: 'Appointment not found' });
        }

        // Patients can only delete their own appointments
        if (req.user.role === 'patient' && appointment.patient.toString() !== req.user.id) {
            return res.status(403).json({ message: 'Access denied. You can only cancel your own appointments' });
        }

        // Admins can delete any appointment
        if (req.user.role !== 'patient' && req.user.role !== 'admin') {
            return res.status(403).json({ message: 'Access denied' });
        }

        await appointment.deleteOne();
        res.status(200).json({ message: 'Appointment canceled successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Error canceling appointment', error: error.message });
    }
});

module.exports = router;
