import { calendar_v3, google } from 'googleapis';
import { constants } from '../constants';

const calendar = google.calendar('v3');

const auth = new google.auth.GoogleAuth({
  credentials: {
    client_email: constants.googleCalendar.clientEmail,
    private_key: constants.googleCalendar.privateKey,
  },
  scopes: ['https://www.googleapis.com/auth/calendar', 'https://www.googleapis.com/auth/calendar.events'],
});

class Respository {
  public async createEvent(event: calendar_v3.Schema$Event) {
    try {
      const authClient = await auth.getClient();
      google.options({ auth: authClient });

      const response = await calendar.events.insert({
        calendarId: constants.googleCalendar.calendarId,
        requestBody: {
          ...event,
          start: {
            dateTime: event.start?.dateTime,
            timeZone: constants.general.timezone,
          },
          end: {
            dateTime: event.end?.dateTime,
            timeZone: constants.general.timezone,
          },
        },
      });

      if (response.status === 200 && response.data.id) return response.data.id;
      return null;
    } catch (err) {
      console.log(`Error at inserEvent ---> ${err}`);
      return null;
    }
  }

  public async deleteEvent(eventId: string) {
    try {
      const authClient = await auth.getClient();
      google.options({ auth: authClient });

      const response = await calendar.events.delete({
        calendarId: constants.googleCalendar.calendarId,
        eventId,
      });

      if (response.status === 200) return true;
      return false;
    } catch (err) {
      console.log(`Error at deleteEvent ---> ${err}`);
      return false;
    }
  }
}

export const GoogleCalendarRepository = new Respository();
