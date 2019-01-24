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
// Returns the current date in YYYYMMDD format
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
cron.schedule('40 19 * * *', () => {
  console.log(`*** Outer cron job ran at ${new Date()} ***`)

  // Checks today's games and returns the time to start and end the inner cron
  // job (1 hour after the first game starts and 3 hours after the last game
  // starts.)
  dailyCronJobSchedule(todaysGames).then(startEnd => {
    const [start, end] = startEnd
    console.log(`*** Inner cron job will check scores every 15 seconds today from ${start}:00 through ${end}:59. (ran at ${new Date()}***`)

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

        // Loops through each object of the nail-biter array.
        else messagesArr.forEach(message => {
          // Sends one notification per close game, then adds message to
          // tracker object to prevent sending repeated messages.
          if (!messageHasBeenSent[message.gameId]) {
            twilioClient.messages.create({
              to: MY_NUMBER,
              from: TWILIO_NUMBER,
              body: message.message
            })
            console.log(`The following message has been sent to subscribers: ${message.message}. (Game id #${message.gameId})` )
            messageHasBeenSent[message.gameId] = true
          } else {
            console.log(`Message for the ${message.teamsPlaying} game has already been sent.`)
          }
        });
      });
    });
  })

})
