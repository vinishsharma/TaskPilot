import express from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  updateTaskStatus,
  deleteTask,
  exportTasksCSV,
} from '../controllers/taskController.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
  createTaskSchema,
  updateTaskSchema,
  updateTaskStatusSchema,
} from '../validators/taskValidator.js';

const router = express.Router();

router.get('/', getTasks);
router.get('/export', exportTasksCSV);
router.get('/:id', getTaskById);
router.post('/', validateRequest(createTaskSchema), createTask);
router.put('/:id', validateRequest(updateTaskSchema), updateTask);
router.put(
  '/:id/status',
  validateRequest(updateTaskStatusSchema),
  updateTaskStatus
);
router.delete('/:id', deleteTask);

export default router;
