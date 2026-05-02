import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysisRouter from "./analysis";
import grammarRouter from "./grammar";
import rootSearchRouter from "./rootSearch";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analysisRouter);
router.use(grammarRouter);
router.use(rootSearchRouter);

export default router;
