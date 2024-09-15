import axios from 'axios';
import { WEBHOOK } from './config';

const sendSlackAlert = async(message: string): Promise<void> => {
    try {
        await axios.post(WEBHOOK, {
            text: message,
        });
    } catch (error: any) {
        console.error(`failed to send slack notification: ${error.message}`);
    }
};

const sendDiscordAlert = async(message: string): Promise<void> => {
    const response = await axios.post(WEBHOOK, {
        'content': message,
    }, {
        headers: {
            'Content-Type': 'application/json'
        }
    });

    if (response.status === 204) {
        console.log('Message sent successfully!');
    } else {
        console.log('Message failed to send:', response.status);
    }
}

export const sendAlert = sendDiscordAlert;