const shortid = require("shortid")
// const urlValidation = require("url-validation")
const urlModel = require("../Model/urlModel")
const { validUrl } = require("../validator/validation.js")
const redis = require("redis");
const { promisify } = require("util");


//Connect to redis
const redisClient = redis.createClient(
    11480,
    "redis-11480.c212.ap-south-1-1.ec2.cloud.redislabs.com",
    { no_ready_check: true }
);
redisClient.auth("PhvvwtqDaSlZK3eKsULRNFnQoX59yV7V", function (err) {
    if (err) throw err;
});

redisClient.on("connect", async function () {
    console.log("Connected to Redis..");
});

//Connection setup for redis

const SET_ASYNC = promisify(redisClient.SET).bind(redisClient);
const GET_ASYNC = promisify(redisClient.GET).bind(redisClient);
const DEL_ASYNC = promisify(redisClient.DEL).bind(redisClient);
const EXP_ASYNC = promisify(redisClient.EXPIRE).bind(redisClient);



const shortenURL = async function (req, res) {
    try {
        let body = req.body

        // ------------------ Validation part ----------------
        if (Object.keys(body).length == 0) return res.status(400).send({ status: false, message: "please enter url in body" })

        let { longUrl, ...rest } = body;

        if (Object.keys(rest).length > 0) return res.status(400).send({ status: false, message: `You can not fill these:-( ${Object.keys(rest)} ) data ` })

        if (validUrl(longUrl) != true) return res.status(400).send({ status: false, message: `${validUrl(longUrl)}` })


        // ------------------ finding in cache ----------------

        let cachedUrl = await GET_ASYNC(`${longUrl}`)
        if (cachedUrl) {
            return res.status(200).send({ status: true, message: "LongUrl is already present", data: JSON.parse(cachedUrl) })
        }


        // ------------------ finding in DataBase ----------------

        let url_in_DB = await urlModel.findOne({ longUrl: longUrl }).select({ _id: 0, updatedAt: 0, createdAt: 0, __v: 0 })

        if (url_in_DB) {

            await SET_ASYNC(`${longUrl}`, JSON.stringify(url_in_DB))

            return res.status(200).send({ status: true, message: "LongUrl is already present", shortUrl: url_in_DB })
        }

        // ------------------ generating new Short UrlCode in DataBase ----------------

        let urlCode = shortid.generate().toLowerCase()
        let baseurl = "http://localhost:3000/"
        let shortUrl = baseurl + urlCode
        longUrl = longUrl.trim()


        let data = await urlModel.create({ longUrl, shortUrl, urlCode })

        return res.status(201).send({ status: true, data: longUrl, shortUrl, urlCode })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}


const getUrl = async function (req, res) {
    try {

        // ------------------ Validation part ----------------

        let urlCode = req.params.urlCode

        if (!shortid.isValid(urlCode)) {
            return res.status(400).send({ status: false, message: `Invalid urlCode: - ${urlCode}` })
        }


        // ------------------ finding in cache ----------------

        let cachedUrl = await GET_ASYNC(`${req.params.urlCode}`)
        if (cachedUrl) {
            console.log("from cache");
            return res.status(302).redirect(cachedUrl)


        } else {
            // ------------------ finding in DataBase ----------------

            let url = await urlModel.findOne({ urlCode: urlCode })//.select({ longUrl: 1, _id: 0 })
            console.log("from DB")
            if (!url) return res.status(404).send({ status: false, message: `${urlCode} urlCode not found` })

            // ------------------ setting url in cache ----------------
            const setCache = await SET_ASYNC(`${req.params.urlCode}`, JSON.stringify(url.longUrl))

            // ---------- setting expiry time for url in cache --------
            const exp = await EXP_ASYNC(`${req.params.urlCode}`, 30)

            return res.status(302).redirect(url.longUrl)
        }

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}



const deleteUrl = async function (req, res) {
    try {
        let urlCode = req.params.urlCode

        if (!shortid.isValid(urlCode)) {
            return res.status(400).send({ status: false, message: `Invalid urlCode: - ${urlCode}` })
        }

        // ---------- deleting url from cache --------
        let deletedUrl = await DEL_ASYNC(`${urlCode}`)
        if (deletedUrl == 0) return res.send(`no cache found`)
        return res.send(`cache deleted successful`)

    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }
}


module.exports = { shortenURL, getUrl, deleteUrl }