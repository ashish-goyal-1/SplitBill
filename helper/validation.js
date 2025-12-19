const model = require('../model/schema')
const logger = require('./logger')

exports.notNull = (value) => {
    if (value)
        return true
    else {
        var err = new Error("Please input the required field")
        err.status = 400
        throw err
    }
}

exports.emailValidation = (email) => {
    // Proper email regex - accepts any valid domain (.com, .edu, .ac.in, .co.uk, etc.)
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (email && emailRegex.test(email))
        return true
    else {
        var err = new Error("Please enter a valid email address")
        err.status = 400
        throw err
    }
}

exports.passwordValidation = (pass) => {
    // if(pass)
    // if (pass.search(/[a-z]/) >= 0 && pass.search(/[A-Z]/) >= 0 &&
    //     pass.search(/[0-9]/) >= 0 &&
    //     pass.search(/[!@#$%^&*()]/) >= 0 &&
    //     pass.length >= 8) {
    //     return true
    // } 
    if (pass && pass.length >= 8) {
        return true
    }
    var err = new Error("Password validation fail!!")
    err.status = 400
    throw err
}


exports.currencyValidation = (currency) => {
    const supportedCurrencies = ['INR', 'USD', 'EUR', 'GBP', 'JPY', 'AUD', 'CAD', 'CHF', 'CNY', 'SGD'];
    if (currency && supportedCurrencies.includes(currency.toUpperCase())) {
        return true
    } else {
        var err = new Error(`Currency validation fail! Supported: ${supportedCurrencies.join(', ')}`)
        err.status = 400
        throw err

    }
}


exports.userValidation = async (email) => {
    var user = await model.User.findOne({
        emailId: email
    })
    if (!user)
        return false
    else
        return true
}

exports.groupUserValidation = async (email, groupId) => {
    var groupMembers = await model.Group.findOne({
        _id: groupId
    }, {
        groupMembers: 1,
        _id: 0
    })
    groupMembers = groupMembers['groupMembers']
    if (groupMembers.includes(email))
        return true
    else {
        logger.warn([`Group User Valdation fail : Group ID : [${groupId}] | user : [${email}]`])
        return false
    }
}