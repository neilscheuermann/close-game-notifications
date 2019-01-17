const axios = require('axios')
const cron = require('node-cron')
const secrets = require('./secrets')
const twilio = require('twilio')

const twilioClient = new twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

const sportsFeedsApikey = secrets.API_KEY
const sportsFeedsPassword = secrets.PASSWORD

const encryptedAPIKey = Buffer.from(sportsFeedsApikey + ':' + sportsFeedsPassword).toString('base64')

/*
played status is either UNPLAYED, LIVE, COMPLETED_PENDING_REVIEW, or COMLETED
*/

const todaysDate = new Date();
console.log('todays date: ', todaysDate)

const todaysGames = async () => {
  try {
    const response = await axios({
      type: "GET",
      url: `https://api.mysportsfeeds.com/v2.0/pull/nba/2018-2019-regular/date/20190117/games.json`,
      dataType: 'json',
      headers: {
        "Authorization": "Basic " + encryptedAPIKey
      },
    });

    const games = response.data.games
    const liveGames = games.filter(game => game.schedule.playedStatus === "LIVE").map(game => `${game.schedule.awayTeam.abbreviation} vs. ${game.schedule.homeTeam.abbreviation}`)
    const upcomingGames = games.filter(game => game.schedule.playedStatus === "UNPLAYED").map(game => `${game.schedule.awayTeam.abbreviation} vs. ${game.schedule.homeTeam.abbreviation}`)

    console.log('Today: ', Object.keys(response.data.games[0]));
    console.log('live games: ', liveGames);
    console.log('upcoming games: ', upcomingGames)
  } catch (error) {
    console.error('Neils error: ', error)
  }
}

const fetchCurrentScore = (dateAwayHome) => {
  try {
    return axios({
      method: "get",
      url: `https://api.mysportsfeeds.com/v2.0/pull/nba/2018-2019-regular/games/${dateAwayHome}/boxscore.json`,
      dataType: 'json',
      headers: {
        "Authorization": "Basic " + encryptedAPIKey
      },
    }).then(response => {
      const lastUpdatedOn = response.data.lastUpdatedOn
      const awayTeam = `${response.data.references.teamReferences[0].city} ${response.data.references.teamReferences[0].name}`
      const homeTeam = `${response.data.references.teamReferences[1].city} ${response.data.references.teamReferences[1].name}`
      const currentQuarter = response.data.scoring.currentQuarter
      const currentIntermission = response.data.scoring.currentIntermission
      const quarterOrHalftime = currentIntermission === 1 ? 'end of 1st quarter' : currentIntermission === 2 ? 'halftime' : currentIntermission === 3 ? 'end of 3rd quarter' : currentIntermission === 4 ? 'end of regulation' : ''
      const secondsRemaingingInQuarter = response.data.scoring.currentQuarterSecondsRemaining
      const awayScoreTotal = response.data.scoring.awayScoreTotal
      const homeScoreTotal = response.data.scoring.homeScoreTotal
      const suffix = currentQuarter === 1 ? 'st' : currentQuarter === 2 ? 'nd' : currentQuarter === 3 ? 'rd' : currentQuarter === 4 ? 'th' : ''
      const currentDisplay = () => {
        const score = `${awayTeam}: ${awayScoreTotal} - ${homeTeam}: ${homeScoreTotal}`
        const quarterMessage = `${Math.floor(secondsRemaingingInQuarter/60)}:${secondsRemaingingInQuarter % 60} left in the ${currentQuarter}${suffix}`
        const intermissionMessage = quarterOrHalftime
        const timeRemaining = currentQuarter ? quarterMessage : intermissionMessage
        return `${score} --------- ${timeRemaining}.`
      }

      // console.log('Last updated on: ', lastUpdatedOn);
      // console.log(currentDisplay())
      // console.log('Seconds remaingin in quarter: ', secondsRemaingingInQuarter)
      // console.log('current quarter: ', response.data.scoring.currentQuarter)
      // console.log('current intermission: ', response.data.scoring.currentIntermission)
      // console.log('Played Status: ', response.data.game.playedStatus)

      return currentDisplay();
    }).then(messageToBeSent => {
      // console.log('message to be sent: ', messageToBeSent)

      // twilioClient.messages.create({
      //   to: 8013895313,
      //   from: 4159802839,
      //   body: messageToBeSent
      // })
      return messageToBeSent
    })

  } catch (error) {
    console.error('Neils error: ', error)
  }
}

// When this script is running, todaysLiveGames() will run every 15 seconds.
// COULD FIND A WAY TO DYNAMICALLY INPUT TIMES TO RUN DEPENDING ON THE SCHEDULED GAMES THAT DAY.
// Cron job scheduling examples - https://github.com/kelektiv/node-cron/tree/master/examples

cron.schedule('*/15 * * * * *', () => {
  console.log('cron ran at ' + new Date())
  // todaysGames();
  fetchCurrentScore('20190117-NYK-WAS').then(message => console.log(message));

  // console.log('message from func *****: ', message)
})
