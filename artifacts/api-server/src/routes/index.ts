import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysisRouter from "./analysis";
import grammarRouter from "./grammar";
import rootSearchRouter from "./rootSearch";
import thematicSearchRouter from "./thematicSearch";
import tasreefRouter from "./tasreef";
import notesRouter from "./notes";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analysisRouter);
router.use(grammarRouter);
router.use(rootSearchRouter);
router.use(thematicSearchRouter);
router.use(tasreefRouter);
router.use(notesRouter);

export default router;
