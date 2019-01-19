const createMessagesForNailBiterGames = data => {

  // Creates an array of only the live games.
  const allLiveGames = data.games.filter(
    game => game.schedule.playedStatus === 'LIVE'
  );

  // ***** ADJUST NAIL-BITER PREFERENCES HERE *****
  // Checks to see if any live games are within 10 points with less than 10 minutes remaining in the 4th.
  const nailBiters = allLiveGames.filter(game => {
    if (
      game.score.currentQuarter === 4 &&
      game.score.currentQuarterSecondsRemaining < 600 &&
      Math.abs(game.score.awayScoreTotal - game.score.homeScoreTotal) <= 10
    ) return game
    // return game
  })

  // Creates a human readable message for each nail-biter.
  const nailBiterMessagesArr = nailBiters.map(game => {
    // Uses each team's abbreviations to create a string of their full names.
    const awayTeamAbb = game.schedule.awayTeam.abbreviation;
    const homeTeamAbb = game.schedule.homeTeam.abbreviation;
    const awayTeamFullName = data.references.teamReferences.reduce(
      (name, team) => {
        if (team.abbreviation === awayTeamAbb) {
          name = `${team.city} ${team.name}`;
        }
        return name;
      },
      ''
    );
    const homeTeamFullName = data.references.teamReferences.reduce(
      (name, team) => {
        if (team.abbreviation === homeTeamAbb) {
          name = `${team.city} ${team.name}`;
        }
        return name;
      },
      ''
    );
    // Determines each team's score.
    const awayScoreTotal = game.score.awayScoreTotal;
    const homeScoreTotal = game.score.homeScoreTotal;
    // Finds the value for the current quarter and/or intermission.
    const currentQuarter = game.score.currentQuarter;
    const currentIntermission = game.score.currentIntermission;
    // Creates a message to display if it's an intermission.
    const intermissionMessage =
      currentIntermission === 1
        ? 'end of 1st quarter'
        : currentIntermission === 2
        ? 'halftime'
        : currentIntermission === 3
        ? 'end of 3rd quarter'
        : currentIntermission === 4
        ? 'end of regulation'
        : '';
    // Creates the suffix to display after the appropriate quarter.
    const suffix =
      currentQuarter === 1
        ? 'st'
        : currentQuarter === 2
        ? 'nd'
        : currentQuarter === 3
        ? 'rd'
        : currentQuarter === 4
        ? 'th'
        : '';
    // Determines the minutes and seconds to display in mm:ss format depending on how many total seconds remain in the quarter.
    const totalSecondsRemaingingInQuarter =
      game.score.currentQuarterSecondsRemaining;
    const minutesRemaining = Math.floor(totalSecondsRemaingingInQuarter / 60);
    const secondsRemaining =
      totalSecondsRemaingingInQuarter % 60 > 9
        ? totalSecondsRemaingingInQuarter % 60
        : `0${totalSecondsRemaingingInQuarter % 60}`;

    // Compiles a neat final string using all the above data, depending on whether it's a quarter or an intermission.
    const compiledMessage = () => {
      const score = `${awayTeamFullName}: ${awayScoreTotal} - ${homeTeamFullName}: ${homeScoreTotal}`;
      const quarterMessage = `${minutesRemaining}:${secondsRemaining} left in the ${currentQuarter}${suffix}`;
      const timeRemaining = currentQuarter
        ? quarterMessage
        : intermissionMessage;
      return `${score} --------- ${timeRemaining}.`;
    };

    // Returns the compiled message for each game.
    return {message: compiledMessage(), gameId: game.schedule.id};
  });

  // Returns an array of compiled messages for each live game.
  return nailBiterMessagesArr;
};

// Formats date to YYYYMMDD
const formatDate = (date) => {
  var d = new Date(date),
      month = '' + (d.getMonth() + 1),
      day = '' + d.getDate(),
      year = d.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  return [year, month, day].join('');
}

module.exports = {
  createMessagesForNailBiterGames,
  formatDate
};
