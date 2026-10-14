import express from 'express';
import {
  getEmployees,
  getAllEmployeesList,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
} from '../controllers/employeeController.js';

import { validateRequest } from '../middlewares/validateRequest.js';

import {
  createEmployeeSchema,
  updateEmployeeSchema,
} from '../validators/employeeValidator.js';

const router = express.Router();

router.get('/', getEmployees);
router.get('/all', getAllEmployeesList);
router.get('/:id', getEmployeeById);
router.post('/', validateRequest(createEmployeeSchema), createEmployee);
router.put('/:id', validateRequest(updateEmployeeSchema), updateEmployee);
router.delete('/:id', deleteEmployee);

export default router;
