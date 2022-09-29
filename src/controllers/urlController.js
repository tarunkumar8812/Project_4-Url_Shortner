const shortid = require("shortid")
const urlValidation = require("url-validation")
const urlModel = require("../Model/urlModel")



const validUrl = function (value) {
    if (value == undefined) { return "Url is mandatory" }
    if (typeof value !== "string") { return "Url must be in string" }
    if (value.trim() == "") { return "Url can not be empty" }
    // return value.toLowerCase().trim()
    if (!urlValidation(value)) { return "Invalid URL" }
    return true
}



const shortenURL = async function (req, res) {
    try {
        let body = req.body

        if (Object.keys(body).length == 0) return res.status(400).send({ status: false, message: "please enter url in body" })

        let { originalUrl, ...rest } = body;

        if (Object.keys(rest).length > 0) return res.status(400).send({ status: false, message: `You can not fill these:-( ${Object.keys(rest)} ) data ` })


        if (validUrl(originalUrl) != true) return res.status(400).send({ status: false, message: `${validUrl(originalUrl)}` })
        if (!urlValidation(originalUrl)) return res.status(400).send({ status: false, message: "please enter valid url" })


        let url_in_DB = await urlModel.findOne({ longUrl: originalUrl }).select({ _id: 0, updatedAt: 0, createdAt: 0, __v: 0 })
        if (url_in_DB) return res.status(409).send({ status: false, message: "URL is already present", shortUrl: url_in_DB.urlCode })


        let urlCode = shortid.generate().toLowerCase()

        let baseurl = "http://localhost:3000/"
        let shortUrl = baseurl + urlCode
        let longUrl = originalUrl.trim()


        let data = await urlModel.create({ longUrl, shortUrl, urlCode })
        // return res.redirect('/facebook.com')
        return res.status(201).send({ status: false, message: "successfully created", data: data })

    }
    catch (err) {
        return res.status(500).send({ status: false, message: err.message })
    }

}


const getUrl = async function (req, res) {
    try {

        let urlCode = req.params.urlCode

        if (!shortid.isValid(urlCode)) return res.status(400).send({ status: false, message: `Invalid urlCode: - ${urlCode}` })
        let url = await urlModel.findOne({ urlCode: urlCode }).select({ longUrl: 1, _id: 0 })
        if (!url) return res.status(404).send({ status: false, message: `${urlCode} urlCode not found` })

        return res.status(302).send({ status: true, message: url })



    } catch (err) {
        return res.status(500).send({ status: false, message: err.message })

    }
}




module.exports = { shortenURL, getUrl }