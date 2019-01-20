const axios = require('axios');
const cron = require('node-cron');
const twilio = require('twilio');
if (process.env.NODE_ENV !== 'production') require('./secrets');
// Helper functions
const {createMessagesForNailBiterGames, formatDate, dailyCronJobSchedule} = require('./utilityFunctions');
// Secrets
const {
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  SPORTS_FEEDS_API_KEY,
  SPORTS_FEEDS_PASSWORD,
  MY_NUMBER,
  TWILIO_NUMBER,
} = process.env;
const currentDate = formatDate(new Date())

// Authenticating twilio account
const twilioClient = new twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// Encryption code for MySportsFeeds API requests
const mySportsFeedsEncryption = Buffer.from(
  SPORTS_FEEDS_API_KEY + ':' + SPORTS_FEEDS_PASSWORD
).toString('base64');

// Returns a promise for the data of the day's NBA games.
const todaysGames = async () => {
  try {
    // Pulls a JSON file of most up-to-date live data for all of today's games.
    const {data} = await axios({
      type: 'GET',
      url: `https://api.mysportsfeeds.com/v2.0/pull/nba/2018-2019-regular/date/${currentDate}/games.json`,
      dataType: 'json',
      headers: {
        Authorization: 'Basic ' + mySportsFeedsEncryption,
      },
    });

    return data
  } catch (error) {
    console.error('Error within todaysGames function: ', error);
  }
};


// At specified time each day, dailyCronJobSchedule will look at the day's NBA
// schedule and set the inner cron job to run and make axios requests only
// during game hours.
// TODO: On final push to production, will need to set outer cron job once to run at specified time each morning.
cron.schedule('7 10 * * *', () => {
  console.log(`*** Outer cron job ran at ${new Date()} ***`)

  dailyCronJobSchedule(todaysGames).then(startEnd => {
    const [start, end] = startEnd
    console.log(`*** Inner cron job will check scores every 15 seconds from ${start}:00 through ${end}:59. ***`)

    // Object to track if a message about a nail-biter has been sent.
    const messageHasBeenSent = {}

    // This job will run every 15 seconds during hours of live NBA games.
    cron.schedule(`*/15 * ${start}-${end} * * *`, () => {
      console.log(`*** Inner cron job ran at ${new Date()} ***`);

      // Fetches the most recent live data for todays games, passes it to
      // helper function that returns an array of messages for any nail-biter
      // games.
      todaysGames().then(data => createMessagesForNailBiterGames(data)).then(messagesArr => {
        if (!messagesArr.length) console.log('There are no nail-biters.')

        // Loops through each message of the nail-biter array.
        else messagesArr.forEach(message => {
          // Sends one notification per close game, then adds message to
          // tracker object to prevent repeated messages from being sent.
          if (!messageHasBeenSent[message.gameId]) {
            console.log(`The following message has been sent to subscribers: ${message.message}. (Game id #${message.gameId})` )
            twilioClient.messages.create({
              to: MY_NUMBER,
              from: TWILIO_NUMBER,
              body: message.message
            })
            messageHasBeenSent[message.gameId] = true
          } else {
            console.log(`Message for game id #${message.gameId} has already been sent`)
          }
        });
      });
    });
  })

})
