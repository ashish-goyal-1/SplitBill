import * as api from '../api/index'
import configData from '../config.json'
import { handleApiError } from '../utils/errorHandler'

export const login = async (formData, setShowAlert, setAlertMessage) => {
    try {
        const { data } = await api.loginIn(formData)
        localStorage.setItem("profile", JSON.stringify(data))
        window.location.href = configData.DASHBOARD_URL
        return data
    } catch (err) {
        // Check if it's an email not verified error
        if (err.response?.data?.code === 'EMAIL_NOT_VERIFIED') {
            setShowAlert(true)
            setAlertMessage(err.response.data.message)
            return { error: true, code: 'EMAIL_NOT_VERIFIED', email: err.response.data.email }
        }
        return handleApiError(err, setShowAlert, setAlertMessage)
    }
}

export const register = async (formData, setShowAlert, setAlertMessage) => {
    try {
        const { data } = await api.register(formData)
        // Don't auto-login, user must verify email first
        return data
    } catch (err) {
        return handleApiError(err, setShowAlert, setAlertMessage)
    }
}

export const logout = () => {
    localStorage.removeItem("profile");
    window.location.href = configData.LOGIN_URL
}


export const getUser = async (formData, setShowAlert, setAlertMessage) => {
    try {
        const data = await api.getUser(formData)
        return data
    } catch (err) {
        return handleApiError(err, setShowAlert, setAlertMessage)
    }
}

export const getEmailList = async () => {
    try {
        const data = await api.getEmailList()
        return data
    } catch (err) {
        return null
    }
}

export const deleteUser = async (data, setShowAlert, setAlertMessage) => {
    try {
        const response = await api.deleteUser(data)
        localStorage.removeItem("profile")
        window.location.href = configData.USER_DELETED_URL
    } catch (err) {
        return handleApiError(err, setShowAlert, setAlertMessage)
    }
}

export const updatePassword = async (formData, setShowAlert, setAlertMessage, showHomeAlert, homeAlertMessage) => {
    try {
        const { data } = await api.updatePassword(formData)
        showHomeAlert(true)
        homeAlertMessage("Password Updated Successfully!")
        return true
    } catch (err) {
        return handleApiError(err, setShowAlert, setAlertMessage)
    }
}


export const editUser = async (formData, setShowAlert, setAlertMessage, showHomeAlert, homeAlertMessage) => {
    try {
        const { data } = await api.editUser(formData)
        showHomeAlert(true)
        homeAlertMessage("User Updated Successfully!")
        return true
    } catch (err) {
        return handleApiError(err, setShowAlert, setAlertMessage)
    }
}

// Email Verification & Password Reset
export const resendVerificationEmail = async (email, setShowAlert, setAlertMessage) => {
    try {
        const { data } = await api.resendVerification(email)
        return data
    } catch (err) {
        return handleApiError(err, setShowAlert, setAlertMessage)
    }
}

export const forgotPasswordRequest = async (email, setShowAlert, setAlertMessage) => {
    try {
        const { data } = await api.forgotPassword(email)
        return data
    } catch (err) {
        return handleApiError(err, setShowAlert, setAlertMessage)
    }
}