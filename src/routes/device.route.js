const express = require('express');
const router = express.Router();
const {
    createDevice,
    getDevices,
    getDeviceById,
    updateDevice,
    deleteDevice,
} = require('../controllers/device.controller');

/**
 * @swagger
 * /api/devices:
 *   post:
 *     summary: Create a new device
 *     tags: [Device]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - code
 *               - name
 *             properties:
 *               code:
 *                 type: string
 *                 example: MRI-123
 *               name:
 *                 type: string
 *                 example: Máy chụp cộng hưởng từ
 *     responses:
 *       201:
 *         description: Device created successfully
 *       400:
 *         description: Invalid data
 */
router.post('/', createDevice);

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
router.get('/', getDevices);

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
router.get('/:code', getDeviceById);

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
 *               code:
 *                 type: string
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: Device updated successfully
 *       404:
 *         description: Device not found
 */
router.put('/:id', updateDevice);

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
router.delete('/:id', deleteDevice);

module.exports = router;
