const express = require('express');
const router = express.Router();
const {
    addDevice,
    getDevices,
    getDeviceById,
    updateDevice,
    deleteDevice,
} = require('../controllers/device.controller');
const {
    authenticate,
    authorizeRoles,
} = require('../middleware/auth.middleware');
const { ROLES } = require('../config/contants');

router.use(authenticate);

/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Add a new device
 *     tags: [Device]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - location
 *             properties:
 *               name:
 *                 type: string
 *                 example: Máy chụp MRI
 *               location:
 *                 type: string
 *                 example: Khoa CDHA
 *     responses:
 *       201:
 *         description: Device added successfully
 *       400:
 *         description: Invalid data
 */
router.post('/', authorizeRoles([ROLES.ADMIN]), addDevice);

/**
 * @swagger
 * /api/devices:
 *   get:
 *     summary: Get all devices
 *     tags: [Device]
 *     responses:
 *       200:
 *         description: List of devices
 */
router.get('/', authorizeRoles([ROLES.ADMIN]), getDevices);

/**
 * @swagger
 * /api/devices/{id}:
 *   get:
 *     summary: Get a device by ID
 *     tags: [Device]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device retrieved successfully
 *       404:
 *         description: Device not found
 */
router.get('/:id', authorizeRoles([ROLES.ADMIN]), getDeviceById);

/**
 * @swagger
 * /api/devices/{id}:
 *   put:
 *     summary: Update a device by ID
 *     tags: [Device]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               location:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device updated successfully
 *       404:
 *         description: Device not found
 */
router.put('/:id', authorizeRoles([ROLES.ADMIN]), updateDevice);

/**
 * @swagger
 * /api/devices/{id}:
 *   delete:
 *     summary: Delete a device by ID
 *     tags: [Device]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Device ID
 *     responses:
 *       200:
 *         description: Device deleted successfully
 *       404:
 *         description: Device not found
 */
router.delete('/:id', authorizeRoles([ROLES.ADMIN]), deleteDevice);

module.exports = router;
