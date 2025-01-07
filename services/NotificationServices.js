import admin from "../config/firebase.js"

export const sendPushNotification = async (deviceTokens, title, body) => {
  console.log("--- In sendPushNotification ---");
  console.log("deviceTokens (before filter):", deviceTokens);
  
  deviceTokens = Array.isArray(deviceTokens) 
      ? deviceTokens.filter(token => token) 
      : deviceTokens;

  console.log("deviceTokens (after filter):", deviceTokens);
  console.log("title:", title);
  console.log("body:", body);

    if (Array.isArray(deviceTokens) && deviceTokens.length > 0) {
      // Send notification to multiple devices by looping through deviceTokens
      const results = [];
      for (const token of deviceTokens) {
        const message = {
          token: token,
          notification: {
            title,
            body,
          },
        };
  
        try {
          const response = await admin.messaging().send(message); // send each message individually
          console.log(`Successfully sent message to token ${token}:`, response);
          results.push(response);
        } catch (error) {
          console.error(`Error sending message to token ${token}:`, error);
          results.push(error);
        }
      }
  
      return results;
    } else if (deviceTokens) {
      // Send notification to a single device
      const message = {
        token: deviceTokens, // Single device token
        notification: {
          title,
          body,
        },
      };
  
      try {
        const response = await admin.messaging().send(message); // send to a single token
        console.log("Successfully sent message to a single device:", response);
        return response;
      } catch (error) {
        console.error("Error sending to a single device:", error);
        throw error;
      }
    } else {
      console.error("No device tokens provided.");
      throw new Error("Device tokens are required");
    }
  };

