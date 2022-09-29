const express = require('express');
const router = express.Router();
const { shortenURL, getUrl } = require("../controllers/urlController.js")



router.post("/url/shorten", shortenURL)
router.get("/:urlCode", getUrl)



module.exports = router;