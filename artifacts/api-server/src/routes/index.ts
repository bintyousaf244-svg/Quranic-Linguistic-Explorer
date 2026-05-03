import { Router, type IRouter } from "express";
import healthRouter from "./health";
import analysisRouter from "./analysis";
import grammarRouter from "./grammar";
import rootSearchRouter from "./rootSearch";
import thematicSearchRouter from "./thematicSearch";
import tasreefRouter from "./tasreef";
import notesRouter from "./notes";
import bookmarksRouter from "./bookmarks";
import tafseerProxyRouter from "./tafseerProxy";
import wordLookupRouter from "./wordLookup";
import arabicChatRouter from "./arabicChat";

const router: IRouter = Router();

router.use(healthRouter);
router.use(analysisRouter);
router.use(grammarRouter);
router.use(rootSearchRouter);
router.use(thematicSearchRouter);
router.use(tasreefRouter);
router.use(notesRouter);
router.use(bookmarksRouter);
router.use(tafseerProxyRouter);
router.use(wordLookupRouter);
router.use(arabicChatRouter);

export default router;
