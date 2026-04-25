import { Router } from 'express';
import { authenticate } from '../../middlewares/authenticate';
import { listRetencao, listRetencaoDetalhe } from './retencao.controller';

const router = Router();

router.get('/',        authenticate, listRetencao);
router.get('/detalhe', authenticate, listRetencaoDetalhe);

export default router;
