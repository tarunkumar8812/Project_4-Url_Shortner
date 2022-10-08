const urlValidation = require("url-validation")


const validUrl = function (value) {
    if (value == undefined) { return "Url is mandatory" }
    if (typeof value !== "string") { return "Url must be in string" }
    if (value.trim() == "") { return "Url can not be empty" }
    if (!urlValidation(value)) { return "Invalid URL" }
    return true
}


module.exports = { validUrl }
