import admin from "../config/firebase";

export const sendPushNotification  = async( deviceToken, title, body) => {
    
    const message = {
        token: deviceToken,
        notification : {
            title,
            body,
        }
    };

    try {
        const response = await admin.messaging().send(message);
        console.log("Successfully send message : ",response);
        return response;
    } catch (error) {
        console.log("Error : ",error);
        throw error;
    }
}

export const sendPushNotificationToMultiple = async (deviceTokens, title, body) => {
    const message = {
        notification : {
            title,
            body,
        },
        tokens : deviceTokens,
    }

    try {
        const response = await admin.messaging.sendMulticast(message);
        console.log("Successfully send message : ",response);
        return response;
    } catch (error) {
        console.log("Error : ",error);
        throw error;
    }
}